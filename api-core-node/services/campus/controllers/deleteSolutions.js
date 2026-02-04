import Quiz from "../../../../models/core/Quiz.js";
import Solution from "../../../../models/core/Solution.js";

export const deleteSection = async (req, res) => {
  try {
    const { quizId } = req.params;

    if (!quizId) {
      return res.status(400).json({ message: "quizId is required" });
    }

    // Delete quiz
    const quiz = await Quiz.findByIdAndDelete(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Delete related solutions
    const deletedSolutions = await Solution.deleteMany({ quizId });

    return res.status(200).json({
      success: true,
      message: "Quiz and related solutions deleted successfully",
      deletedSolutionsCount: deletedSolutions.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting quiz:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
