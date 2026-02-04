import { Router } from "express";
import { getAllQuiz } from "../controllers/quizFetchControllers.js";

const quizRouter = Router();


quizRouter.get('/get' , getAllQuiz);

export default quizRouter;