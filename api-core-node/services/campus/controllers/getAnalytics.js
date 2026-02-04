import mongoose from 'mongoose'
import Quiz from "../../../../models/core/Quiz.js";
import Users from "../../../../models/core/User.js";
import { Test } from "../../../../models/test/TestSchema.js";
import Solution from '../../../../models/core/Solution.js';
import { TestResponse } from '../../../../models/test/TestResponse.js';
import { SectionMember } from '../../../../models/shared/memeber.js';
import { GroupInvites } from '../../../../models/shared/Invite.js';
import { SectionOwner } from '../../../../models/shared/owner.js';
import Section from '../../../../models/core/Section.js';
import ExamSolution from '../../../../models/Exam/ExamSolution.js';
import Exam from '../../../../models/Exam/Exam.js';

export const getDashboardAnalytics = async (req, res) => {
  try {
    const { sectionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(sectionId)) {
      return res.status(400).json({ error: "Invalid sectionId" });
    }

    // if (!mongoose.Types.ObjectId.isValid(groupId)) {
    //   return res.status(400).json({ error: "Invalid groupId" });
    // }

    const sec = await Section.findById(sectionId);
    const groupId = sec.groupId;

    // ✅ Get users of this group + section
    const users = await SectionMember.find({ section: sectionId })
      .populate('userId', 'name email role');
    const userIds = users.map(u => u._id);


    // ✅ Total quizzes in this section
    const totalQuizzes = await Quiz.countDocuments({ sectionId });

    // ✅ Total quiz submissions (Solutions)
    const totalQuizSubmissions = await Solution.countDocuments({
      userId: { $in: userIds },
      sectionId
    });

    // ✅ Total test submissions (all attempts)
    const exams = await Exam.find({ sectionId: sectionId });
    const examsIds = exams.map(e => e._id);
    const totalTestSubmissions = await ExamSolution.countDocuments({
      testId: { $in: examsIds }
    });


    const totalTests = await Exam.countDocuments({ sectionId: sectionId });

    res.json({
      totalUsers: users.length,
      totalQuizzes,
      totalQuizSubmissions,
      totalTests,
      totalTestSubmissions
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load dashboard analytics" });
  }
};




export const getQuizAnalytics = async (req, res) => {
  try {
    const { campusId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(campusId)) {
      return res.status(400).json({ error: 'Invalid campusId' });
    }

    // Count total quizzes (optional global stat)
    const totalQuizzes = await Quiz.countDocuments();

    // Step 1: Aggregate Solutions where user.campusId === campusId
    const totalQuizAttempts = await Solution.aggregate([
      // Join with Users collection
      {
        $lookup: {
          from: 'users', // ⚠️ collection name in MongoDB, not model name
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      { $match: { 'user.campusId': campusId, isSubmitted: true } },

      // Group by quizId and count
      {
        $group: {
          _id: '$quizId',
          totalAttempts: { $sum: 1 },
          avgScore: { $avg: '$score' },
          maxScore: { $max: '$score' }
        }
      },
      // Optionally: Join with quiz title
      {
        $lookup: {
          from: 'quizzes',
          localField: '_id',
          foreignField: '_id',
          as: 'quiz'
        }
      },
      { $unwind: '$quiz' },
      {
        $project: {
          quizId: '$_id',
          title: '$quiz.title',
          slug: '$quiz.slug',
          totalAttempts: 1,
          avgScore: { $round: ['$avgScore', 2] },
          maxScore: 1
        }
      }
    ]);

    res.json({
      totalQuizzes,
      totalQuizAttempts
    });

  } catch (err) {
    console.error('Quiz analytics error:', err);
    res.status(500).json({ error: 'Failed to load quiz analytics' });
  }
};

export const getSectionUsers = async (req, res) => {
  try {
    const userRole = req.user?.role || req.user?.user?.role;
    const { sectionId } = req.params;

    const {
      page = 1,
      limit = 20,
      search = "",
      role = "all",
      status = "all",
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    let combined = [];

    // -------------------------------
    // 1️⃣ MEMBERS
    // -------------------------------
    if (role === "all" || role === "user") {
      const members = await SectionMember.find({ section: sectionId })
        .populate("userId", "name email role");

      combined.push(
        ...members
          .filter(m => m.userId) // 🔥 IMPORTANT
          .map(m => ({
            _id: m.userId._id,
            name: m.userId.name,
            email: m.userId.email,
            role: m.userId.role || "user",
            status: "member",
          }))
      );
    }

    // -------------------------------
    // 2️⃣ ADMINS (only if campus-superadmin)
    // -------------------------------
    if ((role === "all" || role === "admin") && userRole === "campus-superadmin") {
      const admins = await SectionOwner.find({ section: sectionId })
        .populate("userId", "name email role");

      combined.push(
        ...admins
          .filter(a => a.userId)
          .map(a => ({
            _id: a.userId._id,
            name: a.userId.name,
            email: a.userId.email,
            role: a.userId.role || "admin",
            status: "admin",
          }))
      );

    }

    // -------------------------------
    // 3️⃣ INVITEES
    // -------------------------------
    if (role === "all" || role === "invitee") {
      const invites = await GroupInvites.find({ sectionId })
        .populate("userId", "name email role");

      combined.push(
        ...invites.map(inv => {
          if (inv.userId) {
            return {
              _id: inv.userId._id,
              name: inv.userId.name,
              email: inv.userId.email,
              role: inv.userId.role || "invitee",
              status: "pending",
            };
          }

          // email-only invite
          return {
            _id: inv._id,
            name: inv.name,
            email: inv.email,
            role: "invitee",
            status: "pending",
          };
        })
      );

    }

    // -------------------------------
    // 4️⃣ Apply SEARCH
    // -------------------------------
    if (search) {
      const s = search.toLowerCase();
      combined = combined.filter(
        (u) =>
          u.name?.toLowerCase().includes(s) ||
          u.email?.toLowerCase().includes(s)
      );
    }

    // -------------------------------
    // 5️⃣ Apply STATUS filter
    // -------------------------------
    if (status !== "all") {
      combined = combined.filter(
        (u) => u.status?.toLowerCase() === status.toLowerCase()
      );
    }

    // -------------------------------
    // 6️⃣ PAGINATION
    // -------------------------------
    const total = combined.length;
    const paginated = combined.slice(skip, skip + Number(limit));

    // -------------------------------
    // 7️⃣ Final Response
    // -------------------------------
    res.json({
      success: true,
      data: paginated,
      total,
      page: Number(page),
      limit: Number(limit),
    });

  } catch (err) {
    console.error("Error fetching section users:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Remove Member / Revoke Invite
// router.delete("/students/:sectionId/:groupId/:userId",
export const deleteSectionUser = async (req, res) => {
  try {
    const { sectionId, groupId, userId } = req.params;

    const user = await Users.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Remove from members
    if (user.groups?.has(groupId)) {
      user.groups.set(
        groupId,
        user.groups.get(groupId).filter((sid) => sid.toString() !== sectionId)
      );
    }

    // Remove from pending invites
    user.pendingInvites = user.pendingInvites.filter(
      (inv) =>
        inv.groupId.toString() !== groupId ||
        !inv.sectionIds.some((sid) => sid.toString() === sectionId)
    );

    await user.save();

    res.json({ message: "User removed/revoked successfully" });
  } catch (err) {
    console.error("Error removing student:", err);
    res.status(500).json({ error: "Server error" });
  }
}
