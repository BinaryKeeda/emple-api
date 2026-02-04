import { CODE_EXECUTION_API } from "../../../config/config.js";
import CampusTestSolution from "../../../models/campus/CampusTestSolution.js";
import Exam from "../../../models/Exam/Exam.js";
import ExamSolution from "../../../models/Exam/ExamSolution.js";
import { TestResponse } from "../../../models/test/TestResponse.js";
import { Test } from "../../../models/test/TestSchema.js";
import axios from 'axios';
import { configDotenv} from 'dotenv'
configDotenv();
export const testEvaluator = async (job) => {
  try {
    // await mongoose.connect(process.env.URI); // Ensure DB connection if using in background job
        const { submissionId, sectionId, sectionType, response, current } = job.data.data;

        const submission = await CampusTestSolution.findById(submissionId);
        let correctAnswers = 0;
        const sectionWithSolution = submission.testSnapshot.find((s)=>s.sectionId == sectionId);
        let totalQuestions = sectionWithSolution?.questions?.length || 0;
        // console.log("Section with solution:", sectionWithSolution);
        console.log(totalQuestions);
        // console.log("User answers:", userAnswers);

        // sectionWithSolution.
        if(sectionWithSolution.type == 'quiz') {
            const questions = sectionWithSolution.questions;
            const userAnswers = response || {};
            questions.forEach((question) => {
                const userAnswer = userAnswers[question._id];
                const correctOptions = question.options
                .filter(opt => opt.isCorrect)
                .map(opt => opt.text);

                if (correctOptions.length > 1) {
                    // Multi-correct MCQ
                    if (Array.isArray(userAnswer)) {
                        const isCorrect = userAnswer.length === correctOptions.length &&
                            userAnswer.every(opt => correctOptions.includes(opt));
                        if (isCorrect) {
                            correctAnswers++;
                        }
                    }
                } else if (correctOptions.length === 1) {
                    // Single-correct MCQ
                    if (userAnswer === correctOptions[0]) {
                        correctAnswers++;
                    }
                }
                else {
                    // Text question
                    if (userAnswer && userAnswer.trim().toLowerCase() === question.answer.trim().toLowerCase()) {
                        correctAnswers++;
                    }
                }
            });

        }
        submission.response = submission.response.map((section) => {
        if (section.sectionId.toString() === sectionId.toString()) {
            return {
            ...section,
            sectionType,
            ...(sectionType === 'quiz'
                ? { quizAnswers: response }
                : { codingAnswers: response }),
            totalQuestions: totalQuestions || -1,
            correctAnswers: sectionWithSolution?.type === 'quiz' ? correctAnswers : -1
            };
        }
        return section;
        });

        submission.currSection = current + 1;
        if(submission.isSubmitted) submission.isEvaluated = true;
        await submission.save();

        return {
            success: true,
            message: `Updated ${sectionType} answers for section ${sectionId}`,
            nextSection: submission.currSection
        };
  } catch (err) {
    console.error("Error submitting section:", err);
    return {
      success: false,
      message: err.message || "Internal server error"
    };
  }

}

export const examEvaluator = async (job) => {
  try {
        const { submissionId, sectionId, sectionType, response, current } = job.data.data;

        const submission = await ExamSolution.findById(submissionId);
        let correctAnswers = 0;
        const sectionWithSolution = submission.testSnapshot.find((s)=>s.sectionId == sectionId);
        let totalQuestions = sectionWithSolution?.questions?.length || 0;
        // console.log("Section with solution:", sectionWithSolution);
        // console.log(totalQuestions);
        // console.log("User answers:", userAnswers);

        // sectionWithSolution.

        if(sectionWithSolution.type == 'quiz') {
            const questions = sectionWithSolution.questions;
            const userAnswers = response || {};
            questions.forEach((question) => {
                const userAnswer = userAnswers[question._id];
                const correctOptions = question.options
                .filter(opt => opt.isCorrect)
                .map(opt => opt.text);

                if (correctOptions.length > 1) {
                    // Multi-correct MCQ
                    if (Array.isArray(userAnswer)) {
                        const isCorrect = userAnswer.length === correctOptions.length &&
                            userAnswer.every(opt => correctOptions.includes(opt));
                        if (isCorrect) {
                            correctAnswers++;
                        }
                    }
                } else if (correctOptions.length === 1) {
                    // Single-correct MCQ
                    if (userAnswer === correctOptions[0]) {
                        correctAnswers++;
                    }
                }
                else {
                    // Text question
                    if (userAnswer && userAnswer.trim().toLowerCase() === question.answer.trim().toLowerCase()) {
                        correctAnswers++;
                    }
                }
            });

        }else {
            try {
                await Promise.all(
                Object.keys(response).map(async (id) => {
                    const tokens = response[id]?.tokens?.map(t => t.token);
                    console.log(tokens.length);
                    const tokenString = tokens.join(',');

                    const res = await axios.get(
                    `${ CODE_EXECUTION_API}/submissions/batch?tokens=${tokenString}`
                    );

                    const submissions = res.data.submissions;
                    const totalCount = submissions.length;
                    const passCount = submissions.filter(s => s.status.id === 3).length;

                    response[id].passed = passCount;
                    response[id].total = totalCount;

                    console.log({ passCount, totalCount });
                })
                );

                } catch (e) {
                    console.log(e);
                }  
        }
        submission.response = submission.response.map((section) => {
        if (section.sectionId.toString() === sectionId.toString()) {
            return {
            ...section,
            sectionType,
            ...(sectionType === 'quiz'
                ? { quizAnswers: response }
                : { codingAnswers: response }),
            totalQuestions: totalQuestions || -1,
            correctAnswers: sectionWithSolution?.type === 'quiz' ? correctAnswers : -1
            };
        }
        return section;
        });

        submission.currSection = current + 1;
        if(submission.isSubmitted) submission.isEvaluated = true;
        await submission.save();

        return {
            success: true,
            message: `Updated ${sectionType} answers for section ${sectionId}`,
            nextSection: submission.currSection
        };
  } catch (err) {
    console.error("Error submitting section:", err);
    return {
      success: false,
      message: err.message || "Internal server error"
    };
  }


}