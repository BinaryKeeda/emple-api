import CampusTestSolution from "../../../../models/campus/CampusTestSolution.js";
import axios from 'axios'
export const startSection = async (req, res) => {
  try {
    const { testId, userId, sectionId, sectionType } = req.body;

    if (!testId || !userId || !sectionId || !sectionType) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check for duplicate section only if needed (optional)
    const existing = await CampusTestSolution.findOne({
      testId,
      userId,
      'response.sectionId': sectionId,
    });

    if (existing) {
      const existingSection = existing.response.find(
        (sec) => sec.sectionId.toString() === sectionId
      );
      return res.status(200).json({ message: "Section already started", section: existingSection });
    }

    const newSection = {
      sectionId,
      sectionType,
      correctAnswers: 0,
      totalQuestions: 0,
      quizAnswers: [],
      codingAnswers: [],
      startedAt: new Date(),
      pausedAt: null,
      durationUnavailaible: 0,
      isSubmitted: false,
    };

    const updated = await CampusTestSolution.updateOne(
      { testId, userId },
      { $push: { response: newSection } }
    );

    if (updated.modifiedCount === 0) {
      return res.status(500).json({ message: "Failed to start section" });
    }

    return res.status(200).json({ message: "Section started", section: newSection });
  } catch (error) {
    console.error("Error in startSection:", error);
    return res.status(500).json({ message: "Server error while starting section" });
  }
};

export const submitSection = async (req, res) => {
  try {
    const {submissionId, sectionId,sectionType, response  ,current} = req.body;

    const userSolution = await CampusTestSolution.findById(submissionId);

    if(userSolution.testSnapshot.length == current + 1) {
      userSolution.isSubmitted = true;
    }
    userSolution.currSection = current + 1;
    // if(sectionType == 'quiz') {

      //webhook call
    // }else{
      //webhook call
    // }
    await userSolution.save();
    
    await axios.post(`https://evaluator.binarykeeda.com/weebhooks/campus/eval/test` , {data:{
      submissionId, sectionId,sectionType, response  ,current
    }} );
    return res.json({message:"Section Submitted ", nextSection:userSolution.isSubmitted?-1:current+1, submitted:userSolution.isSubmitted})
    
    
  } catch (error) {
    console.log(error)
    return res.json({message:"Internal Server Error"})
  }
}