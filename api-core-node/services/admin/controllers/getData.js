import CampusTest from "../../../../models/campus/CampusTest.js";
import Group from "../../../../models/core/Group.js";
import Quiz from "../../../../models/core/Quiz.js";
import Users from "../../../../models/core/User.js";
import { QuestionBank } from "../../../../models/shared/questionBank.js";
import Problem from "../../../../models/test/Problem.js";
import { Test } from "../../../../models/test/TestSchema.js";

export const getTestsForAdmin = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      category,
      visibility,
      isAvailable,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filters = {};

    if (search) {
      filters.name = { $regex: search, $options: 'i' }; // case-insensitive search
    }
    if (category) filters.category = category;
    if (visibility) filters.visibility = visibility;
    if (isAvailable) filters.isAvailable = isAvailable === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [totalItems, tests] = await Promise.all([
      Test.countDocuments(filters),
      Test.find(filters)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .select('name slug duration category visibility isAvailable createdAt updatedAt')
        .lean()
    ]);

    res.status(200).json({
      status: true,
      data: tests,
      page: parseInt(page),
      limit: parseInt(limit),
      totalItems,
      totalPages: Math.ceil(totalItems / limit)
    });
  } catch (error) {
    console.error("Admin Test Fetch Error:", error);
    res.status(500).json({
      status: false,
      message: "Server error while fetching tests"
    });
  }
};

export const getQuizzesForAdmin = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      category,
      difficulty,
      isAvailable,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filters = {};

    if (search) {
      filters.title = { $regex: search, $options: 'i' }; // Case-insensitive
    }

    if (category) filters.category = category;
    if (difficulty) filters.difficulty = difficulty;
    if (isAvailable) filters.isAvailable = isAvailable === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [totalItems, quizzes] = await Promise.all([
      Quiz.countDocuments(filters),
      Quiz.find(filters)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .select('title slug category difficulty duration marks isAvailable createdAt')
        .lean()
    ]);

    res.status(200).json({
      status: true,
      data: quizzes,
      page: parseInt(page),
      limit: parseInt(limit),
      totalItems,
      totalPages: Math.ceil(totalItems / limit)
    });
  } catch (error) {
    console.error("Admin Quiz Fetch Error:", error);
    res.status(500).json({
      status: false,
      message: "Server error while fetching quizzes"
    });
  }
};


export const getCampusTestsForAdmin = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      visibility,
      isAvailable,
      groupId,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    const filters = {};

    if (search) {
      filters.title = { $regex: search, $options: "i" };
    }

    if (visibility) filters.visibility = visibility;
    if (isAvailable) filters.isAvailable = isAvailable === "true";
    if (groupId) filters.groupId = groupId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [totalItems, tests] = await Promise.all([
      CampusTest.countDocuments(filters),
      CampusTest.find(filters)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .select("title name slug visibility isAvailable groupId createdAt updatedAt")
        .populate("groupId", "groupName") // populate group name
        .lean()
    ]);

    res.status(200).json({
      status: true,
      data: tests,
      page: parseInt(page),
      limit: parseInt(limit),
      totalItems,
      totalPages: Math.ceil(totalItems / limit)
    });
  } catch (error) {
    console.error("CampusTest Fetch Error:", error);
    res.status(500).json({
      status: false,
      message: "Error fetching campus tests"
    });
  }
};


export const getAdminSummary = async (req, res) => {
  try {
    const [userCount, groupCount, quizCount, testCount, campusTestCount, problemCount, questionBankAccount] = await Promise.all([
      Users.countDocuments(),
      Group.countDocuments(),
      Quiz.countDocuments(),
      Test.countDocuments(),
      CampusTest.countDocuments(),
      Problem.countDocuments(),
      QuestionBank.countDocuments()
    ]);

    // Get today's users (00:00 - 23:59)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const todayUsers = await Users.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow }
    });

    // Optional: Signup graph for last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const count = await Users.countDocuments({
        createdAt: { $gte: dayStart, $lt: dayEnd }
      });

      last7Days.push({
        date: dayStart.toISOString().slice(0, 10), // YYYY-MM-DD
        count
      });
    }

    res.status(200).json({
      status: true,
      data: {
        counts: {
          users: userCount,
          groups: groupCount,
          quizzes: quizCount,
          tests: testCount,
          campusTests: campusTestCount,
          problems: problemCount,
          questionBank :questionBankAccount
        },
        todayUsers: todayUsers,
        userGrowthLast7Days: last7Days
      }
    });
  } catch (error) {
    console.error("Admin Summary Error:", error);
    res.status(500).json({ status: false, message: "Error fetching summary" });
  }
};

export const getProblems = async (req, res) => {
  try {
     const {
      page = 1,
      limit = 20,
      search = "",
      visibility,
      isAvailable,
      groupId,
      difficulty,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    const filters = {};

    if (search) {
      filters.title = { $regex: search, $options: "i" };
    }
    if(difficulty) filters.difficulty = difficulty;
    if (visibility) filters.visibility = visibility;
    if (isAvailable) filters.isAvailable = isAvailable === "true";
    if (groupId) filters.groupId = groupId;
    const total = await Problem.countDocuments(filters)

    const problems = await Problem.find(filters)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    res.status(200).json({
      success: true,
      data: problems,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

export const getPaginatedQuestionBank = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      visibility,
      isAvailable,
      groupId,
      category,
      difficulty,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    const filters = {};
    if (search) filters.name = { $regex: search, $options: "i" };
    if (category) filters.category = category;
    if (difficulty) filters.difficulty = difficulty;
    if (visibility) filters.visibility = visibility;
    if (isAvailable) filters.isAvailable = isAvailable === "true";
    if (groupId) filters.groupId = groupId;
    console.log(filters)
    const total = await QuestionBank.countDocuments(filters);

    const questionBanks = await QuestionBank.find(filters)
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(limit);
console.log(questionBanks);
    // 👉 Transform the data to include name, category, and number of questions
    const transformed = questionBanks.map(qb => ({
      _id: qb._id,
      name: qb.name,
      category: qb.category,
      questionsCount: qb.questions?.length || 0
    }));

    res.status(200).json({
      success: true,
      data: transformed,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
