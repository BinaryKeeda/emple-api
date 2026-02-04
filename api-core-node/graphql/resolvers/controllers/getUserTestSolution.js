import Exam from "../../../../models/Exam/Exam.js";
import ExamSolution from "../../../../models/Exam/ExamSolution.js";
import { TestResponse } from "../../../../models/test/TestResponse.js";
import { Test } from "../../../../models/test/TestSchema.js";

export const getUserTestSolution = async (_, args) => {
  const { slug, userId, isPreview } = args;

  if(isPreview) {

  }
  const test = await fetchTestBySlug(slug);
  // console.log(JSON.stringify(test))
  if (!test) throw new Error("Test not found");

  let testResponse = await fetchUserTestSolution(userId, test._id);

  if (!testResponse) {
    const sectionAnswers = test.sections.map(section => ({
      sectionId: section._id
    }));

    testResponse = await ExamSolution.create({
      testId: test._id,
      userId,
      sections: sectionAnswers
    });
  }

  if (testResponse.pausedAt) {
        const pausedAt = new Date(testResponse.pausedAt).getTime()
        const now = Date.now()
        const offlineDuration = now - pausedAt
        testResponse.durationSpent = (testResponse.durationSpent || 0) + offlineDuration
  }

        testResponse.lastSeenAt = new Date()
        testResponse.pausedAt = null // Resume test
    // console.log(test.sections[0].problemset)
  // Format codingAnswers and quizAnswers maps into arrays
        const formattedSections = (testResponse.response || []).map(section => {
        const quizMap = section?.quizAnswers?.[0] || new Map();
        const codingMap = section?.codingAnswers?.[0] || new Map();
        const quizAnswers = Object.entries(quizMap).map(([questionId, answerText]) => ({
            id: questionId,
            selectedOption: Array.isArray(answerText) ? answerText : [answerText]
        }));

        // console.log(codingMap)
        const codingAnswers = Object.entries(codingMap).map(([problemId, userSolutionId]) => ({
            problemId: problemId,
            // userSolutionId
        }));

        return {
            sectionId: section.sectionId,
            sectionType: section.sectionType,
            quizAnswers,
            codingAnswers,
            totalQuestions: section.totalQuestions ?? 0,
            correctAnswers: section.correctAnswers ?? 0
        };
    });

  await testResponse.save()

  return {
    test,
    testResponse: {
      ...testResponse.toObject(),
      response: formattedSections
    }
  };
};

// ========== Helper Functions ==========

const fetchTestBySlug = (slug) => {
  return Exam.findOne({ slug })
    .populate({ path: "sections.problemset" })
    .then(test => test)
    .catch(err => {
      throw new Error("Error fetching test: " + err.message);
    });
};

const fetchUserTestSolution = (userId, testId) => {
  return ExamSolution.findOne({ userId, testId })
    .then(data => data)
    .catch(err => {
      throw new Error("Error fetching test response: " + err.message);
    });
};


// ========= get paginated solution ========
export const getUserTestSolutions = async (_, args) => {
  try {
    const { userId, page = 1, search = '', limit = 10 } = args;

    // Handle search by testResponseId
    if (search) {
      const solution = await ExamSolution.findById(search).populate('testId');
      if (!solution) {
        return {
          status: false,
          message: 'Solution not found',
        };
      }

      const { _id, testId, score, createdAt } = solution;

      return {
        status: true,
        data: [{
          testResponseId: _id,
          testId: testId?._id,
          testName: testId?.name || '',
          score,
          submittedAt: createdAt,
        }],
        page: 1,
        limit: 1,
        totalItems: 1,
        totalPages: 1,
      };
    }

    // Validate userId
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Build query and execute
    const query = { userId, isSubmitted: true ,       isEvaluated:true};
    const skip = (page - 1) * limit;

    const [solutions, totalItems] = await Promise.all([
      ExamSolution.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('testId'),
      ExamSolution.countDocuments(query),
    ]);
    console.log((solutions[0]))
    const data = solutions.map(({ _id, testId, score, createdAt }) => ({
      testResponseId: _id,
      testName: testId?.name || '',
    }));

    return {
      status: true,
      data,
      totalItems,
      page,
      limit,
      totalPages: Math.ceil(totalItems / limit),
    };
  } catch (error) {
    console.error('Error in getUserTestSolutions:', error);
    return {
      status: false,
      message: error.message || 'Failed to fetch solutions',
    };
  }
};


