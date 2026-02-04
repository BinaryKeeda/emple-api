// import redis from "../../../../config/redisConn.js";
// import CampusTest from "../../../../models/campus/CampusTest.js";
// import CampusTestSolution from "../../../../models/campus/CampusTestSolution.js";
// import { QuestionBank } from "../../../../models/shared/questionBank.js";
// import Problem from "../../../../models/test/Problem.js";

// // Fisher-Yates Shuffle
// const shuffleArray = (arr) => {
//   let i = arr.length;
//   while (--i > 0) {
//     const randIdx = Math.floor(Math.random() * (i + 1));
//     [arr[i], arr[randIdx]] = [arr[randIdx], arr[i]];
//   }
//   return arr;
// };

// // Redis Key Helper (now includes section ID)
// const CACHE_KEY = (testId, sectionId) => `test:${testId}:sectio:${sectionId}:problemPool`;

// // Cache problem pool for a specific section
// const cacheProblemPool = async (testId, sectionId, problemIds) => {
//   const problems = await Problem.find({ _id: { $in: problemIds } }).lean();

//   const key = CACHE_KEY(testId, sectionId);
//   const serialized = JSON.stringify(problems);

//   await redis.set(key, serialized);
//   await redis.expire(key, 3600); // 1 hour TTL

//   return problems;
// };

// // Get problems from cache or fallback to DB
// const getCachedOrFreshProblems = async (testId, sectionId, problemIds) => {
//   const key = CACHE_KEY(testId, sectionId);
//   const cached = await redis.get(key);
//   if (cached) {
//     try {
//       return JSON.parse(cached);
//     } catch (err) {
//       console.error(`Failed to parse Redis data for key ${key}. Refetching from DB.`);
//     }
//   }
//   return await cacheProblemPool(testId, sectionId, problemIds);
// };

// // Create snapshot of a test
// const createTestSnapshot = async (test) => {
//   const snapshotPromises = test.sections.map(async (section) => {
//     const snapshot = {
//       type: section.type,
//       sectionId: section._id.toString(),
//       title: section.title,
//       maxTime: section.maxTime,
//       maxScore: section.maxScore,
//     };

//     const maxQ = section.maxQuestion || 0;

//     // Quiz or mixed section — get questions from pool document
//     if (section.type === "quiz" || section.type === "mixed") {
//       const pickCount = section.type === "mixed" ? Math.floor(maxQ / 2) : maxQ;

//       const poolDoc = await QuestionBank.findById(section.questionPool).lean();
//       if (!poolDoc || !Array.isArray(poolDoc.questions)) {
//         throw new Error(`Invalid or missing questionPool for section "${section.title}"`);
//       }

//       const questions = shuffleArray([...poolDoc.questions]).slice(0, pickCount);
//       snapshot.questions = questions;
//     }

//     // Coding or mixed section — get problems
//     if (section.type === "coding" || section.type === "mixed") {
//       const pickCount = section.type === "mixed" ? Math.ceil(maxQ / 2) : maxQ;

//       const fullProblemPool = await getCachedOrFreshProblems(
//         test._id,
//         section._id,
//         section.problemPool
//       );

//       const sampled = shuffleArray([...fullProblemPool]).slice(0, pickCount);
//       snapshot.problems = sampled;
//     }

//     snapshot.meta = {
//       totalQuestions: snapshot.questions?.length || 0,
//       totalProblems: snapshot.problems?.length || 0,
//     };

//     return snapshot;
//   });

//   return await Promise.all(snapshotPromises);
// };

// // Get or Create Test Solution
// export const getUserTestSolution = async (req, res) => {
//   try {
//     const { testId, userId } = req.body;
//     if (!testId || !userId) {
//       return res.status(400).json({ message: "Missing fields" });
//     }

//     const test = await CampusTest.findById(testId)
//       .select(
//         "sections.title sections._id sections.type sections.maxQuestion sections.maxTime sections.maxScore sections.questionPool sections.problemPool"
//       )
//       .lean();

//     if (!test) {
//       return res.status(404).json({ message: "No Test found" });
//     }

//     let testSolution = await CampusTestSolution.findOne({ testId, userId });

//     if (!testSolution) {
//       const testSnapshot = await createTestSnapshot(test);

//       testSolution = await CampusTestSolution.create({
//         testId,
//         userId,
//         testSnapshot,
//       });

//       return res.status(201).json({
//         message: "Test solution created",
//         data: testSolution,
//       });
//     }

//     return res.status(200).json({
//       message: "Test solution found",
//       data: testSolution,
//     });
//   } catch (error) {
//     console.error("Error in getUserTestSolution:", error);
//     return res.status(500).json({ message: "Internal Server Error" });
//   }
// };

