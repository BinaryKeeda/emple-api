// controllers/groupController.js

import passport from "passport";
import Group from "../../../../models/core/Group.js";
import Quiz from "../../../../models/core/Quiz.js";
import Section from "../../../../models/core/Section.js";
import Solution from "../../../../models/core/Solution.js";
import Users from "../../../../models/core/User.js";
import { GroupOwner, SectionOwner } from "../../../../models/shared/owner.js";
import { TestResponse } from "../../../../models/test/TestResponse.js";
import { Test } from "../../../../models/test/TestSchema.js";
import axios from 'axios'
import { configDotenv } from "dotenv";
import mongoose from "mongoose";
import generatePassword from "../../../utils/getRandomPassword.js";
configDotenv();
export const getAllGroups = async (req, res) => {
  try {
    const withOwner = req.query.withOwner === "true";

    const { search } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filters = {};
    if (search) {
      filters[withOwner ? "title" : "groupName"] = { $regex: search, $options: "i" };
    }

    const model = withOwner ? GroupOwner : Group;

    const query = model.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    if (withOwner) {
      query.populate([
        { path: "userId", select: "name email" },
        { path: "group", select: "groupName" }
      ]);
    }

    // ✅ Execute queries in parallel
    const [groups, total] = await Promise.all([
      query.exec(),
      model.countDocuments(filters)
    ]);

    // ✅ Return paginated response
    res.status(200).json({
      total,
      page,
      totalPages: Math.ceil(total / limit),
      groups,
    });
  } catch (error) {
    console.error("Error fetching groups:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


export const assignGroupOwner = async (req, res) => {
  try {
    const { email, groupName, name } = req.body;

    if (!email || !groupName) {
      return res.status(400).json({ message: "Email and groupName are required" });
    }
    const password = generatePassword();
    const role = "campus-superadmin"
    let user = await Users.findOne({ email });
    if (!user) {
      user = await Users.create({
        name: name || email.split("@")[0],
        email,role:"campus-superadmin"
      });
    }
    user.password = password;
    user.role = role;
    await user.save()
    let group = await Group.findOne({ groupName });
    if (!group) {
      group = await Group.create({ groupName , owner: user._id});
    }
    if (user.role !== "campus-superadmin") {
      user.role = "campus-superadmin";
      await user.save();
    }

    const newOwnership = await GroupOwner.create({
      userId: user._id,
      group: group._id,
    });

    group.owner = user._id;
    await group.save();

    axios.post(`${process.env.EVALUATOR_API}/api/v4/mail/campus`, {
      email,role,password,name
    })

    return res.status(200).json({
      message: "Group and ownership assigned successfully",
      group,
      user,
      ownership: newOwnership,
    });
  } catch (err) {
    console.error("Error assigning group owner:", err.message);
    return res.status(500).json({
      message: "❌ Failed to assign group owner",
      error: err.message,
    });
  }
};

export const deleteGroupAdmin = async (req, res) => {
  try {
    const { id } = req.params; // groupId
    const groupId = new mongoose.Types.ObjectId(id);
    
    // 1. Find sections of this group
    const sections = await Section.find({ groupId }).select("_id");
    const sectionIds = sections.map((s) => s._id);
    console.log("🟢 Sections found:", sectionIds);

    // 2. Find quizzes in these sections
    const quizzes = await Quiz.find({ sectionId: { $in: sectionIds } }).select("_id");
    const quizIds = quizzes.map((q) => q._id);
    console.log("🟢 Quizzes found:", quizIds);

    // 3. Delete quiz solutions
    if (quizIds.length > 0) {
      await Solution.deleteMany({ quizId: { $in: quizIds } });
      console.log("✅ Solutions deleted");
    }

    // 4. Delete quizzes
    if (quizIds.length > 0) {
      await Quiz.deleteMany({ sectionId: { $in: sectionIds } });
      console.log("✅ Quizzes deleted");
    }

    // 5. Delete sections
    if (sectionIds.length > 0) {
      await Section.deleteMany({ groupId });
      console.log("✅ Sections deleted");
    }

    // 6. Find tests for this group
    const tests = await Test.find({ groupId }).select("_id");
    const testIds = tests.map((t) => t._id);
    console.log("🟢 Tests found:", testIds);

    // 7. Delete test responses + tests
    if (testIds.length > 0) {
      await TestResponse.deleteMany({ testId: { $in: testIds } });
      await Test.deleteMany({ groupId });
      console.log("✅ Tests + TestResponses deleted");
    }

    // 8. Delete ownership records
    const group = await GroupOwner.findOne({group:groupId});
    console.log(group);
    
    const user = await Users.findById(group.userId);
    console.log(user)
    user.role = "user";
    user.save()
    await GroupOwner.deleteMany({ group: groupId });
    console.log("✅ GroupOwner deleted");

    if (sectionIds.length > 0) {
      await SectionOwner.deleteMany({ section: { $in: sectionIds } }); // fixed field name
      console.log("✅ SectionOwner deleted");
    }

    // 9. Finally delete the group
    await Group.findByIdAndDelete(groupId);
    console.log("✅ Group deleted");

    res.status(200).json({
      message: "✅ Group and related data deleted successfully"
    });
  } catch (e) {
    console.error("Error deleting group:", e);
    res.status(500).json({
      message: "Failed to delete group",
      error: e.message
    });
  }
};
