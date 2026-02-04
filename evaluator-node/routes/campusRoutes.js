import { Router } from "express";
import { campusQueue } from "../queues/mainQueue.js";

const campusRouter = Router();

campusRouter.post('/test' , async (req,res) => {
    try {
        const {data} = req.body; 
        // console.log(data);
       await campusQueue.add('evalTest', {data});
       return res.send("")
    }
    catch(e) {
        console.log(e)
        return res.send("")
    }
})
export default campusRouter;