// // Mark test as started
// export const startTest = async (req, res) => {
//   try {
//     const { submissionId } = req.body;
//     if (!submissionId) {
//       return res.status(400).json({ message: "Missing submissionId" });
//     }

//     const updated = await CampusTestSolution.updateOne(
//       { _id: submissionId },
//       { $set: { hasAgreed: true } }
//     );

//     if (updated.matchedCount === 0) {
//       return res.status(404).json({ message: "No test solution found" });
//     }

//     return res.status(200).json({ message: "Test started" });
//   } catch (error) {
//     console.error("Error in startTest:", error);
//     return res.status(500).json({ message: "Internal Server Error" });
//   }
// };



// ==========================================

import redis from "../../../../config/redisConn.js";
import CampusTest from "../../../../models/campus/CampusTest.js";
import CampusTestSolution from "../../../../models/campus/CampusTestSolution.js";
import { QuestionBank } from "../../../../models/shared/questionBank.js";
import Problem from "../../../../models/test/Problem.js";

// Fisher-Yates Shuffle
const shuffleArray = (arr) => {
  let i = arr.length;
  while (--i > 0) {
    const randIdx = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[randIdx]] = [arr[randIdx], arr[i]];
  }
  return arr;
};

// Redis Key Helpers
const QUESTION_CACHE_KEY = (testId, sectionId) => `test:${testId}:section:${sectionId}:questionPool`;
const PROBLEM_CACHE_KEY = (testId, sectionId) => `test:${testId}:section:${sectionId}:problemPool`;

// Cache and Fetch MCQ Questions
const cacheQuestionPool = async (testId, sectionId, questionPoolId) => {
  const poolDoc = await QuestionBank.findById(questionPoolId).lean();
  if (!poolDoc || !Array.isArray(poolDoc.questions)) {
    throw new Error(`Invalid or missing questionPool for section ${sectionId}`);
  }

  const shuffled = shuffleArray([...poolDoc.questions]).slice(0, 100);
  const key = QUESTION_CACHE_KEY(testId, sectionId);

  await redis.set(key, JSON.stringify(shuffled));
  await redis.expire(key, 4600); // 1 hour TTL

  return shuffled;
};

const getCachedOrFreshQuestions = async (testId, sectionId, questionPoolId) => {
  const key = QUESTION_CACHE_KEY(testId, sectionId);
  const cached = await redis.get(key);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (err) {
      console.error(`Failed to parse Redis data for key ${key}. Refetching from DB.`);
    }
  }
  return await cacheQuestionPool(testId, sectionId, questionPoolId);
};

// Cache and Fetch Coding Problems
const cacheProblemPool = async (testId, sectionId, problemIds) => {
  const problems = await Problem.find({ _id: { $in: problemIds } }).lean();
  const key = PROBLEM_CACHE_KEY(testId, sectionId);
  await redis.set(key, JSON.stringify(problems));
  await redis.expire(key, 3600); // 1 hour TTL
  return problems;
};

const getCachedOrFreshProblems = async (testId, sectionId, problemIds) => {
  const key = PROBLEM_CACHE_KEY(testId, sectionId);
  const cached = await redis.get(key);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (err) {
      console.error(`Failed to parse Redis data for key ${key}. Refetching from DB.`);
    }
  }
  return await cacheProblemPool(testId, sectionId, problemIds);
};

// Snapshot Creator
const createTestSnapshot = async (test) => {
  const snapshotPromises = test.sections.map(async (section) => {
    const snapshot = {
      type: section.type,
      sectionId: section._id.toString(),
      title: section.title,
      maxTime: section.maxTime,
      maxScore: section.maxScore,
    };

    const maxQ = section.maxQuestion || 0;

    // Quiz or Mixed Section - Questions
    if (section.type === "quiz" || section.type === "mixed") {
      const pickCount = section.type === "mixed" ? Math.floor(maxQ / 2) : maxQ;

      const fullQuestionPool = await getCachedOrFreshQuestions(
        test._id,
        section._id,
        section.questionPool
      );

      snapshot.questions = shuffleArray([...fullQuestionPool]).slice(0, pickCount);
    }

    // Coding or Mixed Section - Problems
    if (section.type === "coding" || section.type === "mixed") {
      const pickCount = section.type === "mixed" ? Math.ceil(maxQ / 2) : maxQ;

      const fullProblemPool = await getCachedOrFreshProblems(
        test._id,
        section._id,
        section.problemPool
      );

      snapshot.problems = shuffleArray([...fullProblemPool]).slice(0, pickCount);
    }

    snapshot.meta = {
      totalQuestions: snapshot.questions?.length || 0,
      totalProblems: snapshot.problems?.length || 0,
    };

    return snapshot;
  });

  return await Promise.all(snapshotPromises);
};

