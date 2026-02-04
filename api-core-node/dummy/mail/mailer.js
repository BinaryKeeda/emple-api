import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import { parse } from "csv-parse/sync"; // npm i csv-parse
import mongoose from "mongoose";
import Users from "../../../models/core/User.js";
import { group } from "console";
import CampusTest from "../../../models/campus/CampusTest.js";

// Load environment variables
dotenv.config();



// Create transporter with ZeptoMail SMTP config
const transporter = nodemailer.createTransport({
  host: "smtp.zeptomail.in",
  port: 587,
  secure: false, // TLS
  auth: {
    user: "emailapikey", // from ZeptoMail dashboard
    pass: "PHtE6r1YEb+6imEnoxVV5Pa9EsP1ZoMq+epkfgYV5YsWCvEEGU1VrtkikGfh+kwvXaVCRqPJyohruLqasu7TJmjqZmlJCWqyqK3sx/VYSPOZsbq6x00Zs1secETVUITtdtVr3SbTstjfNA==",                  // your SMTP password
  },
});

// Main function
export const createAndNotifyUsers = async (id) => {
  const chunkFilePath = "./api-core-node/dummy/mail/emails.csv"; // CSV file
  const manualPath = path.resolve("./api-core-node/dummy/manuals/BinaryKeeda_Test_Guide.pdf"); // PDF manual
  const test = await CampusTest.findById(id);
  const fileContent = fs.readFileSync(chunkFilePath, "utf-8");
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });
let uniqueEmails = [
  ...new Set(
    records
      .map(row => row["Email"]?.toLowerCase())
      .filter(Boolean) // removes undefined/null/empty
  )
];

fs.writeFileSync("emails.json", JSON.stringify(uniqueEmails, null, 2));

  return;
  const pdfBuffer = fs.readFileSync(manualPath);

  uniqueEmails = [
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
"garimaaish1111@gmail.com",
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
"harshitabhatnagar05@gmail.com"

  ]
  console.log(uniqueEmails);

  const generatePassword = () => `bk${Math.floor(100000 + Math.random() * 900000)}`;

  for (const email of uniqueEmails) {
    const plainPassword = generatePassword();

    let user  = await Users.findOne({ email });
   
    if (user) {
        user.password = plainPassword;
        console.log(`✅ Updated user: ${email}`);
    }else {
      user = new Users({
        name: email.split("@")[0],
        email,
        password: plainPassword,
         attemptId:test.groupId,
        role: "user",
        isVerified: true,
        attem
      });
      console.log(`✅ Created user: ${email}`);
    }



    try {
      await user.save();


    await transporter.sendMail({
  from: `"BinaryKeeda Team" <noreply@binarykeeda.com>`,
  to: email,
  subject: "Your BinaryKeeda AMCAT Practice Test Credentials",
  html: `
    <p>Dear ${user.name},</p>

    <p>Thank you for filling out the form for the <strong>AMCAT Test Preparation</strong>.</p>
    <p>There was an issue with previous credential which was reviewd & updated Please use latest credentials</p>
    <p>
      As you are aware, a <strong>badge verification process</strong> will be conducted by your college in the month of <strong>August</strong> before the official AMCAT is scheduled. 
      In the meantime, we are providing you access to a full-length <strong>AMCAT Practice Test</strong> to help you prepare effectively.
    </p>
        <h3 style="color: red; font-weight: bold;">
      Practice Test Link: <a href="https://campus.binarykeeda.com" target="_blank">https://campus.binarykeeda.com</a>
    </h3>

    <h3>Test Details:</h3>
    <ul>
      <li><strong>Date:</strong> Thursday, July 10, 2025</li>
      <li><strong>Time:</strong> 12:00 PM – 1:30 PM</li>
    </ul>

    <h3>Your Login Credentials:</h3>
    <ul>
      <li><strong>Email:</strong> ${email}</li>
      <li><strong>Password:</strong> ${plainPassword}</li>
    </ul>



    <h3>How to Attempt:</h3>
    <ol>
      <li>Open the platform using the link above.</li>
      <li>Log in with the credentials shared above.</li>
      <li>Read and agree to the instructions displayed before starting the test.</li>
      <li>Click <strong>"Start Test"</strong> to begin.</li>
      <li>Attempt all sections within the given time.</li>
    </ol>

    <p>You can also refer to the Test Guide here: 
      <a href="https://res.cloudinary.com/drzyrq7d5/image/upload/v1751926294/BinaryKeeda_Test_Guide_tuwbnd.pdf" target="_blank">
        BinaryKeeda_Test_Guide.pdf
      </a>
    </p>

    <p>We wish you all the best for your preparation!</p>

    <p>
      Warm regards,<br/>
      <strong>BinaryKeeda Team</strong>
    </p>
  `,
});


      console.log(`📩 Email + PDF sent to: ${email}`);
    } catch (err) {
      console.error(`❌ Failed for ${email}:`, err.message);
    }
  }

  console.log("🚀 All done!");
};

// Execute
