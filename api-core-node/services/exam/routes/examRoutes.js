import {Router} from 'express'
import { addProblemPool, addQuestionPool, addSectionToExam, createBank, createExam } from '../controllers/createExamRoutes.js';
import { getAllExams, getAllQuestions, getExamById, getProblemData } from '../controllers/getExamData.js';
import { getAllSubmissions, getUserExamSolution, startExam, submitExamDetails } from '../controllers/getExamSolution.js';
import { startSection, submitFeedback, submitSection } from '../controllers/postExamSolution.js';
import Exam from '../../../../models/Exam/Exam.js';
import mongoose from 'mongoose';
import ExamSolution from '../../../../models/Exam/ExamSolution.js';

const examRouter = Router();

examRouter.post('/create' , createExam);
examRouter.post('/create/bank' , createBank);
examRouter.post('/add/section/:examId/' , addSectionToExam);
examRouter.post('/add/questionPool/:examId/:sectionId' , addQuestionPool)
examRouter.post('/add/problemPool/:examId/:sectionId' , addProblemPool);
examRouter.delete('/delete/:id' , async (req,res) => {
  const {id} = req.params;
  try {
    if(!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({message : "Invalid Exam ID"})
    }
    const examSolutions = await ExamSolution.findOne({testId : id});
    if(examSolutions) {
      return res.status(400).json({message : "Cannot delete exam with existing submissions"})
    }
    const deletedExam = await Exam.findByIdAndDelete(id);
    if(!deletedExam) {
      return res.status(404).json({message : "Exam not found"})
    }
    return  res.status(200).json({message : "Exam deleted successfully", deletedExam})
  }
  catch (error) {
    console.error("Error deleting exam:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
})

examRouter.get('/all/:sectionId' , getAllExams);
examRouter.get('/particular/:examId/', getExamById);
examRouter.get('/questionbank/:sectionId/' , getAllQuestions);
examRouter.get('/problems/', getProblemData)
examRouter.get('/getall/submissions/:examId' , getAllSubmissions);
examRouter.post('/solution', getUserExamSolution);
examRouter.post('/start-test' , startExam );
examRouter.post('/start-section', startSection);
examRouter.post('/submit-section', submitSection);
// campusTestRouter.post('/mark-ufm', markUFM);
examRouter.post('/submit-details', submitExamDetails);
examRouter.post('/submit-feedback', submitFeedback);
examRouter.post('/delete/sections',async (req,res) => {
  const { examId, sectionId } = req.body;

  try {
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    const sectionIndex = exam.sections.findIndex(
      (sec) => sec._id.toString() === sectionId
    );

    if (sectionIndex === -1) {
      return res.status(404).json({ message: "Section not found" });
    }

    // Remove the section
    exam.sections.splice(sectionIndex, 1);

    await exam.save();

    res.status(200).json({
      message: "Section deleted successfully",
      exam,
    });
  } catch (error) {
    console.error("Error deleting section:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
})

examRouter.post('/update/sections' , async (req,res) => {

    const { examId, sectionId, ...updateData } = req.body;

    try {
        const exam = await Exam.findById(examId);
        if (!exam) return res.status(404).json({ message: "Exam not found" });

        const section = exam.sections.id(sectionId);
        if (!section) return res.status(404).json({ message: "Section not found" });
        console.log(updateData)
        // update only existing schema fields
        console.log("Section before:", section);
        Object.assign(section, updateData);

        // for (const key in updateData) {
        // if (section[key] !== undefined) section[key] = updateData[key];
        // }
        console.log("Section after:", section);


        // explicitly mark the section path modified
        exam.markModified('sections');
        await exam.save();

        res.status(200).json({
        message: "Section updated successfully",
        section,
        });
    } catch (error) {
        console.error("Error updating section:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
})

examRouter.put('/ufm-count' , async (req,res) => {

  try {
  const {submissionId} = req.body;
    const solution =  await ExamSolution.findById(submissionId);
    solution.ufmAttempts++;
    if(solution.ufmAttempts >= 6) {
      // solution.isSubmitted = true;
    } 
    solution.save();
    res.status(200).json({message:"UFM Count updated successfully" ,isSubmitted:solution.isSubmitted, ufmAttempts:solution.ufmAttempts})
  }catch(e) {
    console.log(e);
    res.status(500).json({message:"Internal Server Error" });
  }



})



// campusTestRouter.get('/time', async (req, res) => {
//     try {
//         const serverTime = Date.now();
//         res.status(200).json({ serverTime });
//     } catch (error) {
//         console.error('Error getting server time:', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });

export default examRouter;