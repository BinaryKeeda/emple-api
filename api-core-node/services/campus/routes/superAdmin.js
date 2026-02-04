import { Router } from 'express'
import { getDashboardAnalytics, getSectionUsers } from '../controllers/getAnalytics.js'
import { exportQuizSubmissionsForSection, exportTestSubmissionsForSection, getQuizSubmissionsForSection, getTestSubmissionsForCampus, getTestSubmissionsForSection, getUserQuizSubmission, getUserTestSubmission, resourcesQuizRouter, resourcesTestRouter } from '../controllers/getResources.js';
import Section from '../../../../models/core/Section.js';
import Quiz from '../../../../models/core/Quiz.js';
import Users from '../../../../models/core/User.js';
import { Test } from '../../../../models/test/TestSchema.js';
import upload from '../../../../config/upload.js';
import Solution from '../../../../models/core/Solution.js';
import { TestResponse } from '../../../../models/test/TestResponse.js';
import { addUsersToSections, deleteUsersFromSection } from '../controllers/manageUsers.js';
import { deleteSection } from '../controllers/deleteSolutions.js';
import { SectionMember } from '../../../../models/shared/memeber.js';
import { GroupOwner, SectionOwner } from '../../../../models/shared/owner.js';
import Problem from '../../../../models/test/Problem.js';
import Exam from '../../../../models/Exam/Exam.js';
import { QuestionBank } from '../../../../models/shared/questionBank.js';
import { NotificationModel } from '../../../../models/shared/Notification.js';
import ExamSolution from '../../../../models/Exam/ExamSolution.js';

const campusSuperAdminRouter = Router();

const isCampusAdmin = (req, res, next) => {
  // if(req.user?.user.role ==="campus-superadmin" || req.user.user?.role === "campus-admin") next();
  // else res.status(401).json({message: "Role mismatch" , success:false});
  next();
}

// campusSuperAdminRouter.get('/:userId/:role/ownership' , getSectionOwnership) //latest route no need to review
campusSuperAdminRouter.get('/insights/:sectionId', getDashboardAnalytics);
campusSuperAdminRouter.get('/students/:sectionId/', getSectionUsers);
campusSuperAdminRouter.delete('/students/:sectionId/:studentId', deleteUsersFromSection);
campusSuperAdminRouter.get('/quiz/:type', resourcesQuizRouter);
campusSuperAdminRouter.get('/test/:type', resourcesTestRouter);
campusSuperAdminRouter.get('/quiz/submissions/:slug/:sectionId', getQuizSubmissionsForSection);
campusSuperAdminRouter.get('/test/submissions/:slug/:sectionId', getTestSubmissionsForSection);
campusSuperAdminRouter.post('/test/submissions/:slug/:sectionId', getTestSubmissionsForCampus);
campusSuperAdminRouter.get('/user/quiz/:id', getUserQuizSubmission);
campusSuperAdminRouter.get('/user/test/:id', getUserTestSubmission);

campusSuperAdminRouter.post('/create/section', isCampusAdmin, upload.single("logo"), async (req, res) => {
  try {
    console.log(req.body)
    const { name, groupId, userId } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Section name is required" });
    }
    console.log(req.file)
    const section = new Section({
      name,
      groupId,
      logo: req.file?.path || "",
    });

    await section.save();
    res.status(201).json(section);

  } catch (e) {
    res.json({ message: "Internal Server Error", success: false });
  }
})
campusSuperAdminRouter.get(
  "/get/sections/:userId",
  isCampusAdmin,
  async (req, res) => {
    try {
      const { userId } = req.params;

      const user = await Users.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Pagination
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const search = (req.query.search || "").trim();

      const skip = (page - 1) * limit;

      const filter = {};

      // Role-based filtering
      if (user.role === "campus-superadmin") {
        const group = await GroupOwner.findOne({userId:user._id});
        console.log(group);
        filter.groupId =group.group; // ✅ FIXED
      } else {
        filter.userId = user._id;
      }

      // Search
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
          { code: { $regex: search, $options: "i" } },
        ];
      }

      let sections, total;

      if (user.role === "campus-superadmin") {
        [sections, total] = await Promise.all([
          Section.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
          Section.countDocuments(filter),
        ]);
      } else {
        [sections, total] = await Promise.all([
          SectionOwner.find(filter).populate({
            path:'section'
          })
            .skip(skip)
            .limit(limit),
          SectionOwner.countDocuments(filter),
        ]);
      }

      return res.status(200).json({
        success: true,
        message: "Sections fetched successfully",
        data: sections,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      console.error("GET SECTIONS ERROR:", err);
      return res.status(500).json({
        success: false,
        message: "Error fetching sections",
      });
    }
  }
);


