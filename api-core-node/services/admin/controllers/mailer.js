import mongoose from "mongoose";
import transporter from "../../../../config/transporter.js";
import CampusTest from "../../../../models/campus/CampusTest.js";
import Users from "../../../../models/core/User.js";

const campusTestEmailSchema = new mongoose.Schema({
  testId: { type: mongoose.Schema.Types.ObjectId, ref: "CampusTest", required: true },
  email: { type: String, required: true, lowercase: true },
  sent: { type: Boolean, default: false },
  lastSentAt: Date,
  password: String,
});
campusTestEmailSchema.index({ testId: 1, email: 1 }, { unique: true });
const CampusTestEmail = mongoose.model("CampusTestEmail", campusTestEmailSchema);

const generatePassword = () => `bk${Math.floor(100000 + Math.random() * 900000)}`;

export const sendEmailsForTest = async (req, res) => {
  const { testId } = req.params;
  let { emails, testDate, testTime, basicInfo } = req.body;

  if (!emails || !Array.isArray(emails) || emails.length === 0) {
    return res.status(400).json({ message: "Emails are required and must be an array" });
  }

  emails = emails.map(e => e.trim().toLowerCase());

  try {
    const test = await CampusTest.findById(testId);
    if (!test) return res.status(404).json({ message: "Test not found" });
    const groupId = test.groupId;

    // Upsert emails into tracking collection
    const bulkOps = emails.map(email => ({
      updateOne: {
        filter: { testId, email },
        update: { $setOnInsert: { sent: false } },
        upsert: true,
      }
    }));
    await CampusTestEmail.bulkWrite(bulkOps);

    // Find all unsent emails for this test
    const unsentEmails = await CampusTestEmail.find({ testId, sent: false });

    for (const entry of unsentEmails) {
      try {
        const plainPassword = generatePassword();

        // Find or create user and assign password, attemptId
        let user = await Users.findOne({ email: entry.email });
        if (user) {
          user.attemptId = groupId;
          user.password = "Student@123";
          await user.save();
        } else {
          user = new Users({
            name: entry.email.split("@")[0],
            email: entry.email,
            password: "Student@123",
            attemptId: groupId,
            role: "user",
            isVerified: true,
          });
          await user.save();
        }

        // Compose formal email content here (hardcoded)
        const emailHtml = `
          <p>Dear Student,</p>

          <p>
            We hope this message finds you well.
          </p>

          <p>
           You have been officially registered for the upcoming BinaryKeeda Practice  Test, scheduled on Tuesday, 29th July 2025, from 7:00 PM to 10:00 PM.
          </p>

          <p><strong>Your login credentials are as follows:</strong></p>
          <ul>
            <li><strong>Test Portal:</strong> <a href="https://campus.binarykeeda.com" target="_blank">https://campus.binarykeeda.com</a></li>
            <li><strong>Registered Email:</strong> ${entry.email}</li>
            <li><strong>Password:</strong> ${plainPassword}</li>
          </ul>

          <p><strong>Important Instructions:</strong></p>
          <ul>
            <li>Please log in at least 15 minutes before the scheduled time.</li>
            <li>Use a laptop or desktop device for optimal performance.</li>
            <li>Only one attempt is permitted per student.</li>
            <li>Ensure a stable internet connection throughout the test duration.</li>
          </ul>

         
          <p>
            If you face any issues during login or test access, please feel free to reach out to us at 
            <a href="mailto:support@binarykeeda.com">support@binarykeeda.com</a>.
          </p>
          <p>
            Incase of recieiving this email multiple times, please try all credentials incase latest one fails.
          </p>
          <p>
            We look forward to your active participation and wish you all the best for the assessment.
          </p>

          <p>Best regards,<br/>
          <strong>Team BinaryKeeda</strong><br/>
          <a href="https://binarykeeda.com" target="_blank">https://binarykeeda.com</a>
          </p>
        `;

        // Send mail
        await transporter.sendMail({
          from: `"BinaryKeeda Team" <noreply@binarykeeda.com>`,
          to: entry.email,
          subject: "Login Credentials for Placement Preparation Test – 27th July 2025",
          html: emailHtml,
        });

        // Update tracking doc
        entry.password = plainPassword;
        entry.sent = true;
        entry.lastSentAt = new Date();
        await entry.save();

        console.log(`Email sent to ${entry.email}`);
      } catch (sendError) {
        console.error(`Failed to send email to ${entry.email}:`, sendError.message);
      }
    }

    const sentCount = await CampusTestEmail.countDocuments({ testId, sent: true });
    const totalCount = await CampusTestEmail.countDocuments({ testId });

    res.json({
      message: "Email sending process completed",
      total: totalCount,
      sent: sentCount,
      pending: totalCount - sentCount,
      completed: true,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getEmailSendingStatus = async (req, res) => {
  const { testId } = req.params;
  try {
    const sentCount = await CampusTestEmail.countDocuments({ testId, sent: true });
    const totalCount = await CampusTestEmail.countDocuments({ testId });

    res.json({
      total: totalCount,
      sent: sentCount,
      pending: totalCount - sentCount,
      completed: totalCount === sentCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
