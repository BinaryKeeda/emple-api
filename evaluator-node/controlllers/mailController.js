import { USER_JWT_SECRET } from "../../config/config.js";
import Users from "../../models/core/User.js";
import { mainQueue } from "../queues/mainQueue.js";
import { getMailTemplate } from "../utils/getTemplate.js";
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { configDotenv } from 'dotenv';
import { userEntryBoiler } from "./utils/userEntry.js";
configDotenv();

export const signUpRequest = async (req, res) => {
  try {
    const { email } = req.body

    if (!email || !email.includes('@')) {
      return res.status(400).json({ message: 'Valid email is required' })
    }

    let user = await Users.findOne({ email })

    // ✅ If user exists and is already verified, don't allow
    if (user && user.isVerified) {
      return res.status(400).json({ message: 'Email already exists' })
    }

    // ✅ If user doesn't exist, create
    if (!user) {
      user = new Users({ email })
    }

    // ✅ Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // ✅ Store hash and expiry
    const hash = crypto.createHash('sha256').update(otp).digest('hex')
    user.otp = hash
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    await user.save()

    // ✅ Send OTP via email
    const mailData = {
      from: `"BinaryKeeda" <noreply@binarykeeda.com>`,
      to: email,
      subject: 'Your BinaryKeeda OTP Code',
      html: getOtpMail(otp, 2),
      text: `Your OTP is: ${otp}. It will expire in 10 minutes.`
    }

    await mainQueue.add('sendMail', mailData, { priority: 5 })

    return res.status(200).json({ message: 'OTP sent to your email' })
  } catch (err) {
    console.error('OTP Signup Error:', err)
    res.status(500).json({ message: 'Internal Server Error' })
  }
}

export const resetPassword = async (req , res) => {
    try {
        const {email} = req.body;
        let user = await Users.findOne({email});
        if(!user) return res.status(400).json({message: "Email does not exist"});

        const token = jwt.sign({ email }, USER_JWT_SECRET, { expiresIn: "10m" });
        const verifyLink = `${process.env.RESET_URL}/reset/${encodeURIComponent(token)}`;
        user.verificationToken = token;
        user.save();
        const mailData = {
            from: `"BinaryKeeda" <noreply@binarykeeda.com>`,
            to: email,
            subject: "Your password reset link is here",
            html: getMailTemplate(verifyLink,2)
        }
        mainQueue.add('sendMail' , mailData , {priority:5});
        res.status(200).json({message: "Email sent successfully"});
    }catch(error) {
        res.status(500).json({message: "Internal Server Error"});
    }

}

export const userFeedback = async (req,res) => {
  try{
    const {name, email,message} = req.body;
     const mailData = {
            from: `"BinaryKeeda" <noreply@binarykeeda.com>`,
            to: "binarykeeda.education@gmail.com",
            subject: "Feedback Recieved" ,
            html:`
             <p>
              ${name}, ${email} , ${message}
             </p>
            `
        }
        mainQueue.add('sendMail' , mailData , {priority:5});
  }catch(e) {
     res.status(500).json({message: "Internal Server Error"});
  } 
}

function getOtpMail(otp, type) {
  if (type === 2) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Your OTP Code - BinaryKeeda</title>
</head>
<body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color:#f9f9f9;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f9f9f9">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="margin: 40px auto; border-radius: 8px; box-shadow: 0 0 5px rgba(0,0,0,0.05);">
          <tr>
            <td align="center" style="padding: 30px 20px; background-color: #ffffff;">
              <h1 style="color: #ff6600; margin: 0;">BinaryKeeda</h1>
              <p style="font-size: 18px; color: #333333; margin: 20px 0 10px;">Email Verification OTP</p>
              <p style="font-size: 14px; color: #666666; margin: 0 0 20px;">
                Use the OTP below to verify your email address.
              </p>
              <div style="display: inline-block; padding: 15px 25px; background-color: #f4f4f4; border-radius: 6px; font-size: 32px; font-weight: bold; color: #333333; letter-spacing: 5px; margin: 10px 0 20px;">
                ${otp}
              </div>
              <p style="font-size: 14px; color: #666;">This OTP is valid for 10 minutes.</p>
              <p style="font-size: 12px; color: #888888; margin-top: 30px;">
                If you did not request this OTP, you can safely ignore this email.
              </p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              <p style="font-size: 12px; color: #aaa;">© ${new Date().getFullYear()} BinaryKeeda. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
  }
}

export const campusMailer = (req,res) => {
  try {
    const { name , email, role , password} = req.body;
    const mailData = {
          from: `"BinaryKeeda" <noreply@binarykeeda.com>`,
          to: email,
          subject: "Welcome to BinaryKeeda",
          html: userEntryBoiler({name , email, role , password})
    }
    mainQueue.add('sendMail' , mailData , {priority:5});
    return res.status(200).json({message:"Mail sent"});
  }catch(e) {
    return res.status(500).json({message:"Server Errror"});
  
  }
}

