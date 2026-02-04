import CampusTest from "../../../../models/campus/CampusTest.js"
import Quiz from "../../../../models/core/Quiz.js"
import { QuestionBank } from "../../../../models/shared/questionBank.js"
import Problem from "../../../../models/test/Problem.js"
import { Test } from "../../../../models/test/TestSchema.js"
import Solution from "../../../../models/core/Solution.js"
import { TestResponse } from "../../../../models/test/TestResponse.js"

/**
 * Generic delete handler
 * @param {Model} Model - Mongoose model
 * @param {string} name - Model name for messages
 * @param {Function} checkFn - Optional function to check constraints before deletion
 */
const deleteHandler = (Model, name, checkFn = null) => async (req, res) => {
  try {
    const { id } = req.params

    // ✅ Run pre-delete check if provided
    const result = await Model.deleteOne({ _id: id })
    let preventDeleteMsg;
    if (checkFn) {
      preventDeleteMsg = await checkFn(id)
      // if (preventDeleteMsg) {
      //   return res.status(400).json({ message: preventDeleteMsg })
      // }
    }


    if (result.deletedCount === 0) {
      return res.status(404).json({ message: `${name} not found` })
    }

    res.json({ message: `${preventDeleteMsg ? preventDeleteMsg : name +  " deleted successfully"}` })
  } catch (error) {
    res.status(500).json({ message: `Error deleting ${name}`, error: error.message })
  }
}

//
// ✅ Specific pre-checks
//

// Prevent quiz deletion if submissions exist
const checkQuizSubmissions = async (quizId) => {
  const hasSubmission = await Solution.exists({ quizId })
  await Solution.deleteMany({quizId : quizId });
  return hasSubmission ? "Quiz deleted also its associated submissions." : null
}

// Prevent test deletion if submissions exist
const checkTestSubmissions = async (testId) => {
  const hasSubmission = await TestResponse.exists({ testId })
  return hasSubmission ? "Test cannot be deleted because it has submissions." : null
}

// Prevent deletion if QuestionBank is used in Quiz/Test/CampusTest
const checkQuestionBankUsage = async (qbId) => {
  const usedInQuiz = await Quiz.exists({ questionBank: qbId })
  if (usedInQuiz) return "Question Bank cannot be deleted because it is used in a Quiz."

  const usedInTest = await Test.exists({ "sections.questionPool": qbId })
  if (usedInTest) return "Question Bank cannot be deleted because it is used in a Test."

  const usedInCampusTest = await CampusTest.exists({ "sections.questionPool": qbId })
  if (usedInCampusTest) return "Question Bank cannot be deleted because it is used in a Campus Test."

  return null
}

// Prevent deletion if Problem is used in Quiz/Test/CampusTest
const checkProblemUsage = async (problemId) => {
  const usedInQuiz = await Quiz.exists({ problems: problemId }) // only if Quiz schema references problems
  if (usedInQuiz) return "Problem cannot be deleted because it is used in a Quiz."

  const usedInTest = await Test.exists({ "sections.problemPool": problemId })
  if (usedInTest) return "Problem cannot be deleted because it is used in a Test."

  const usedInCampusTest = await CampusTest.exists({ "sections.problemPool": problemId })
  if (usedInCampusTest) return "Problem cannot be deleted because it is used in a Campus Test."

  return null
}

//
// ✅ Export handlers
//
export const deleteQuiz = deleteHandler(Quiz, "Quiz", checkQuizSubmissions)
export const deleteTest = deleteHandler(Test, "Test", checkTestSubmissions)
export const deleteCampusTest = deleteHandler(CampusTest, "Campus Test")
export const deleteProblem = deleteHandler(Problem, "Problem", checkProblemUsage)
export const deleteQuestionBank = deleteHandler(QuestionBank, "Question Bank", checkQuestionBankUsage)