campusSuperAdminRouter.post('/create/quiz/:sectionId', async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { title, marks, duration, category, difficulty, visibility, tags, minimumScore } = req.body;
    const section = await Section.findById(sectionId);
    if (!section) {
      return res.status(404).json({ success: false, message: "Section not found" });
    }

    const quiz = new Quiz({
      title,
      marks,
      creator: req.user._id,
      duration,
      category,
      difficulty,
      sectionId,
      isGroup: true,
      isAvailable: false,
      creator: req.user._id, // assuming req.user is set via auth middleware
    });

    await quiz.save();

    res.status(201).json({ success: true, message: "Quiz created successfully", quiz });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});
campusSuperAdminRouter.post('/create/test/:sectionId', async (req, res) => {
  try {
    const { name, marks, duration, category, difficulty } = req.body;
    const { sectionId } = req.params;
    const section = await Section.findById(sectionId);
    if (!section) {
      return res.status(404).json({ success: false, message: "Section not found" });
    }
    const newTest = new Test({
      name: name,
      marks: marks,
      duration,
      creator: req.user._id, // assuming req.user is set via auth middleware
      isGroup: true,
      isAvailable: false,
      visibility: "group",
      sectionId,
      category,
      difficulty,
      sectionId
    });
    newTest.save()
    res.json({ status: true, message: "Test Created Successfully" }).status(200);
  }
  catch (e) {
    res.status(500).json({ message: e.message, success: false });
  }
})
campusSuperAdminRouter.get('/quiz/get/section/:sectionId', async (req, res) => {
  try {
    const { sectionId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Count total quizzes for this section
    const totalQuizzes = await Quiz.countDocuments({ sectionId });

    // Fetch quizzes with pagination + populate creator
    const quizzes = await Quiz.find({ sectionId })
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('creator', 'name email')
      .lean();

    // Cost per attempt (could be static or dynamic per org)
    const costPerAttempt = 5; // example ₹5 per attempt

    // Collect quizIds
    const quizIds = quizzes.map(q => q._id);

    // Get submission counts for all quizzes at once
    const submissionCounts = await Solution.aggregate([
      { $match: { quizId: { $in: quizIds } } },
      { $group: { _id: '$quizId', count: { $sum: 1 } } }
    ]);

    const submissionCountMap = submissionCounts.reduce((acc, cur) => {
      acc[cur._id.toString()] = cur.count;
      return acc;
    }, {});

    // attach costPerAttempt + noOfSubmissions
    const enrichedQuizzes = quizzes.map(q => ({
      ...q,
      costPerAttempt,
      noOfSubmissions: submissionCountMap[q._id.toString()] || 0
    }));

    res.json({
      success: true,
      page,
      limit,
      totalPages: Math.ceil(totalQuizzes / limit),
      totalQuizzes,
      quizzes: enrichedQuizzes
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal Server Error", success: false });
  }
});
campusSuperAdminRouter.get('/test/get/section/:sectionId', async (req, res) => {
  try {
    const { sectionId } = req.params;
    const page = parseInt(req.query.page) || 1;   // default page 1
    const limit = parseInt(req.query.limit) || 10; // default 10 items per page
    const sortBy = req.query.sortBy || 'createdAt'; // default sort field
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1; // asc or desc

    // Count total tests for this section
    const totalTests = await Test.countDocuments({ sectionId });

    // Fetch tests with pagination
    const tests = await Test.find({ sectionId })
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()
      .populate({
        path: "creator",
        select: "name"
      })
    console.log(tests)
    // Cost per attempt (can be dynamic per org/user later)
    const costPerAttempt = 10; // example ₹10 per attempt

    // Collect testIds
    const testIds = tests.map(t => t._id);

    // Fetch submission counts in one go
    const submissionCounts = await TestResponse.aggregate([
      { $match: { testId: { $in: testIds } } },
      { $group: { _id: '$testId', count: { $sum: 1 } } }
    ]);

    const submissionCountMap = submissionCounts.reduce((acc, cur) => {
      acc[cur._id.toString()] = cur.count;
      return acc;
    }, {});

    // Attach costPerAttempt + noOfSubmissions
    const enrichedTests = tests.map(t => ({
      ...t,
      costPerAttempt,
      noOfSubmissions: submissionCountMap[t._id.toString()] || 0
    }));

    res.json({
      success: true,
      page,
      limit,
      totalPages: Math.ceil(totalTests / limit),
      totalTests,
      tests: enrichedTests
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal Server Error", success: false });
  }
});

campusSuperAdminRouter.post("/delete/section/:id", async (req, res) => {
  try {
    const { id } = req.params;



    await SectionMember.deleteMany({ section: id });
    await SectionOwner.deleteMany({ section: id });
    await Section.deleteOne({ _id: id });
    return res.status(200).send({ message: "Deleted Successfully" })

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
campusSuperAdminRouter.post("/section/add", addUsersToSections);

campusSuperAdminRouter.delete('/sections/quiz/delete/:quizId', deleteSection);
/// campus admin router

campusSuperAdminRouter.get('/quiz/sections/download/:slug/:sectionId', exportQuizSubmissionsForSection);
campusSuperAdminRouter.get('/exam/sections/download/:slug/:sectionId', exportTestSubmissionsForSection);


// problem add routes
campusSuperAdminRouter.get('/problems/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const problem = await Problem.findById(id);

    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    res.status(200).json(problem);
  } catch (error) {
    console.error("Error fetching problem:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
})
campusSuperAdminRouter.post('/create-problem', async (req, res) => {
  try {
    const problem = await Problem.create({});
    return res.json({ problemId: problem._id }).status(200);
  } catch (e) {
    console.log(e)
    return res.json({ message: "Internal Server Error" }).status(500)
  }
});
campusSuperAdminRouter.post('/problem/add/basicinfo', async (req, res) => {
  try {
    const { problemId, title, description } = req.body;
    const problem = await Problem.findById(problemId);
    problem.title = title;
    problem.description = description;
    problem.save();
    return res.json({ message: "Porblem Saved successfully", success: true })
  } catch (e) {
    return res.json({ message: "Internal Server Error", success: false }).status(500);
  }
});
campusSuperAdminRouter.post('/problem/add/languages', async (req, res) => {
  try {
    const { language, code, problemId } = req.body;

    if (!language || !problemId)
      return res.status(400).json({ message: "Language and problemId are required" });

    const problem = await Problem.findById(problemId);
    if (!problem)
      return res.status(404).json({ message: "Problem not found" });

    // Default templates for new languages
    const defaultTemplates = {
      c: "#include <stdio.h>\nint main() { return 0; }",
      cpp: "#include <bits/stdc++.h>\nusing namespace std;\nint main() { return 0; }",
      java: "public class Solution {\n  public static void main(String[] args) {\n    \n  }\n}",
      python: "def solve():\n    pass\n\nif __name__ == '__main__':\n    solve()",
    };

    if (!problem.functionSignature) problem.functionSignature = [];

    // find existing language
    const langIndex = problem.functionSignature.findIndex(
      (l) => l.language === language
    );

    if (langIndex !== -1) {
      // 🔁 Update existing language code
      problem.functionSignature[langIndex].signature = code || problem.functionSignature[langIndex].signature;
      await problem.save();
      return res.json({
        message: "Language code updated successfully",
        language,
        code: problem.functionSignature[langIndex].signature,
      });
    } else {
      // ➕ Create new language entry
      const starterCode = code || defaultTemplates[language] || "// empty template";
      problem.functionSignature.push({ language, signature: starterCode });
      await problem.save();
      return res.json({
        message: "Language added successfully",
        language,
        code: starterCode,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});
campusSuperAdminRouter.post('/problem/add/meta', async (req, res) => {
  try {
    const {
      problemId,
      constraints,
      timeLimit,
      memoryLimit,
      points,
      hints,
      isScorable,
      isPublic,
      visibility,
      difficulty,
      languagesSupported,
    } = req.body;

    if (!problemId) {
      return res.status(400).json({ message: "Problem ID is required" });
    }

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    // 🔹 Format and apply basic metadata
    const formattedConstraints = Array.isArray(constraints)
      ? constraints.filter((c) => c.trim() !== "")
      : [];
    const formattedHints = Array.isArray(hints)
      ? hints.filter((h) => h.trim() !== "")
      : typeof hints === "string"
        ? hints
          .split(",")
          .map((h) => h.trim())
          .filter((h) => h)
        : [];

    if (formattedConstraints.length > 0) problem.constraints = formattedConstraints;
    if (formattedHints.length > 0) problem.hints = formattedHints;

    problem.timeLimit = Number(timeLimit) || problem.timeLimit;
    problem.memoryLimit = Number(memoryLimit) || problem.memoryLimit;
    problem.isScorable = typeof isScorable === "boolean" ? isScorable : problem.isScorable;
    problem.visibility = visibility || problem.visibility;

    problem.difficulty = difficulty || problem.difficulty;
    if (Array.isArray(languagesSupported) && languagesSupported.length > 0) {
      problem.languagesSupported = languagesSupported;
    }

    // 🔹 Only allow making public if all essential fields are filled
    if (isPublic === true) {
      const missing = [];

      if (!problem.title?.trim()) missing.push("title");
      if (!problem.description?.trim()) missing.push("description");
      // if (!problem.examples?.length) missing.push("at least 1 example");
      if ((problem.testCases?.length || 0) < 3) missing.push("at least 3 test cases");
      if ((problem.functionSignature?.length || 0) < 1)
        missing.push("at least 2 function signatures");
      if (!(problem.languagesSupported?.length > 0)) missing.push("languagesSupported");

      if (missing.length > 0) {
        return res.status(400).json({
          message: `❌ Cannot make problem public — missing or incomplete fields: ${missing.join(
            ", "
          )}`,
        });
      }

      problem.isPublic = true;
    } else if (isPublic === false) {
      problem.isPublic = false;
    }

    await problem.save();

    res.status(200).json({
      message: "✅ Problem metadata saved successfully",
      problem,
    });
  } catch (err) {
    console.error("❌ Error saving metadata:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

campusSuperAdminRouter.post('/problem/add/testcases', async (req, res) => {
  try {
    const { problemId, testCases } = req.body;

    if (!Array.isArray(testCases)) {
      return res.status(400).json({ message: "testCases must be an array" });
    }

    const problem = await Problem.findByIdAndUpdate(
      problemId,
      { $set: { testCases } },
      { new: true }
    );

    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    res.status(200).json({
      message: "Test cases updated successfully",
      problem,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
campusSuperAdminRouter.get('/problems/get/getall', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;     // default page = 1
    const limit = parseInt(req.query.limit) || 10;  // default limit = 10
    const skip = (page - 1) * limit;

    // Get total document count
    const total = await Problem.countDocuments({ title: { $regex: req.query?.search || "", $options: 'i' }, });

    // Fetch problems for current page
    const problems = await Problem.find({
      title: { $regex: req.query?.search || "", $options: 'i' },
    }, 'title isAvailable isPublic visibility createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const mappedProblems = problems.map(problem => ({
      _id: problem._id,
      title: problem.title,
      isAvailable: problem.isAvailable,
      isPublic: problem.isPublic,
      visibility: problem.visibility || 'private',
      createdAt: problem.createdAt,
      status: problem.isAvailable ? 'Published' : 'Draft',
    }));

    res.json({
      problems: mappedProblems,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching problems:", error);
    res.status(500).json({ message: 'Server error' });
  }
});
campusSuperAdminRouter.post("/exam/update", async (req, res) => {
  try {
    const { examId, name, isAvailable, isProtected, passcode } = req.body;

    if (!examId) {
      return res.status(400).json({ message: "Exam ID is required" });
    }

    const exam = await Exam.findById(examId)
      .populate({
        path: "sections.questionPool",
        populate: { path: "questions" },
      })
      .populate("sections.problemPool");

    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }
    if (isProtected && passcode == "") return res.status(400).json({ message: "Please provide passcode" })
    // ✅ Update name if provided
    if (name?.trim()) {
      exam.name = name.trim();
    }

    if (isAvailable === true) {
      const invalidSections = [];

      for (const section of exam.sections) {
        const { title, type, maxQuestion, questionPool, problemPool } = section;

        if (type === "coding") {
          const available = problemPool?.length || 0;
          if (!maxQuestion || maxQuestion > available) {
            invalidSections.push({
              section: title,
              reason: `Coding section has only ${available} problems but requires ${maxQuestion}.`,
            });
          }
        } else if (type === "quiz") {
          const available = questionPool?.questions?.length || 0;
          if (!maxQuestion || maxQuestion > available) {
            invalidSections.push({
              section: title,
              reason: `Quiz section has only ${available} questions but requires ${maxQuestion}.`,
            });
          }
        } else if (type === "mixed") {
          const availableCoding = problemPool?.length || 0;
          const availableQuiz = questionPool?.questions?.length || 0;
          if (
            (!maxQuestion || maxQuestion > availableCoding + availableQuiz)
          ) {
            invalidSections.push({
              section: title,
              reason: `Mixed section has only ${availableCoding + availableQuiz
                } total items but requires ${maxQuestion}.`,
            });
          }
        }
      }

      if (invalidSections.length > 0) {
        return res.status(400).json({
          message: "❌ Cannot publish exam — invalid section data.",
          details: invalidSections,
        });
      }

      exam.isAvailable = true;
    } else if (isAvailable === false) {
      exam.isAvailable = false;
    }

    if (isProtected === true) {
      exam.passcode = passcode;
      exam.isProtected = true;
    } else {
      exam.passcode = "";
      exam.isProtected = false;
    }

    await exam.save();

    return res.status(200).json({
      message: "✅ Exam metadata updated successfully",
      exam,
    });
  } catch (err) {
    console.error("❌ Error updating exam meta:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
campusSuperAdminRouter.delete("/questionbank/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const isUsed = await Exam.exists({
      "sections.questionPool": id
    });
    if (isUsed) {
      return res.status(400).json({
        success: false,
        message: "This QuestionBank is used in an exam. It cannot be deleted."
      });
    }
    const deleted = await QuestionBank.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "QuestionBank not found."
      });
    }
    return res.status(200).json({
      success: true,
      message: "QuestionBank deleted successfully."
    });

  } catch (e) {
    console.error(e.response);
    res.status(500).json({
      success: false,
      message: e.response?.data?.message || "Internal Server Error"
    });
  }
});
campusSuperAdminRouter.post("/notification/create", async (req, res) => {
  try {
    const { userId, groupId, sectionId, text } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, message: "Text is required" });
    }

    // Validate sectionId must be an array
    if (!Array.isArray(sectionId)) {
      return res.status(400).json({
        success: false,
        message: "sectionId must be an array",
      });
    }

    // Validate each section ID format
    for (const id of sectionId) {
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: `Invalid section ID format: ${id}`,
        });
      }
      const notification = await NotificationModel.create({
        userId,
        groupId,
        sectionId: id, // array
        text,
      });
      notification.save();

    }

    // Create ONE notification with multiple section IDs


    return res.status(201).json({
      success: true,
      message: " added successfully",
      // notification,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});
campusSuperAdminRouter.delete('/submission/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await ExamSolution.findOneAndDelete({ _id: id });
    return res.status(200).json({ message: "Exam Solution Deleted Successfully" });
  } catch (e) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
})
campusSuperAdminRouter.post("/section/:id/user-details/add", async (req, res) => {
  try {
    const { id } = req.params;
    const { field } = req.body;

    if (!field || typeof field !== "object") {
      return res.status(400).json({ success: false, message: "Field required" });
    }

    const exam = await Exam.findById(id);
    if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });

    exam.userDetails.push(field);
    await exam.save();

    res.json({
      success: true,
      message: "Field added",
      data: exam.userDetails
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
campusSuperAdminRouter.put("/section/:id/user-details/:index", async (req, res) => {
  try {
    const { id, index } = req.params;
    const { field } = req.body;

    const exam = await Exam.findById(id);
    if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });

    if (!exam.userDetails[index]) {
      return res.status(400).json({ success: false, message: "Field not found" });
    }

    exam.userDetails[index] = field;
    await exam.save();

    res.json({
      success: true,
      message: "Field updated",
      data: exam.userDetails
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});
campusSuperAdminRouter.delete("/section/:id/user-details/:index", async (req, res) => {
  try {
    const { id, index } = req.params;

    const exam = await Exam.findById(id);
    if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });

    exam.userDetails.splice(index, 1);
    await exam.save();

    res.json({
      success: true,
      message: "Field deleted",
      data: exam.userDetails
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

campusSuperAdminRouter.delete('/problem/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid problem ID" });
    }

    const updated = await Problem.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Problem not found" });
    }

    return res.json({ message: "Deleted successfully" });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Internal server error" });
  }
});



campusSuperAdminRouter.put('/students/:userId/password', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { password } = req.body;
    if (password?.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    } else {
      const user = await Users.findById(userId);
      user.password = password;
      await user.save();
    }

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Internal server error" });
  }


})



campusSuperAdminRouter.get('/progress/:id', async (req, res) => {
  try {
    const { id: testId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const progress = await ExamSolution.findById(testId).select("-testSnapshot")
    res.status(200).json({
      success: true,
      data: progress,
      message: 'Test progress fetched successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
})

campusSuperAdminRouter.put('/submission/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { ufmAttempts, currSection, hasAgreed, isSubmitted } = req.body;
    const updated = await ExamSolution.findByIdAndUpdate(id, { ufmAttempts, currSection, hasAgreed, isSubmitted }, { new: true })
    if (!updated) {
      return res.status(404).json({ message: "Submission not found" });
    }
    updated.save();
    return res.status(200).json({ message: "Status updated successfully" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Internal server error" });
  }
})
export default campusSuperAdminRouter;