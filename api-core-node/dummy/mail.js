// import mongoose from "mongoose";
// import bcrypt from "bcryptjs";
// import dotenv from "dotenv";
// import Users from "../../models/core/User.js";
// import transporter from "../../config/transporter.js";

// dotenv.config();

// export const createAndNotifyUsers = async () => {
//   const emailList = [
//     // "adichaitanya.22@gmail.com",
//     // "piyushnautiyal9760@gmail.com",
//     // "nr25122022@gmail.com",
//     // "jasleenkaur1822@gmail.com",
//     // "shivammishra22042005@gmail.com",
//     // "satpreetkaur1712@gmail.com",
//     // "garimaaish1111@gmail.com",
//     // "bharadwajtwinkle14@gmail.com",
//     // "saxenamanasvi6@gmail.com",
//     // "rbatra719@gmail.com",
//     // "2005pranavv@gmail.com",
//     // "poorviarora2005@gmail.com",
//     // "harshkamboj413@gmail.com",
//     // "sahays993@gmail.com",
//     // "abhishreepanwar@gmail.com",
//     // "snehadhir7998@gmail.com",
//     // "pranyagupta1345@gmail.com",
//     // "monga.purva@gmail.com",
//     // "chaitanyaagaur@gmail.com",
//     // "manshiverma08044@gmail.com",
//     // "sehajpunia34@gmail.com",
//     // "Kritika.raghav12@gmail.com",
//     // "charvieganjoo@gmail.com",
//     // "manasvi354@gmail.com",
//     // "sheetalbijalwan2005@gmail.com",
//     // "ankitnotnani.work@gmail.com",
//     // "divyamk957@gmail.com",
//     // "Prachi.padodara.19@gmail.com",
//     // "harshitabhatnagar05@gmail.com",
//     "aryanbhandari4077@gmail.com", // Replace with your real email
//   ];

//   const uniqueEmails = [...new Set(emailList.map(e => e.toLowerCase()))];

//   const generatePassword = () =>
//     Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-2);




//   for (const email of uniqueEmails) {
//     const plainPassword = generatePassword();

//     const existing = await Users.findOne({ email });
//     if (existing) {
//       console.log(`⚠️ Skipping ${email} (already exists)`);
//       continue;
//     }

//     // const hashedPassword = await bcrypt.hash(plainPassword, 10);

//     const user = new Users({
//       name: email.split("@")[0],
//       email,
//       password: plainPassword,
//       role: "user",
//       campusId: 2,
//       isVerified: true,
//     });

//     try {
//       await user.save();
//       console.log(`✅ Created user: ${email}`);

//       await transporter.sendMail({

//         from: `"BinaryKeeda Team" <${process.env.EMAIL}>`,
//         to: email,
//         subject: "Your BinaryKeeda Account Credentials",
//         html: `
//             <p>Hi ${user.name},</p>

//             <p>Welcome to <strong>BinaryKeeda</strong>! Your account has been successfully created.</p>

//             <p>
//             <strong>Email:</strong> ${email}<br/>
//             <strong>Password:</strong> ${plainPassword}
//             </p>

//             <p>
//             You can now log in and take the test as part of the Guidance Program.<br/>
//             Access the platform here: <a href="https://campus.binarykeeda.com" target="_blank">https://campus.binarykeeda.com</a>
//             </p>

//             <p>
//             <strong>Test Timings:</strong> 3:00 P.M - 5:00 P.M
//             </p>

//             <p>
//             Best regards,<br/>
//             The BinaryKeeda Team
//             </p>

//         `,
//       });

//       console.log(`📩 Email sent to: ${email}`);
//     } catch (err) {
//       console.error(`❌ Failed for ${email}:`, err.message);
//     }
//   }

// };

// // To run it
// // createAndNotifyUsers().then(() => {
// //   console.log("🎉 All done");
// // }).catch(err => {
// //   console.error("❌ Error in process:", err);
// // });

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import Users from "../../models/core/User.js";
import transporter from "../../config/transporter.js";

dotenv.config();