// Create or Fetch Test Solution
export const getUserTestSolution = async (req, res) => {
  try {
    const { testId, userId } = req.body;
    if (!testId || !userId) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const test = await CampusTest.findById(testId)
      .select(
        "sections.title sections._id sections.type sections.maxQuestion sections.maxTime sections.maxScore sections.questionPool sections.problemPool"
      )
      .lean();

    if (!test) {
      return res.status(404).json({ message: "No Test found" });
    }

    let testSolution = await CampusTestSolution.findOne({ testId, userId });

    if (!testSolution) {
      const testSnapshot = await createTestSnapshot(test);



      testSolution = await CampusTestSolution.create({
        testId,
        userId,
        testSnapshot,
      });

      // return res.status(201).json({
      //   message: "Test solution created",
      //   data:{
      //     ...testSolution.toObject(),
      //     testSnapshot: sanitizeTestSnapshot(testSolution.testSnapshot),
      //   },
      // });
    }

    return res.status(200).json({
      message: "Test solution found",
      data:{
        ...testSolution.toObject(),
        testSnapshot: sanitizeTestSnapshot(testSolution.testSnapshot),
        // columns: test.userDetails || [],
        columns: ['name', 'email' , 'sapId', 'phone'],
      },
    });
  } catch (error) {
    console.error("Error in getUserTestSolution:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Mark Test as Started
export const startTest = async (req, res) => {
  try {
    const { submissionId } = req.body;
    if (!submissionId) {
      return res.status(400).json({ message: "Missing submissionId" });
    }

    const updated = await CampusTestSolution.updateOne(
      { _id: submissionId },
      { $set: { hasAgreed: true } }
    );

    if (updated.matchedCount === 0) {
      return res.status(404).json({ message: "No test solution found" });
    }

    return res.status(200).json({ message: "Test started" });
  } catch (error) {
    console.error("Error in startTest:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
export const markUFM = async (req, res) => {
  try {
    const { submissionId } = req.body;
    if (!submissionId) {
      return res.status(400).json({ message: "Missing submissionId" });
    }

    // Step 1: Increment ufmAttempts and return the updated document
    const updated = await CampusTestSolution.findOneAndUpdate(
      { _id: submissionId },
      { $inc: { ufmAttempts: 1 } },
      { new: true }
    );

    // Step 2: If not found
    if (!updated) {
      return res.status(404).json({ message: "Submission not found." });
    }

    // // Step 3: If ufmAttempts exceeds 1, mark isSubmitted as true
    // if (updated.ufmAttempts > 1 && !updated.isSubmitted) {
    //   updated.isSubmitted = true;
    //   await updated.save();
    //   return res.status(200).json({ message: "UFM count exceeded. Marked as submitted.",submitted:true, result: updated });
    // }

    return res.status(200).json({ message: "UFM marked successfully.",submitted:false, result: updated });
  } catch (e) {
    console.error("Error in markUFM:", e);
    return res.status(500).json({ message: "Internal Server Error", error: e.message });
  }
};


export const submitDetails = async (req, res) => {  
  try {
    const { submissionId, userDetails } = req.body;
    if (!submissionId || !userDetails) {
      return res.status(400).json({ message: "Missing submissionId or userDetails" });
    }
    
    const updated = await CampusTestSolution.findOneAndUpdate(
      { _id: submissionId },
      { $set: { userDetails } },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Submission not found." });
    }
    
    return res.status(200).json({ message: "User details updated successfully." , status:true });
    
  } catch (error) {
    console.error("Error in submitDetails:", error);
    return res.status(500).json({ message: "Internal Server Error" });  
  }
}


export const submitFeedback = async (req, res) => {
  try {
    const { submissionId, feedback } = req.body;
    if (!submissionId || !feedback) {
      return res.status(400).json({ message: "Missing submissionId or feedback" });
    }
    
    const updated = await CampusTestSolution.findOneAndUpdate(
      { _id: submissionId },
      { $set: { feedback } },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Submission not found." });
    }
    
    return res.status(200).json({ message: "Feedback submitted successfully.", status:true });
    
  } catch (error) {
    console.error("Error in submitFeedback:", error);
    return res.status(500).json({ message: "Internal Server Error" });  
  }
}


function sanitizeTestSnapshot(testSnapshot) {
  return testSnapshot.map(section => {
    if (section.type === "quiz") {
      return {
        ...section,
        questions: section.questions.map(question => ({
          ...question,
          options: question.options.map(({ isCorrect, ...rest }) => rest) // Remove isCorrect
        }))
      };
    }

    if (section.type === "coding") {
      return {
        ...section,
        problems: section.problems?.map(problem => ({
          ...problem,
          testCases: problem.testCases?.slice(0, 2) || []
        })) || []
      };
    }

    // Return other types unchanged
    return section;
  });
}
