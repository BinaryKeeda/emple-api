import { Router } from "express";
import { addProblem } from "./controllers/prbolemControllers.js";
import { addQuestionBank, addQuestionsToBank, getQuestionBankQuestions } from "./controllers/questionBankRouter.js";
import upload from "../../../config/upload.js";
import { addQuestion, addQuestions as addQuestionsQuiz, addQuiz, delQuestion, editQuiz, getParticularQuiz } from "./controllers/quizRouters.js";
import { getAdminSummary, getCampusTestsForAdmin, getPaginatedQuestionBank, getProblems, getQuizzesForAdmin, getTestsForAdmin } from "./controllers/getData.js";
import { addBulkQuestionsToSection, addProblemToSection, addQuestionToSection, addSectionToTest, createTest, deleteQuestionFromSection, deleteSectionFromTest, getTestById, updateQuestionInSection, updateTestById } from "./controllers/testController.js";
import { addProblemToCampusSection, addQuestionBankToCampusSection, addSectionToCampusTest, createCampusTest, deleteSectionFromCampusTest, editCampusTest, getCampusTestById, removeProblemFromSection } from "./controllers/testCampusController.js";
import { assignGroupOwner, deleteGroupAdmin, getAllGroups } from "./controllers/groupController.js";
import { getEmailSendingStatus, sendEmailsForTest } from "./controllers/mailer.js";
import { deleteCampusTest, deleteProblem, deleteQuestionBank, deleteQuiz, deleteTest } from "./controllers/deleteContent.js";

const adminRouter = Router();

adminRouter.post('/problems/add' , addProblem )
// adminRouter.post('/problem/add')

/// QuestionBank router 
adminRouter.post('/add/questionbank' , addQuestionBank);
adminRouter.get('/get/questionbank/questions/:bankId' , getQuestionBankQuestions);
adminRouter.post('/add/questionbanks/questions/:bankId' , addQuestionsToBank);
// addProblem.post('/add/questions/question-bank' )

// Quiz Code
adminRouter.post('/quiz/add' , addQuiz);
adminRouter.post('/quiz/add/question', upload.single('image') , addQuestion);
adminRouter.post('/quiz/add/questions', addQuestionsQuiz);
adminRouter.delete('/quiz/question/del/:quizId/:questionId', delQuestion)
adminRouter.get('/quiz/:id',getParticularQuiz);
adminRouter.post('/quiz/edit/:id' , editQuiz);

// Test Routes
adminRouter.get('/tests/:id' , getTestById);
adminRouter.post('/tests/add', createTest);
adminRouter.put('/tests/update/:id', updateTestById);
adminRouter.post('/tests/:testId/sections', addSectionToTest);
adminRouter.post('/tests/:testId/sections/:sectionIndex/question', addQuestionToSection)
adminRouter.post('/tests/:testId/sections/:sectionId/questions', addBulkQuestionsToSection);
adminRouter.post('/tests/:testId/sections/:sectionId/problem', addProblemToSection);
adminRouter.put('/tests/:testId/sections/:sectionIndex/questions/:questionIndex', updateQuestionInSection)
adminRouter.delete('/tests/:testId/sections/:sectionIndex/questions/:questionIndex', deleteQuestionFromSection)
adminRouter.delete('/tests/section/:sectionId' , deleteSectionFromTest);

// Get Data for Admin 
adminRouter.get('/quiz', getQuizzesForAdmin);
adminRouter.get('/test', getTestsForAdmin);
adminRouter.get('/campustest' , getCampusTestsForAdmin);
adminRouter.get('/problems' , getProblems);
adminRouter.get('/questionbanks' , getPaginatedQuestionBank);
adminRouter.get('/summary' , getAdminSummary);
adminRouter.get('/groups' ,  getAllGroups);

// ------------------------------------
// Deletiion routes
// ------------------------------------

adminRouter.post('/delete/quiz/:id', deleteQuiz);
adminRouter.post('/delete/campustest/:id' , deleteCampusTest);
adminRouter.post('/delete/test/:id' , deleteTest);
adminRouter.post('/delete/problems/:id', deleteProblem);
adminRouter.post('/delete/questionbanks/:id' , deleteQuestionBank);
// ------------------------------------
// Campus Test 
// ------------------------------------
adminRouter.post('/campus/test/add', createCampusTest);
adminRouter.get('/campus/tests/:id' , getCampusTestById);
adminRouter.put('/campus/tests/update/:id' , editCampusTest);
adminRouter.put('/campus/tests/:id/sections', addSectionToCampusTest);   // Add new section to test
adminRouter.delete('/campus/tests/:testId/sections/:sectionId', deleteSectionFromCampusTest);   // Add new section to test
adminRouter.put('/campus/tests/:testId/sections/:sectionId/problems', addProblemToCampusSection);         // Add problems
adminRouter.put('/campus/tests/:testId/sections/:sectionId/question-bank', addQuestionBankToCampusSection); // Assign questi
adminRouter.delete('/campus/tests/:testId/sections/:sectionId/problems/' , removeProblemFromSection);

// ========================================
//      Mail Routes
// ========================================
adminRouter.post("/campus-test/:testId/send-mails", sendEmailsForTest);
adminRouter.get("/campus-test/:testId/email-status", getEmailSendingStatus);
adminRouter.post("/groups/assign-owner", assignGroupOwner);
adminRouter.get('/groups/admin/delete/:id' , deleteGroupAdmin);

export default adminRouter;





// QuizRouter.post('/quiz/add/', addQuiz);
// QuizRouter.post('/quiz/add/question', upload.single('image'), addQuestion);
// QuizRouter.post('/quiz/add/questions', addQuestions);