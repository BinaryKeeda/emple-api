import { Router } from "express";
import  { mainQueue} from '../queues/mainQueue.js';
import { campusMailer, resetPassword, signUpRequest, userFeedback } from "../controlllers/mailController.js";
import { signupLinkLimiter } from "../../config/rateLimiter.js";
const mailRouter = Router();

mailRouter.post('/signup/requested',signupLinkLimiter, signUpRequest);
mailRouter.get('/signup/success', async (req, res) => {});
mailRouter.post('/forget-password', signupLinkLimiter,resetPassword);
mailRouter.post('/feedback' , userFeedback);
mailRouter.post('/campus',  campusMailer);

export default mailRouter;