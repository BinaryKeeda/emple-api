import mongoose from "mongoose";
import redis from "../../../../config/redisConn.js";
import transporter from "../../../../config/transporter.js";
import Solution from "../../../../models/core/Solution.js";
import Problem from "../../../../models/test/Problem.js";
import { TestResponse } from "../../../../models/test/TestResponse.js";
import Quiz from "../../../../models/core/Quiz.js";
import { Test } from "../../../../models/test/TestSchema.js";
import { GroupMember, SectionMember } from "../../../../models/shared/memeber.js";
import { GroupInvites } from "../../../../models/shared/Invite.js";
import { GroupOwner, SectionOwner } from "../../../../models/shared/owner.js";
import Users from "../../../../models/core/User.js";
import Section from "../../../../models/core/Section.js";
import ExamSolution from "../../../../models/Exam/ExamSolution.js";
import Exam from "../../../../models/Exam/Exam.js";
import { NotificationModel } from "../../../../models/shared/Notification.js";



export const getProblems = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      visibility = "Public",
      isAvailable = true,
      groupId,
      difficulty,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    const filters = {};

    if (search) {
      filters.title = { $regex: search, $options: "i" };
    }
    if (difficulty) filters.difficulty = difficulty;
    // if (visibility) filters.visibility = visibility;
    // if (isAvailable) filters.isAvailable = isAvailable === "true";
    // if (groupId) filters.groupId = groupId;
    const total = await Problem.countDocuments(filters)

    const problems = await Problem.find(filters).select('title slug difficulty description')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    res.status(200).json({
      success: true,
      data: problems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}
export const getProblemsBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    // const key = `problems:${slug}`; // Better naming convention with colon

    // const cachedProblem = await redis.get(key);
    // if (cachedProblem) {
    //   return res.status(200).json({
    //     success: true,
    //     data: JSON.parse(cachedProblem),
    //     source: 'cache',
    //   });
    // }

    // Fetch from DB
    const problem = await Problem.findOne({ slug }).select('title slug difficulty description constraints inputFormat outputFormat examples functionSignature hints');
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }

    // Cache it
    // await redis.set(key, JSON.stringify(problem), 'EX', 60 * 60); // Cache for 1 hour

    return res.status(200).json({ success: true, data: problem, source: 'db' });
  } catch (error) {
    console.error('[getProblemsBySlug]', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
export const getUserTestSoltutionList = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      visibility = "Public", // unused in query currently
      isAvailable = true,    // unused in query currently
      groupId,
      difficulty,
      sortBy = "createdAt",
      sortOrder = "desc",
      userId
    } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const query = {
      isEvaluated: true,
      userId: userId
    };



    // Optional: Add text search if required
    if (search) {
      query.$text = { $search: search };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [data, total] = await Promise.all([
      ExamSolution.find(query)
        .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('_id score isSubmitted createdAt')
        .populate({
          path: "testId",
          select: "name"
        }),
      ExamSolution.countDocuments(query)
    ]);

    return res.status(200).json({
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      data,
      totalPages: Math.ceil(total / limit)
    });

  } catch (e) {
    console.error("Error in getUserQuizSolutionList:", e);
    return res.status(500).json({ error: "Server Error" });
  }
}
export const userFeedback = async (req, res) => {
  try {
    const { name, email, message } = req.body;
    await transporter.sendMail({
      from: 'no-reply <no-reply@binarykeeda.com>',
      to: "binarykeeda.education@gmail.com",
      text: `
        ${JSON.stringify(data)}
       `
    })
  } catch (e) {
    res.status(500).json({ message: "Internak Server Error" })
  }
}
export const getUserQuizSolutionList = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      sortBy = "createdAt",
      sortOrder = "desc",
      difficulty = "",
      category = "",
      userId
    } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Base pipeline
    const pipeline = [
      {
        $match: {
          isEvaluated: true,

          userId: new mongoose.Types.ObjectId(userId)
        }
      },
      {
        $lookup: {
          from: "quizzes",
          localField: "quizId",
          foreignField: "_id",
          as: "quiz"
        }
      },
      { $unwind: "$quiz" }
    ];

    if (search) {
      pipeline.push({
        $match: {
          "quiz.title": { $regex: search, $options: "i" }
        }
      });
    }

    if (category) {
      pipeline.push({
        $match: {
          "quiz.category": category
        }
      });
    }

    if (difficulty) {
      pipeline.push({
        $match: {
          "quiz.difficulty": difficulty
        }
      });
    }

    // Sorting, skipping, limiting
    pipeline.push(
      { $sort: { [sortBy]: sortOrder === "asc" ? 1 : -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) },
      {
        $project: {
          _id: 1,
          score: 1,
          isSubmitted: 1,
          createdAt: 1,
          quizId: 1,
          "quiz.title": 1,
          "quiz.difficulty": 1
        }
      }
    );

    const [data, totalResult] = await Promise.all([
      Solution.aggregate(pipeline),
      Solution.aggregate([
        {
          $match: {
            isEvaluated: true,
            userId: new mongoose.Types.ObjectId(userId)
          }
        },
        {
          $lookup: {
            from: "quizzes",
            localField: "quizId",
            foreignField: "_id",
            as: "quiz"
          }
        },
        { $unwind: "$quiz" },
        ...(search
          ? [{ $match: { "quiz.title": { $regex: search, $options: "i" } } }]
          : []),
        ...(category ? [{ $match: { "quiz.category": category } }] : []),
        ...(difficulty ? [{ $match: { "quiz.difficulty": difficulty } }] : []),
        { $count: "total" }
      ])
    ]);

    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    // --- Calculate rank for each quiz
    for (let sol of data) {
      const ranking = await Solution.aggregate([
        {
          $match: {
            quizId: sol.quizId,
            isEvaluated: true
          }
        },
        { $sort: { score: -1, createdAt: 1 } }, // high score = better rank
        {
          $group: {
            _id: null,
            users: {
              $push: {
                userId: "$userId",
                score: "$score"
              }
            }
          }
        }
      ]);

      if (ranking.length > 0) {
        const users = ranking[0].users;
        const rank =
          users.findIndex(
            (u) => u.userId.toString() === userId.toString()
          ) + 1;
        sol.rank = rank;
        sol.totalParticipants = users.length;
      } else {
        sol.rank = null;
        sol.totalParticipants = 0;
      }
    }

    return res.status(200).json({
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      data,
      totalPages: Math.ceil(total / limit)
    });
  } catch (e) {
    console.error("Error in getUserQuizSolutionList:", e);
    return res.status(500).json({ error: "Server Error" });
  }
};
export const getUserQuiz = async (req, res) => {
  try {
    const userId = req.user._id; // authenticated user
    const {
      sectionId,
      isGroup,
      page = 1,
      limit = 10,
      category,
      difficulty,
      search
    } = req.query;

    const match = { isAvailable: true };

    if (sectionId && mongoose.Types.ObjectId.isValid(sectionId)) {
      match.sectionId = new mongoose.Types.ObjectId(sectionId);
    }
    if (isGroup !== undefined) match.isGroup = isGroup === "true";
    if (category) match.category = category;
    if (difficulty) match.difficulty = difficulty;
    if (search) match.title = { $regex: search, $options: "i" };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // ✅ confirm collection name dynamically
    const solutionCollection = mongoose.model("Solution").collection.name;

    const quizzes = await Quiz.aggregate([
      { $match: match },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) },

      // ✅ Lookup user's solutions (no restrictive filter)
      {
        $lookup: {
          from: solutionCollection,
          let: { quizId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$quizId", "$$quizId"] },
                    { $eq: ["$userId", new mongoose.Types.ObjectId(userId)] },
                  ],
                },
              },
            },
          ],
          as: "userSubmissions",
        },
      },

      // 👇 Add derived flag
      {
        $addFields: {
          locked: { $gt: [{ $size: "$userSubmissions" }, 0] },
        },
      },

      // 👇 Remove unnecessary field
      {
        $project: {
          userSubmissions: 0,
        },
      },
    ]);

    const total = await Quiz.countDocuments(match);

    res.status(200).json({
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      quizzes,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
export const getUserTests = async (req, res) => {
  try {
    const { sectionId, page = 1, limit = 10, userId } = req.query;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const match = {
      isAvailable: true
    };
    if (sectionId) match.sectionId = new mongoose.Types.ObjectId(sectionId);

    // ✅ Use actual collection name from your model
    const testResponseCollection = ExamSolution.collection.name; // usually "testresponses"

    const tests = await Exam.aggregate([
      { $match: match },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) },

      // 👇 Lookup to find if the user has any response for this test
      {
        $lookup: {
          from: testResponseCollection,
          let: { testId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$testId", "$$testId"] },
                    { $eq: ["$userId", new mongoose.Types.ObjectId(userId)] },
                  ],
                },
              },
            },
          ],
          as: "userSubmissions",
        },
      },

      {
        $addFields: {
          locked: {
            $and: [
              { $gt: [{ $size: "$userSubmissions" }, 0] },
              { $eq: [{ $arrayElemAt: ["$userSubmissions.isSubmitted", 0] }, true] }
            ]
          }
        }
      },



      // 👇 Remove lookup details from final result
      {
        $project: {
          userSubmissions: 0,
        },
      },
    ]);

    const total = await Exam.countDocuments(match);

    res.status(200).json({
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      tests,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};
export const getUserGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const groups = await GroupMember.find({ userId: id }).populate({ path: 'group', select: "groupName" });
    res.status(200).json({ data: groups, success: true, message: "Groupes fetched successfully" });
  } catch (e) {
    res.status(500).json({ success: false, message: "Error in fectching ... " });
  }
}
export const getUserInvite = async (req, res) => {
  try {
    const id = req.params.id;

    if (!id)
      return res.status(400).json({
        success: false,
        message: "Id missing",
      });

    // 1. Get all group invites
    const invites = await GroupInvites.find({ userId: id })
      .populate({ path: "groupId", select: "groupName" })
      .populate({ path: "invitedBy", select: "name" });

    // 2. Get all section IDs where this user is a member
    const sectionIds = await SectionMember.find({ userId: id }).distinct("section");

    // 3. Fetch ALL notifications from ALL sections the user belongs to
    const notifications = await NotificationModel.find({
      sectionId: { $in: sectionIds }
    }).populate({
      path: "userId",
      select: "name",
    });
    console.log(notifications)

    // 4. Combine & send response
    res.status(200).json({
      data: [...invites, ...notifications],
      success: true,
      message: "Data fetched successfully",
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Error in fetching ... ",
    });
  }
};
export const respondToInvite = async (req, res) => {
  try {
    const { inviteId, accept } = req.body;
    // const userId = req.user._id; 

    if (!inviteId) {
      return res.status(400).json({ success: false, message: "Invite ID missing" });
    }

    const invite = await GroupInvites.findById(inviteId);
    const userId = invite.userId;
    if (!invite) {
      return res.status(404).json({ success: false, message: "Invite not found" });
    }
    if (String(invite.userId) !== String(userId)) {
      return res.status(403).json({ success: false, message: "Not authorized to respond to this invite" });
    }

    if (!accept) {
      await GroupInvites.findByIdAndDelete(inviteId);
      return res.status(200).json({ success: true, message: "Invite rejected" });
    }

    const { sectionId, role } = invite;
    const groupId = await Section.findById(sectionId).then(sec => sec.groupId);

    if (role === "user") {
      const exists = await GroupMember.findOne({ userId, group: groupId });
      if (!exists) {
        await GroupMember.create({ userId, group: groupId });
      }
      if (sectionId) {
        const secExists = await SectionMember.findOne({ userId, section: sectionId });
        if (!secExists) {
          await SectionMember.create({ userId, section: sectionId });
        }
      }
    } else if (role === "campus-admin") {
      const user = await Users.findById(userId);
      user.role = "campus-admin";
      user.save();
      const exists = await SectionOwner.findOne({ userId, section: sectionId });
      if (!exists) {
        await SectionOwner.create({ userId, section: sectionId });
      }
    } else if (role === "campus-superadmin") {
      const user = await Users.findById(userId);
      user.role = "campus-superadmin";
      user.save();
      const exists = await GroupOwner.findOne({ userId, group: groupId });
      if (!exists) {
        await GroupOwner.create({ userId, groupId, role: "superadmin" });
      }
    }

    await GroupInvites.findByIdAndDelete(inviteId);

    return res.status(200).json({ success: true, message: "Invite accepted successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error while responding to invite" });
  }
};
export const getSections = async (req, res) => {
  try {
    const { id: userId, groupId } = req.params;
    // console.log("Id:" +  groupId)
    const sections = await SectionMember.find({ userId }).populate({ path: "section", select: "name logo groupId" })
    console.log(sections)
    return res.status(200).json({
      success: true,
      data: sections.filter(s => s.section.groupId.toString() == groupId)
    });
  } catch (e) {
    console.error("Error fetching sections:", e.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch sections"
    });
  }
};
