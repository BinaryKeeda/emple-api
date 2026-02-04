import mongoose from 'mongoose';
import { TestResponse } from "../../../models/test/TestResponse.js";
import { Test } from "../../../models/test/TestSchema.js";

export const submitSectionResponse = async (job) => {
  try {
    // await mongoose.connect(process.env.URI); // Ensure DB connection if using in background job

    const { sectionId, submissionId, sectionType, quizAnswers, codingAnswers } = job.data;

    if (!sectionId || !sectionType) {
      throw new Error("Section ID and type are required");
    }

    const submission = await TestResponse.findById(submissionId);
    if (!submission) throw new Error("Test submission not found");

    const test = await Test.findById(submission.testId).lean();
    if (!test) throw new Error("Test not found");

    // Find the index of the section response
    let sectionIndex = submission.response.findIndex(s => s.sectionId.toString() === sectionId);

    // Add new section response if not found
    if (sectionIndex === -1) {
      submission.response.push({
        sectionId,
        sectionType,
        quizAnswers: {},
        codingAnswers: []
      });
      sectionIndex = submission.response.length - 1;
    }

    const section = test.sections.find(s => s._id.toString() === sectionId);
    if (!section) throw new Error("Section not found in test");

    if (sectionType === 'Quiz' && quizAnswers) {
      let score = 0;
      let totalQuestions = section.questionSet.length;
      let correctAnswers = 0;

      for (const question of section.questionSet) {
        const qid = question._id.toString();
        const userAnswer = quizAnswers[qid];
        const correctOptions = question.options?.filter(opt => opt.isCorrect)?.map(opt => opt.text) || [];
        const marks = question.marks || 1;
        const negative = question.negative || 0;

        if (correctOptions.length > 1) {
          // Multi-correct MCQ
          if (Array.isArray(userAnswer)) {
            const isCorrect = userAnswer.length === correctOptions.length &&
              userAnswer.every(opt => correctOptions.includes(opt));
            score += isCorrect ? marks : -negative;
            if (isCorrect) correctAnswers++;
          }
        } else if (correctOptions.length === 1) {
          // Single-correct MCQ
          if (userAnswer === correctOptions[0]) {
            score += marks;
            correctAnswers++;
          } else if (userAnswer) {
            score += negative;
          }
        } else {
          // Short/Long Answer
          const correctText = question.answer?.trim().toLowerCase();
          if (typeof userAnswer === 'string' &&
              correctText &&
              userAnswer.trim().toLowerCase() === correctText) {
            score += marks;
            correctAnswers++;
          } else if (userAnswer) {
            score += negative;
          }
        }
      }

      submission.response[sectionIndex].quizAnswers = quizAnswers;
      submission.response[sectionIndex].totalQuestions = totalQuestions;
      submission.response[sectionIndex].correctAnswers = correctAnswers;
      submission.response[sectionIndex].score = score;

    } else if (sectionType === 'Coding' && codingAnswers) {
      submission.response[sectionIndex].codingAnswers = codingAnswers;
    }

    submission.markModified('response');
    if (submission.curr >= test.sections.length - 1) {
      // submission.isSubmitted = true;
      submission.isEvaluated = true;
    }

    await submission.save();

    return {
      success: true,
      message: submission.isSubmitted ? "Test submitted" : "Section submitted",
      score: submission.response[sectionIndex].score || 0,
      correctAnswers: submission.response[sectionIndex].correctAnswers || 0,
      totalQuestions: submission.response[sectionIndex].totalQuestions || 0
    };

  } catch (err) {
    console.error("Error submitting section:", err);
    return {
      success: false,
      message: err.message || "Internal server error"
    };
  }
};
