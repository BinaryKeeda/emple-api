import Quiz from "../../../../models/core/Quiz.js";
import { questionSchema, quizSchema } from "../validator/quizValidator.js";

export const addQuiz = async (req, res) => {
    try {
        const reqQuiz = quizSchema.parse(req.body);
        const newQuiz = new Quiz(reqQuiz);
        await newQuiz.save();

        return res.status(201).json({
            success: true,
            message: "Quiz created successfully",
            quiz: newQuiz,
        });
    } catch (error) {
        console.error(error);
        return res.status(400).json({
            success: false,
            message: "Failed to create quiz",
            error: error.errors || error.message,
        });
    }
};

export const addQuestion = async (req, res) => {
    try {
        const data = JSON.parse(req.body.data);
        const questionToAdd = questionSchema.parse(data);
        console.log(questionToAdd);
        const quiz = await Quiz.findById(data.quizId);
        if (!quiz) {
            return res.status(404).json({
                success: false, 
                message: "Quiz not found",
            });
        }

        if (req.file) questionToAdd.image = req.file.path;

        quiz.questions.push(questionToAdd);
        await quiz.save();

        return res.status(200).json({
            success: true,
            message: "Question added successfully",
            quizId: quiz._id,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Failed to add question",
            error: error.errors || error.message,
        });
    }
};

export const addQuestions = async (req, res) => {
    try {
        const { data, quizId } = req.body;
        

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: "Quiz not found",
            });
        }

        console.log(JSON.stringify(data))

        const validQuestions = data.map((q) => questionSchema.parse(q));
        quiz.questions.push(...validQuestions);
        await quiz.save();

        return res.status(200).json({
            success: true,
            message: "Questions added successfully",
            totalQuestions: validQuestions.length,
        });
    } catch (error) {
        console.log(error)
        return res.status(400).json({
            success: false,
            message: "Failed to add questions",
            error: error.errors || error.message,
        });
    }
};


export const getParticularQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id).populate('questions');
        if (!quiz) return res.status(400).json({message : "Quiz not found" , success:false});
        return res.json(quiz);
    } catch (error) {
        return res.status(500).josn({message : "Internal Server Error",success: false});
    }
};

export const editQuiz = async (req, res) => {
    const { id } = req.params; 
    const quizData = req.body;

    try {
        if (!id) {
            return res.status(400).json({ message: 'Quiz ID is required for editing.' });
        }

        const updatedQuiz = await Quiz.findByIdAndUpdate(id, quizData, { new: true });
        if (!updatedQuiz) {
            return res.status(404).json({ message: 'Quiz not found.' });
        }

        return res.status(200).json({ message: 'Quiz updated successfully.', quiz: updatedQuiz });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'An error occurred while updating the quiz.', error });
    }
};

import mongoose from "mongoose";

export const delQuestion = async (req, res) => {
    try {
        const { quizId, questionId } = req.params;

        const updatedQuiz = await Quiz.findOneAndUpdate(
            { _id: quizId },
            { $pull: { questions: { _id: new mongoose.Types.ObjectId(questionId) } } },
            { new: true }
        );

        if (!updatedQuiz) {
            return res.status(404).json({ message: "Quiz not found" });
        }

        res.status(200).json({
            message: "Question deleted successfully",
            quiz: updatedQuiz
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
