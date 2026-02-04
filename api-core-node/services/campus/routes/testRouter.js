import { Router } from "express";
import { getUserTestSolution, markUFM, startTest, submitDetails, submitFeedback } from "../controllers/getTestSolution.js";
import { startSection, submitSection } from "../controllers/postSolution.js";

const campusTestRouter = Router();

campusTestRouter.post('/solution',getUserTestSolution);
campusTestRouter.post('/start-test' , startTest );
campusTestRouter.post('/start-section', startSection);
campusTestRouter.post('/submit-section', submitSection);
campusTestRouter.post('/mark-ufm', markUFM);
campusTestRouter.post('/submit-details', submitDetails);
campusTestRouter.post('/submit-feedback', submitFeedback); // This route is for submitting user details
campusTestRouter.get('/time', async (req, res) => {
    try {
        const serverTime = Date.now();
        res.status(200).json({ serverTime });
    } catch (error) {
        console.error('Error getting server time:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default campusTestRouter;