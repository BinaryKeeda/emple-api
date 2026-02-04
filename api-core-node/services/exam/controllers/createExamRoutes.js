import Section from "../../../../models/core/Section.js";
import Exam from "../../../../models/Exam/Exam.js";
import { QuestionBank } from "../../../../models/shared/questionBank.js";
import Problem from "../../../../models/test/Problem.js";

export const createExam = async (req, res) => {
  try {
    const {
      name,
      isAvailable,
      sectionId,
      visibility,
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Exam name is required' });
    }

    const newExam = new Exam({
      name,
      isAvailable,
      sectionId,
      visibility,
    });

    const savedExam = await newExam.save();

    res.status(201).json({
      success: true,
      message: 'Exam created successfully',
      data: savedExam
    });

  } catch (error) {
    console.error('Error creating exam:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating exam',
      error: error.message
    });
  }
};
export const createBank = async (req,res) => {
   try {
    const { name, category, questions = [], groupId, creator } = req.body;
    const {sectionId} = req.body;
    const section = await Section.findById(sectionId);
    if (!name || !category) {
      return res.status(400).json({ success: false, message: "Name and category are required" });
    }

    const newBank = await QuestionBank.create({
      name,
      category,
      questions,
      groupId: section.groupId,
      creator: creator ? new mongoose.Types.ObjectId(creator) : undefined,
    });

    res.status(201).json({ success: true, message: "Question Bank created", data: newBank });
  } catch (error) {
    console.error("Error creating Question Bank:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
}

export const addSectionToExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const { title,   maxQuestion, maxTime, maxScore, description, type } = req.body;

    // Validate basic fields
    if (!title) {
      return res.status(400).json({ success: false, message: 'Section title is required' });
    }

    // Find exam by ID
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    // Create a new section object
    const newSection = {
      title,
      maxQuestion,
      maxTime,
      maxScore,
      description,
      type
    };

    // Push new section
    exam.sections.push(newSection);

    // Save the updated exam
    await exam.save();

    res.status(201).json({
      success: true,
      message: 'Section added successfully',
      data: exam
    });
  } catch (error) {
    console.error('Error adding section:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding section',
      error: error.message
    });
  }
};

export const addQuestionPool = async (req, res) => {
  try {
    const { examId, sectionId } = req.params;
    const { questionPoolId } = req.body; // or data for creating a new pool

    if (!examId || !sectionId)
      return res.status(400).json({ message: "Missing exam or section ID" });

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const section = exam.sections.id(sectionId);
    if (!section) return res.status(404).json({ message: "Section not found" });

    // Option 1: Assign existing QuestionBank
    if (questionPoolId) {
      const questionBank = await QuestionBank.findById(questionPoolId);
      if (!questionBank)
        return res.status(404).json({ message: "QuestionBank not found" });

      section.questionPool = questionBank._id;
    } 
    // Option 2: Create new QuestionBank dynamically
    else if (req.body.newPoolData) {
      const newBank = await QuestionBank.create(req.body.newPoolData);
      section.questionPool = newBank._id;
    }

    await exam.save();
    res.status(200).json({
      message: "Question pool added successfully",
      section,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

export const addProblemPool = async (req, res) => {
  try {
    const { examId, sectionId } = req.params;
    const { problemIds } = req.body; // array of problem IDs

    if (!examId || !sectionId)
      return res.status(400).json({ message: "Missing exam or section ID" });

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const section = exam.sections.id(sectionId);
    if (!section) return res.status(404).json({ message: "Section not found" });

    if (!Array.isArray(problemIds) || problemIds.length === 0)
      return res.status(400).json({ message: "No problem IDs provided" });

    // Verify all problem IDs exist
    const problems = await Problem.find({ _id: { $in: problemIds } });
    if (problems.length !== problemIds.length)
      return res.status(400).json({ message: "One or more problems not found" });

    // Add unique problems
    // const existingIds = section.problemPool.map((id) => id.toString());
    // const newIds = problemIds.filter((id) => !existingIds.includes(id));
    // section.problemPool.push(...newIds);
    section.problemPool = problemIds;

    await exam.save();

    res.status(200).json({
      message: "Problems added successfully",
      section,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};
