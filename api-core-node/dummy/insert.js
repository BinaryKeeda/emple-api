import mongoose from 'mongoose';
import CampusTest from '../../models/campus/CampusTest.js'; // adjust path as needed

const insertCampusTest = async () => {
  const ObjectId = mongoose.Types.ObjectId;

  const test = {
    title: "Practice Test 2",
    campusId: 3,
    opensAt: new Date("2025-07-01T09:00:00.000Z"),
    closesAt: new Date("2025-07-01T11:00:00.000Z"),
    sections: [
      {
        title: "Aptitude",
        type: "quiz",
        maxQuestion: 20,
        maxTime: 20,
        maxScore: 20,
        description: "Questions on percentages, averages, time & work, reasoning, and number series",
        questionPool:"686965082c75033e79231cd2",
      },
      {
        title: "Computer Science Basics",
        type: "quiz",
        maxQuestion: 20,
        maxTime: 20,
        maxScore: 20,
        description: "MCQs covering OOP, Java, OS, Scheduling, Memory",
        questionPool: "686967f480aec58b164ebddc"
      },
      {
        title: "Coding Challenge",
        type: "coding",
        maxQuestion: 1,
        maxTime: 20,
        maxScore: 20,
        description: "Solve real-world coding problems",
        problemPool: [
          new ObjectId("68603f7b5b909bf7604dc37e"),
          new ObjectId("68603f3b5b909bf7604dc37c"),
        ]
      }
      // {
      //   title: "Automata Fix",
      //   type: "coding",
      //   maxQuestion: 3,
      //   maxTime: 45,
      //   maxScore: 20,
      //   description: "Solve real-world coding problems",
      //   problemPool: [
      //     new ObjectId("68603ffb5b909bf7604dc384"),
      //     new ObjectId("68603fd55b909bf7604dc382"),
      //     new ObjectId("68603fca5b909bf7604dc380") ,
      //   ]

      // }
    ]
  };

  try {
    await CampusTest.create(test);
    console.log("✅ Test inserted successfully.");
  } catch (error) {
    console.error("❌ Insertion failed:");
    console.error(error);
  }
};

export default insertCampusTest;
