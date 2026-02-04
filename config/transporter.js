import { configDotenv } from 'dotenv';
configDotenv();
import nodemailer from 'nodemailer';

// const transporter = nodemailer.createTransport({
//     host: "smtp.zoho.in",
//     port: 465,
//     secure: true,
//     auth: {
//       user: process.env.EMAIL,
//       pass: process.env.PASS,
//     },
//   });

  const transporter = nodemailer.createTransport({
  host: "smtp.zeptomail.in",
  port: 587,
  secure: false, // TLS
  auth: {
    user: "emailapikey", // from ZeptoMail dashboard
    pass: "PHtE6r1YEb+6imEnoxVV5Pa9EsP1ZoMq+epkfgYV5YsWCvEEGU1VrtkikGfh+kwvXaVCRqPJyohruLqasu7TJmjqZmlJCWqyqK3sx/VYSPOZsbq6x00Zs1secETVUITtdtVr3SbTstjfNA==",                  // your SMTP password
  },
});
export default transporter;
