import { Router } from "express";
import { campusQueue } from "../queues/mainQueue.js";

const examRouter = Router();

examRouter.post('/test' , async (req,res) => {
    try {
       const {data} = req.body; 
       await campusQueue.add('evalExam', {data});
       return res.send("")
    }
    catch(e) {
        return res.send("")
    }
})
export default examRouter;