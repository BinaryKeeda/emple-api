import mongoose from "mongoose";
import Quiz from "../../../../models/core/Quiz.js";
import Solution from "../../../../models/core/Solution.js";
import { Test } from "../../../../models/test/TestSchema.js";
import Users from "../../../../models/core/User.js";
import { TestResponse } from "../../../../models/test/TestResponse.js";
import Section from "../../../../models/core/Section.js";
import ExcelJS from 'exceljs' 
import Exam from "../../../../models/Exam/Exam.js";
import ExamSolution from "../../../../models/Exam/ExamSolution.js";
import { GroupOwner, SectionOwner } from "../../../../models/shared/owner.js";
export const resourcesQuizRouter = async (req, res) => {
  const { type } = req.params;
  const { search = "" } = req.query;

  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  try {
    const filter = {
      category: type,
      title: { $regex: search, $options: "i" }, // Case-insensitive match on title
    };

    const total = await Quiz.countDocuments(filter);
    const quizzes = await Quiz.find(filter).skip(skip).limit(limit).select('slug title difficulty');

    res.json({
      quizzes,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong while fetching quizzes' });
  }
};

export const resourcesTestRouter = async (req, res) => {
  const { type } = req.params;
  const { search = "" } = req.query;

  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  try {

    const total = await Test.countDocuments({     
    category: type,
    name: { $regex: search, $options: "i" }, // Case-ins

      isAvailable: true, 
    });
    const tests = await Test.find({
        category: type,
        isAvailable: true, 
        name: { $regex: search, $options: "i" }, // Case-ins
    }).skip(skip).limit(limit);

    res.json({
      tests,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong while fetching tests' });
  }
};


export const getQuizSubmissionsForSection = async (req, res) => {
  try {
    const { slug, sectionId } = req.params;
    const { page = 1, limit = 10, name } = req.query;

    if (!sectionId || !slug) {
      return res.status(400).json({ error: "Missing sectionId or slug" });
    }

    const sectionInfo = await Section.findById(sectionId);
    if (!sectionInfo) return res.status(404).json({ error: "Section not found" });

    const quiz = await Quiz.findOne({ slug });
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    const skip = (page - 1) * parseInt(limit);

    // -----------------
    // SUBMISSIONS
    // -----------------
    const submissionFilter = { quizId: quiz._id };

    const submissions = await Solution.find(submissionFilter)
      .populate("userId", "name email sectionOwner groups score")
      .sort({ updatedAt: -1 });

    const totalSubmissions = await Solution.countDocuments(submissionFilter);

    const submittedUserIds = submissions.map((s) => s.userId._id);

    // -----------------
    // DEFAULTERS
    // -----------------
    // const defaulterFilter = {
    //   role: "user",
    //   $or: [{ [`groups.${sectionInfo.groupId}`]: { $in: [sectionId] } }],
    //   _id: { $nin: submittedUserIds },
    //   ...(name && { name: { $regex: name, $options: "i" } }),
    // };

    // const defaulters = await Users.find(defaulterFilter).select("name email");
    // const totalDefaulters = await Users.countDocuments(defaulterFilter);

    // -----------------
    // MERGE BOTH LISTS
    // -----------------
    const mergedData = [
    ...submissions.map((s) => ({
      submissionId: s._id,                 // only for submitted
      userId: s.userId?._id,               // optional if you still need userId
      name: s.userId?.name,
      email: s.userId?.email,
      status: "submitted",
      score:s.score,
      updatedAt: s.updatedAt,
    })),
  // ...defaulters.map((u) => ({
  //   // no submissionId here because they didn't submit
  //   userId: u._id,
  //   name: u.name,
  //   email: u.email,
  //   status: "defaulter",
  // })),
];
    // sort merged data (optional: e.g., by updatedAt desc)
    mergedData.sort((a, b) => {
      if (a.status === "submitted" && b.status === "submitted") {
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      }
      return 0; // keep others as is
    });

    // apply pagination AFTER merge
    // const total = totalSubmissions + totalDefaulters;
    const total = totalSubmissions ;
    const paginatedData = mergedData.slice(skip, skip + parseInt(limit));

    // -----------------
    // RESPONSE
    // -----------------
    res.json({
      list: paginatedData,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
    });
  } catch (err) {
    console.error("Error fetching quiz submissions:", err);
    res.status(500).json({ error: "Failed to load quiz submissions" });
  }
};

export const getTestSubmissionsForSection = async (req, res) => {
  try {
    const { slug, sectionId } = req.params;
    const { page = 1, limit = 10, name } = req.query;

    if (!sectionId || !slug) {
      return res.status(400).json({ error: "Missing sectionId or slug" });
    }

    const sectionInfo = await Section.findById(sectionId);
    if (!sectionInfo)
      return res.status(404).json({ error: "Section not found" });

    const test = await Test.findOne({ slug });
    if (!test) return res.status(404).json({ error: "Test not found" });

    const skip = (page - 1) * parseInt(limit);

    // -----------------
    // SUBMISSIONS
    // -----------------
    const submissionFilter = { testId: test._id };

    const submissions = await TestResponse.find(submissionFilter)
      .populate("userId", "name email sectionOwner groups score")
      .sort({ updatedAt: -1 });

    const totalSubmissions = await TestResponse.countDocuments(submissionFilter);

    // const submittedUserIds = submissions.map((s) => s.userId._id);

    // -----------------
    // DEFAULTERS (Optional)
    // -----------------
    // const defaulterFilter = {
    //   role: "user",
    //   $or: [{ [`groups.${sectionInfo.groupId}`]: { $in: [sectionId] } }],
    //   _id: { $nin: submittedUserIds },
    //   ...(name && { name: { $regex: name, $options: "i" } }),
    // };

    // const defaulters = await Users.find(defaulterFilter).select("name email");
    // const totalDefaulters = await Users.countDocuments(defaulterFilter);

    // -----------------
    // MERGE BOTH LISTS
    // -----------------
    const mergedData = [
      ...submissions.map((s) => ({
        submissionId: s._id,
        userId: s.userId?._id,
        name: s.userId?.name,
        email: s.userId?.email,
        status: "submitted",
        score: s.score,
        updatedAt: s.updatedAt,
      })),
      // ...defaulters.map((u) => ({
      //   userId: u._id,
      //   name: u.name,
      //   email: u.email,
      //   status: "defaulter",
      // })),
    ];

    // sort by submission date
    mergedData.sort((a, b) => {
      if (a.status === "submitted" && b.status === "submitted") {
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      }
      return 0;
    });

    const total = totalSubmissions;
    const paginatedData = mergedData.slice(skip, skip + parseInt(limit));

    // -----------------
    // RESPONSE
    // -----------------
    res.json({
      list: paginatedData,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
    });
  } catch (err) {
    console.error("Error fetching test submissions:", err);
    res.status(500).json({ error: "Failed to load test submissions" });
  }
};

export const exportQuizSubmissionsForSection = async (req, res) => {
  try {
    const { slug, sectionId } = req.params;
    const { name } = req.query;

    if (!sectionId || !slug) {
      return res.status(400).json({ error: "Missing sectionId or slug" });
    }

    const sectionInfo = await Section.findById(sectionId);
    if (!sectionInfo)
      return res.status(404).json({ error: "Section not found" });

    const quiz = await Quiz.findOne({ slug });
    if (!quiz)
      return res.status(404).json({ error: "Quiz not found" });

    // -----------------
    // SUBMISSIONS
    // -----------------
    const submissionFilter = { quizId: quiz._id };

    const submissions = await Solution.find(submissionFilter)
      .populate("userId", "name email sectionOwner groups score")
      .sort({ updatedAt: -1 });

    const mergedData = [
      ...submissions.map((s) => ({
        submissionId: s._id,
        name: s.userId?.name,
        email: s.userId?.email,
        status: "submitted",
        score: s.score ?? "N/A",
        updatedAt: s.updatedAt,
      })),
      // You can add defaulters later similarly if needed
    ];

    // -----------------
    // CREATE EXCEL WORKBOOK
    // -----------------
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Quiz Submissions");

    worksheet.columns = [
      { header: "Submission ID", key: "submissionId", width: 32 },
      { header: "Name", key: "name", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Status", key: "status", width: 15 },
      { header: "Score", key: "score", width: 10 },
      { header: "Updated At", key: "updatedAt", width: 25 },
    ];

    mergedData.forEach((row) => {
      worksheet.addRow({
        ...row,
        updatedAt: new Date(row.updatedAt).toLocaleString(),
      });
    });

    // Apply some styling (optional)
    worksheet.getRow(1).font = { bold: true };
    worksheet.columns.forEach((col) => {
      col.alignment = { vertical: "middle", horizontal: "center" };
    });

    // -----------------
    // SEND FILE
    // -----------------
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="quiz_submissions_${slug}.xlsx"`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Error exporting quiz submissions:", err);
    res.status(500).json({ error: "Failed to export quiz submissions" });
  }
};


export const getUserQuizSubmission = async (req, res) => {
    const { id } = req.params;

    try {
        const submission = await Solution.findById(id)
            .populate('quizId')
            .populate('userId', 'name email')


        if (!submission) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        res.json(submission);
    } catch (err) {
        console.error('Error fetching user quiz submission:', err);
        res.status(500).json({ error: 'Failed to load user quiz submission' });
    }
};


export const getTestSubmissionsForCampus = async (req, res) => {
  try {
    const { slug } = req.params;
    const {
      page = 1,
      limit = 10,
      defaulters = false,
      minScore,
      maxScore,
      name
    } = req.query;

    const { campusId } = req.body;
    if (!campusId || !slug) {
      return res.status(400).json({ error: 'Missing campusId or slug' });
    }

    const test = await Test.findOne({ slug });
    if (!test) return res.status(404).json({ error: 'Test not found' });

    const skip = (page - 1) * parseInt(limit);

    if (defaulters === 'true') {
      const submittedUserIds = await TestResponse.distinct('userId', {
        testId: test._id,
        isSubmitted: true
      });

      const defaulters = await Users.find({
        campusId,
        role: 'user',
        _id: { $nin: submittedUserIds },
        ...(name && { name: { $regex: name, $options: 'i' } })
      })
        .skip(skip)
        .limit(parseInt(limit))
        .select('name email');

      const total = await Users.countDocuments({
        campusId,
        role: 'user',
        _id: { $nin: submittedUserIds },
        ...(name && { name: { $regex: name, $options: 'i' } })
      });

      return res.json({
        defaulters,
        totalPages: Math.ceil(total / limit),
        currentPage: Number(page)
      });
    }

    // Main filter
    const matchStage = {
      testId: test._id,
      isSubmitted: true
    };
    if (minScore) matchStage.score = { ...matchStage.score, $gte: Number(minScore) };
    if (maxScore) matchStage.score = { ...matchStage.score, $lte: Number(maxScore) };

    // Fetch submissions with response + user info
    const rawSubmissions = await TestResponse.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $match: {
          'user.campusId': campusId,
          ...(name && { 'user.name': { $regex: name, $options: 'i' } })
        }
      },
      {
        $project: {
          score: 1,
          attemptNo: 1,
          submittedAt: '$updatedAt',
          response: 1,
          'user.name': 1,
          'user.email': 1
        }
      },
      { $sort: { submittedAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ]);

    // Transform to simplified structure
    const submissions = rawSubmissions.map(sub => {
      const sections = sub.response.map(section => {
        if (section.sectionType === 'Quiz') {
          return {
            type: 'Quiz',
            correct: section.correctAnswers || 0,
            total: section.totalQuestions || 0
          };
        } else if (section.sectionType === 'Coding') {
          const codingStats = [];
          for (const entry of section.codingAnswers || []) {
            for (const codeData of Object.values(entry)) {
              codingStats.push({
                passed: codeData.passedTestCases,
                total: codeData.totalTestCases
              });
            }
          }
          return {
            type: 'Coding',
            codingStats
          };
        }
      });

      return {
        _id: sub._id,
        user: sub.user,
        attemptNo: sub.attemptNo,
        submittedAt: sub.submittedAt,
        score: sub.score,
        sections
      };
    });

    // Total count for pagination
    const total = await TestResponse.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $match: {
          'user.campusId': campusId,
          ...(name && { 'user.name': { $regex: name, $options: 'i' } })
        }
      },
      { $count: 'count' }
    ]);

    res.json({
      submissions,
      totalPages: Math.ceil((total[0]?.count || 0) / limit),
      currentPage: Number(page)
    });

  } catch (err) {
    console.error('Error fetching test submissions:', err);
    res.status(500).json({ error: 'Failed to load test submissions' });
  }
};

export const getUserTestSubmission = async (req, res) => {
    const { id } = req.params;

    try {
        const submission = await TestResponse.findById(id)
            .populate('testId')
            .populate('userId', 'name email')


        if (!submission) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        res.json(submission);
    } catch (err) {
        console.error('Error fetching user quiz submission:', err);
        res.status(500).json({ error: 'Failed to load user quiz submission' });
    }
}


const sanitizeSheetName = (name) => {
  if (!name) return "Unnamed";
  return name
    .replace(/[*?:\\/\[\]/]/g, "_") // Replace invalid characters
    .slice(0, 31); // Excel sheet name limit
};


const computeAnalysis = (response, test) => {
  let totalMarks = 0;
  let obtainedMarks = 0;
  let negativeMarks = 0;
  let sectionAnalysis = [];

  response.forEach(section => {
    const meta = test.sections.find(
      s => s._id.toString() === section.sectionId.toString()
    );
    const questions = meta?.questionSet || [];

    let sectionTotal = 0;
    let sectionObtained = 0;
    let sectionNegative = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;

    // === QUIZ SECTION ===
    if (section.sectionType === "Quiz") {
      const userAnswers = Object.assign({}, ...section.quizAnswers);

      questions.forEach(q => {
        const markedAnswer = userAnswers[q._id] || null;
        sectionTotal += q.marks;
        totalMarks += q.marks;

        if (!markedAnswer) {
          skippedCount++;
          return;
        }

        let isCorrect = false;
        if (q.category === "Text") {
          isCorrect =
            q.answer?.trim().toLowerCase() ===
            markedAnswer?.trim().toLowerCase();
        } else {
          const correctOption = q.options.find(o => o.isCorrect);
          isCorrect = correctOption?.text === markedAnswer;
        }

        if (isCorrect) {
          sectionObtained += q.marks;
          obtainedMarks += q.marks;
          correctCount++;
        } else {
          wrongCount++;
          if (q.negative) {
            sectionNegative += q.negative;
            negativeMarks += q.negative;
          }
        }
      });
    }

    // === CODING SECTION ===
    if (section.sectionType === "Coding") {
      section.codingAnswers?.forEach(ansBlock => {
        const qid = Object.keys(ansBlock)[0];
        const codeData = ansBlock[qid];

        const totalCases = codeData.totalTestCases || 0;
        const passedCases = codeData.passedTestCases || 0;

        sectionTotal += totalCases;
        sectionObtained += passedCases;
        totalMarks += totalCases;
        obtainedMarks += passedCases;
      });
    }

    sectionAnalysis.push({
      sectionName: meta?.name || "Untitled Section",
      sectionType: section.sectionType,
      totalMarks: sectionTotal,
      obtainedMarks: sectionObtained,
      negativeMarks: sectionNegative,
      correctCount,
      wrongCount,
      skippedCount,
    });
  });

  return {
    totalMarks,
    obtainedMarks,
    negativeMarks,
    cumulativeMarks: obtainedMarks - negativeMarks,
    sectionAnalysis,
    verdict:
      obtainedMarks - negativeMarks >= totalMarks * 0.4 ? "Pass" : "Fail",
  };
};

/**
 * ==========================================
 * Controller: Export Test Results to Excel
 * ==========================================
 */
export const exportTestSubmissionsForSection = async (req, res) => {
  try {
    const { slug } = req.params;

    const test = await Exam.findById(slug);
    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    const response = await ExamSolution.find({ testId: test._id}).populate(
      "userId",
      "name email"
    );



    const responses = response?.map(r => [r?.response || [], {name:r.userId.name, email:r.userId.email, ufm:r.ufmAttempts, sap : r.userDetails[0]?.sap_id, batch:r.userDetails[0]?.batch, faculty:r.userDetails[0]?.faculty_name }]) || [];
    if (responses.length == 0) {
      return res.status(404).json({ message: "No responses found" });
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Section Wise Results");


    
    // ========= SECTION + QUESTION HEADERS =========
    const maxSections = response[0].testSnapshot.length;
    const baseHeaders = ["Name", "Email" , "UFM Attempts" , "Sap" , "Batch" , "Faculty"];

    let sectionHeaders = [...baseHeaders];

    for (let i = 0; i < maxSections; i++) {
      const section = response[0].testSnapshot[i];

      if (section.type === "quiz") {
        sectionHeaders = [...sectionHeaders,section.title];
      } else {
        sectionHeaders = [...sectionHeaders,section.title + "(No of Problems)"];

        for (let j = 0; j < (section.problems?.length || 0); j++) {
          sectionHeaders = [...sectionHeaders, section.problems[j].title];
        }
      }
    }


    sheet.addRow([...sectionHeaders]);
    responses?.forEach((r,idx) => {
      if(!r) return;
      const row = [];
      row.push(r[1].name);
      row.push(r[1].email);
      row.push(r[1].ufm)
      row.push(r[1].sap);
      row.push(r[1].batch)
      row.push(r[1].faculty)
      
     r[0].forEach((res, secIndex) => {
  if (res.sectionType === "quiz") {
    row.push(`${res.correctAnswers}/${res.totalQuestions}`);
  } 
  
  else if (res.sectionType === "coding") {

    // push number of problems for this coding section
    const section = response[idx].testSnapshot[secIndex];
    const totalProblems = section?.problems?.length || 0;
    row.push(totalProblems);

    const codingSolutions = res?.codingAnswers || [];

    section?.problems?.forEach(problem => {
      const id = new String(problem._id)      
      if(!id) return;
      if (codingSolutions?.length > 0 && codingSolutions[0][id]) {
        const sol = codingSolutions[0][problem._id];
        row.push(`${sol.passed ?? 0}/${sol.total ?? 0}`);
      } else {
        // user skipped the problem → prevent mismatch
        console.log(id)
      console.log(codingSolutions);
        row.push("UA");
      }
    });
  }
});


      sheet.addRow([...row]);
    });

    

    // ========= STYLE =========
    sheet.columns.forEach(col => (col.width = 30));
    sheet.getRow(1).font = { bold: true };

    // ========= SEND FILE =========
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Test_${test.name}_SectionWise.xlsx"`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error exporting test results:", error);
    res.status(500).json({ message: "Failed to export test results" });
  }
};


