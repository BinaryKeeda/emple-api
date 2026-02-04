import crypto from 'crypto'
import Users from '../../../../models/core/User.js'

export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' })
    }

    const user = await Users.findOne({ email })
    if (!user || !user.otp || !user.otpExpires) {
      return res.status(400).json({ message: 'Invalid or expired OTP' })
    }

    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'OTP has expired' })
    }

    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex')
    if (hashedOtp !== user.otp) {
      return res.status(400).json({ message: 'Invalid OTP' })
    }

    // ✅ OTP is valid
    user.isVerified = true
    user.otp = undefined
    user.otpExpires = undefined
    await user.save()

    // ✅ Use Passport to login and start session
    req.login(user, err => {
      if (err) return next(err)
      return res.status(200).json({
        message: 'OTP verified and login successful',
        user
      })
    })
  } catch (error) {
    console.error('OTP verification failed:', error)
    return res.status(500).json({ message: 'Server error' })
  }
}
