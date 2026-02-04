import { Router } from "express";
import { TestResponse } from "../../../../models/test/TestResponse.js";
import axios from 'axios'
import ExamSolution from "../../../../models/Exam/ExamSolution.js";
const testRouter = Router();


testRouter.post('/start' , async (req,res) => {
    try{
        const {submissionId} = req.body;
      
        const updatedSubmission = await TestResponse.findByIdAndUpdate(
            submissionId,
            {
                $set: {
                startedAt: Date.now(),
                hasAgreed: true
                }
            },
            { new: true }
        );
        await updatedSubmission.save();
        res.status(200).json({message : "Test started successfully" , startedAt:updatedSubmission.startedAt.getTime()});
    }catch (error) {
        console.log(error);
        res.status(400).json({message : "Failed to start test"});
    }
})

testRouter.post('/submit-section' , async (req,res) => {
    try{
        const {testResponseId , testSectionLength} = req.body;

        const submission = await TestResponse.findById(testResponseId);

        // const test = await Test.findById(testId);
        if(!submission){
            return res.status(404).json({message : "Test not found"});
        }
        submission.curr++;
        if (submission.curr >= testSectionLength) {
            submission.isSubmitted = true;
        }    
        await submission.save();
        res.status(200).json({message : "Section submitted successfully" ,  isSubmitted:submission.isSubmitted});
    }catch(e) {
        res.status(400).json({message : "Failed to submit section" });
    }
})

testRouter.get('/response/:id' , async (req,res) => {
    try{    
        const {id} = req.params;
        const testResponse = await ExamSolution.findById(id).populate('testId');
        if(!testResponse){
            return res.status(404).json({message : "Test response not found"});
        }
        res.status(200).json({status :true ,data:testResponse});

    }catch(e){
        res.status(400).json({message : "Failed to get test response"});
        console.log(e);

    }
})

testRouter.post('/autosubmit' , async (req,res) => {
    try{
        const {submissionId} = req.body;
        const submission = await TestResponse.findById(submissionId);
        // if(submission.ufm + 1 == 3) submission.isSubmitted = true;
        // else submission.ufm += 1;
        submission.save();
        res.json({message:  ""  , isSubmitted : submission.isSubmitted });

    }catch(e) {
        res.status(500).json({error:"Internal Server Error"})
    }
})

export default testRouter;