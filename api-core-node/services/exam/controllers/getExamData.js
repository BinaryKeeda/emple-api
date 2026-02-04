import Section from "../../../../models/core/Section.js";
import Exam from "../../../../models/Exam/Exam.js";
import ExamSolution from "../../../../models/Exam/ExamSolution.js";
import { QuestionBank } from "../../../../models/shared/questionBank.js";
import Problem from "../../../../models/test/Problem.js";

export const getAllExams = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // 1️⃣ Count total exams in this section
    const totalExams = await Exam.countDocuments({ sectionId });

    // 2️⃣ Fetch exams with pagination, sorting, and optional creator population
    const exams = await Exam.find({ sectionId })
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('creator', 'name email')
      .lean();

    // 3️⃣ Collect all examIds
    const examIds = exams.map(e => e._id);

    // 4️⃣ Aggregate submission counts (from ExamSolution or whatever your submission model is)
    const submissionCounts = await ExamSolution.aggregate([
      { $match: { examId: { $in: examIds } } },
      { $group: { _id: '$examId', count: { $sum: 1 } } }
    ]);

    // 5️⃣ Create a map of examId → count
    const submissionCountMap = submissionCounts.reduce((acc, cur) => {
      acc[cur._id.toString()] = cur.count;
      return acc;
    }, {});

    // 6️⃣ Enrich each exam with submission count and cost (if applicable)
    const costPerAttempt = 5; // example static cost per attempt
    const enrichedExams = exams.map(e => ({
      ...e,
      costPerAttempt,
      noOfSubmissions: submissionCountMap[e._id.toString()] || 0,
    }));

    // 7️⃣ Send paginated response
    res.status(200).json({
      success: true,
      page,
      limit,
      totalPages: Math.ceil(totalExams / limit),
      totalExams,
      exams: enrichedExams,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
export const getAllQuestions = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const section = await Section.findById(sectionId);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const category = req.query.category || null;
    const difficulty = req.query.difficulty || null;
    const search = req.query.search || '';

    // 1️⃣ Build query object
    const query = {};
    if (sectionId) query.groupId = section.groupId;
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (search) query.questionText = { $regex: search, $options: 'i' }; // fuzzy match

    // 2️⃣ Count total questions
    const totalQuestions = await QuestionBank.countDocuments(query);

    // 3️⃣ Fetch paginated + sorted questions
    const questions = await QuestionBank.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('creator', 'name email')
      .lean();

    // 4️⃣ Optional: Compute how many tests/exams used each question
    const questionIds = questions.map(q => q._id);

    const usageCounts = await Problem.aggregate([
      { $match: { questionId: { $in: questionIds } } },
      { $group: { _id: '$questionId', count: { $sum: 1 } } }
    ]);

    const usageCountMap = usageCounts.reduce((acc, cur) => {
      acc[cur._id.toString()] = cur.count;
      return acc;
    }, {});

    // 5️⃣ Enrich questions with usage stats
    const enrichedQuestions = questions.map(q => ({
      ...q,
      usedInTests: usageCountMap[q._id.toString()] || 0,
    }));

    // 6️⃣ Send response
    res.status(200).json({
      success: true,
      page,
      limit,
      totalPages: Math.ceil(totalQuestions / limit),
      totalQuestions,
      questions: enrichedQuestions,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const getExamById = async (req,res) => {
    try {
        const {examId} = req.params;
        const data = await Exam.findById(examId);
        res.json({data:data}).status(200);
    } catch (error) {
        console.log(error)
        res.json({message: "Internsal Server Error"}).status(404);
    }
}

export const getProblemData = async (req, res) => {
  try {
    const { search = "", limit = 10, difficulty,  skip = 0 , isPublic = false , page} = req.query;

    // Build search filter
    const query = {};

    query.isPublic = isPublic;
    query.isDeleted = false;
    if(difficulty && difficulty !== "all"){
      query.difficulty = difficulty;
    }
    if (search.trim()) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    // Fetch data with pagination
    const data = await Problem.find(query)
      .skip(parseInt(skip))
      .skip((page - 1 )* limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    // Total count for frontend pagination
    const total = await Problem.countDocuments(query);

    return res.status(200).json({
      success: true,
      total,
      count: data.length,
      data,
    });
  } catch (e) {
    console.error("Error in getProblemData:", e);
    res.status(500).json({
      success: false,
      message: "Failed to fetch problems",
      error: e.message,
    });
  }
};