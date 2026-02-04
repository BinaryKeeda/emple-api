import { Router } from "express";
import { mainQueue } from "../queues/mainQueue.js";
import { TestResponse } from "../../models/test/TestResponse.js";
import { Test } from "../../models/test/TestSchema.js";

const testRouter = Router();

testRouter.post('/submit/section' , async (req,res) => {
    try {

        const { sectionId, submissionId, sectionLength , sectionType,autoSubmit, quizAnswers, codingAnswers } = req.body;
        const submission  = await TestResponse.findById(submissionId);
        // const test = await Test.findById(testId);
        submission.curr += 1;
        if (submission.curr >= sectionLength || autoSubmit) {
            submission.isSubmitted = true;
        }  
        submission.save();

        mainQueue.add('testEval' , {
            sectionId, submissionId, sectionType, quizAnswers, codingAnswers
        } , {
            attempts: 5,
            priority:1,
            backoff: true,
            removeOnComplete: true,
            removeOnFail: false,
            timeout: 10000
        })

        return res.json({message:"Section submitted successfully" ,isSubmitted:submission.isSubmitted});
    } catch (error) {
        res.json({message: "Error while adding job"})
    }
})

export default testRouter;