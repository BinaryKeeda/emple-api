import mongoose from "mongoose";
import CampusTestSolution from "../../../models/campus/CampusTestSolution.js";
import { QuestionBank } from "../../../models/shared/questionBank.js";
import fs from 'fs'
import { response } from "express";


export const createAnalysis = async () => {
  // Fetch the question banks
  const questionsSection1 = await QuestionBank.findById("686ad9ee8a744413610bb71b");
  const questionsSection2 = await QuestionBank.findById("686ada593133ebe6e6edfb59");

const yesterday10AM = new Date();
    yesterday10AM.setDate(yesterday10AM.getDate() - 1);
    yesterday10AM.setHours(10, 0, 0, 0); // yesterday at 10:00 AM

    const solutions = await CampusTestSolution.find({
    testId: "686e6d15c4f3a23dfab6daae",
    "response.0.startedAt": { $exists: true, $gt: yesterday10AM }
    }).populate("userId");

    const stats = solutions.map((s,idx) => {

        const startedAt = new Date(s.response[0]?.startedAt)?.toLocaleString();
        const userEmail = s.userId?.email;
        const sectionsAttempted = s.response?.length;
        console.log(startedAt);

        return {
            startedAt,
            userEmail,
            sectionsAttempted
        }
    }) ;
      fs.writeFileSync("user_stats.json", JSON.stringify(stats, null, 2));




//     console.log(solutions.length)

//   const questionFrequencyMap = new Map(); // { questionId: count }

//   // Analyze each user
//   solutions.forEach((s) => {
//     try {
//       if (!Array.isArray(s.testSnapshot)) return;

//       const questionIds = new Set(); // To avoid duplicates per user

//       for (let i = 0; i < Math.min(2, s.testSnapshot.length); i++) {
//         const section = s.testSnapshot[i];
//         if (Array.isArray(section?.questions)) {
//           section.questions.forEach((q) => {
//             const id = q._id?.toString?.() || q.questionId?.toString?.();
//             if (id) questionIds.add(id);
//           });
//         }
//       }

//       // Update frequency map
//       for (const qid of questionIds) {
//         questionFrequencyMap.set(qid, (questionFrequencyMap.get(qid) || 0) + 1);
//       }
//     } catch (err) {
//       console.error("Error processing user:", err.message);
//     }
//   });

//   // Combine all questions from both sections into a lookup map
//   const allQuestionsMap = new Map();
//   [...(questionsSection1.questions || []), ...(questionsSection2.questions || [])].forEach((q) => {
//     const id = q._id.toString();
//     allQuestionsMap.set(id, q);
//   });

//   // Create enriched question stats
//   const questionStats = Array.from(questionFrequencyMap.entries()).map(([id, count]) => {
//     const question = allQuestionsMap.get(id);
//     return {
//       _id: id,
//       seenBy: count,
//       questionText: question?.question || "Not found",
//     //   options: question?.options || [],
//       correctAnswer: question?.correctAnswer || null,
//     };
//   });

//   // Sort by frequency descending
//   questionStats.sort((a, b) => b.seenBy - a.seenBy);

//   // Output summary
//   console.log("Total unique questions seen by users:", questionStats.length);

//   console.log("\n=== Top 10 Most Seen Questions ===");
//   questionStats.slice(0, 10).forEach((q, i) => {
//     console.log(`${i + 1}. ID: ${q._id} | Seen by: ${q.seenBy}`);
//     console.log(`Q: ${q.questionText}`);
//     console.log(`Options: ${q.options?.join(", ")}`);
//     console.log(`Answer: ${q.correctAnswer}`);
//     console.log("----");
//   });

//   console.log("\n=== Bottom 10 Least Seen Questions ===");
//   questionStats.slice(-10).forEach((q, i) => {
//     console.log(`${questionStats.length - 9 + i}. ID: ${q._id} | Seen by: ${q.seenBy}`);
//     console.log(`Q: ${q.questionText}`);
//     console.log(`Options: ${q.options?.join(", ")}`);
//     console.log(`Answer: ${q.correctAnswer}`);
//     console.log("----");
//   });

  // Optional: Write to JSON file
//   fs.writeFileSync("user_stats.json", JSON.stringify(questionStats, null, 2));
};
