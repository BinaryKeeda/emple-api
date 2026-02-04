import { Router } from "express";
import { mainQueue } from "../queues/mainQueue.js";
import Solution from "../../models/core/Solution.js";

const quizRouter = Router();

quizRouter.post('/submit', async (req, res) => {
    const { quizId, response, userId , submissionId} = req.body;

    // Basic validation
    if (!quizId || !response || !userId || !submissionId) {
        return res.status(400).json({ message: "Please fill all fields" });
    }
    await Solution.updateOne(
    { _id: submissionId, isSubmitted: false }, 
    { $set: { isSubmitted: true } }
    );
    

    try {
        const job = await mainQueue.add(
            'quizEval',
            { quizId, response, userId , submissionId},
            {
                priority: 2,
                attempts: 3,
                removeOnComplete: true,
                removeOnFail: false,
            }
        );

        return res.status(202).json({
            message: "Submission received. Evaluation in progress.",
            jobId: job.id
        });
    } catch (error) {
        console.error("Error adding job to queue:", error);
        return res.status(500).json({
            message: "Something went wrong while processing your submission.",
        });
    }
});

export default quizRouter;