export const createAndNotifyUsers = async () => {
 const emailList = [
    "adichaitanya.22@gmail.com",
    "piyushnautiyal9760@gmail.com",
    "nr25122022@gmail.com",
    "jasleenkaur1822@gmail.com",
    "shivammishra22042005@gmail.com",
    "satpreetkaur1712@gmail.com",
    "garimaaish1111@gmail.com",
    "bharadwajtwinkle14@gmail.com",
    "saxenamanasvi6@gmail.com",
    "rbatra719@gmail.com",
    "2005pranavv@gmail.com",
    "poorviarora2005@gmail.com",
    "harshkamboj413@gmail.com",
    "sahays993@gmail.com",
    "abhishreepanwar@gmail.com",
    "snehadhir7998@gmail.com",
    "pranyagupta1345@gmail.com",
    "monga.purva@gmail.com",
    "chaitanyaagaur@gmail.com",
    "manshiverma08044@gmail.com",
    "sehajpunia34@gmail.com",
    "Kritika.raghav12@gmail.com",
    "charvieganjoo@gmail.com",
    "manasvi354@gmail.com",
    "sheetalbijalwan2005@gmail.com",
    "ankitnotnani.work@gmail.com",
    "divyamk957@gmail.com",
    "Prachi.padodara.19@gmail.com",
    "harshitabhatnagar05@gmail.com",
    "aryanbhandari4077@gmail.com", 
    "guptaaryan131@gmail.com"
  ];

  const uniqueEmails = [...new Set(emailList.map(e => e.toLowerCase()))];

  const generatePassword = () => `bk${Math.floor(100000 + Math.random() * 900000)}`;

  // Load PDF once (assuming it's placed in public or root folder)
  const manualPath = path.resolve("api-core-node/dummy/manuals/MANUAL.pdf");
  const pdfBuffer = fs.readFileSync(manualPath);

  for (const email of uniqueEmails) {
    const plainPassword = generatePassword();

    const existing = await Users.findOne({ email });
    if (existing) {
      console.log(`⚠️ Skipping ${email} (already exists)`);
      continue;
    }

    const user = new Users({
      name: email.split("@")[0],
      email,
      password: plainPassword,
      role: "user",
      campusId: 2,
      isVerified: true,
    });

    try {
      await user.save();
      console.log(`✅ Created user: ${email}`);

      await transporter.sendMail({
        from: `"BinaryKeeda Team" <${process.env.EMAIL}>`,
        to: email,
        subject: "Your BinaryKeeda Account Credentials + Test Guide",
        html: `
          <p>Hi ${user.name},</p>

          <p>Welcome to <strong>BinaryKeeda</strong>! Your account has been successfully created.</p>

          <p>
            <strong>Email:</strong> ${email}<br/>
            <strong>Password:</strong> ${plainPassword}
          </p>

          <p style="color: red; font-weight: bold;">
            🔗 Login & Attempt the Test here: <a href="https://campus.binarykeeda.com" target="_blank">https://campus.binarykeeda.com</a>
          </p>

          <h3>📝 How to Attempt the Test:</h3>
          <ol>
            <li>Click the link above to open the platform.</li>
            <li>Login using the credentials provided above.</li>
            <li>Read and agree to the instructions shown before the test.</li>
            <li>Click <strong>"Start Test"</strong> to begin.</li>
            <li>Attempt all sections within the allotted time.</li>
          </ol>

          <p><strong>Test Timings:</strong> 2:00 P.M - 4:00 P.M</p>

          <p>We've also attached a short PDF manual to help you understand the test process.</p>

          <p>
            Best regards,<br/>
            The BinaryKeeda Team
          </p>
        `,
        attachments: [
          {
            filename: "BinaryKeeda_Test_Guide.pdf",
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      });

      console.log(`📩 Email + PDF sent to: ${email}`);
    } catch (err) {
      console.error(`❌ Failed for ${email}:`, err.message);
    }
  }
};

// To run
// createAndNotifyUsers().then(() => {
//   console.log("🎉 All done");
// }).catch(err => {
//   console.error("❌ Error in process:", err);
// });
