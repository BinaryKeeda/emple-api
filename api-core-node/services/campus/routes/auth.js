import { Router } from "express";
import Users from "../../../../models/core/User.js";
import redis from "../../../../config/redisConn.js";
import bcrypt from "bcryptjs";
import CampusTest from "../../../../models/campus/CampusTest.js";
import axios from "axios";
import { configDotenv } from "dotenv";

configDotenv();
const campusAuthRouter = Router();
redis.set('blocked_user', JSON.stringify(new Set()), 'EX', 60 * 60 * 24);
// Login route
campusAuthRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password, captcha } = req.body;

    if (!captcha) {
      return res.status(400).json({ message: "Captcha is required" });
    }

    const params = new URLSearchParams();
    params.append("secret", process.env.RECAPTCHA_SECRET);
    params.append("response", captcha);

    const captchaResponse = await axios.post(
      "https://www.google.com/recaptcha/api/siteverify",
      params
    );

    if (!captchaResponse.data.success) {
      return res.status(400).json({ message: "Captcha verification failed" });
    }

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);  
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.role === "campus-admin") {
      req.login(user, (err) => {
        if (err) return next(err);
        return res.json({
          message: "Logged in successfully as campus-admin",
          user, // full user object
        });
      });
    } else if (user.role === "user") {
      const cacheKey = `campus:tests:${user.attemptId}`;
      let userTest;

      const cachedTest = await redis.get(cacheKey);
      if (cachedTest) {
        userTest = JSON.parse(cachedTest);
      } else {
        userTest = await CampusTest.findOne({ groupId: user.attemptId , isAvailable:true}).sort({
          createdAt: -1,
        });

        if (!userTest) {
          return res.status(404).json({ message: "No test available for your campus" });
        }
        if(!userTest.isAvailable) {
          return res.status(404).json({ message: "No test available for your campus"});
        }
        await redis.set(cacheKey, JSON.stringify({ _id: userTest._id.toString() }), 'EX', 300);
      }

      req.login(user, (err) => {
        if (err) return next(err);
        return res.status(200).json({
          message: "Logged in successfully",
          user,
          testId: userTest._id?.toString(),
        });
      });
    } else {
      return res.status(403).json({ message: "Unauthorized role" });
    }
  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({ message: "Server error during login" });
  }
});

// Authenticated user info route
campusAuthRouter.get("/user", async (req, res) => {
  const overallStart = Date.now();

  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = req.user;

  if (user.role === "user") {
    // console.log("User came")
    const cacheKey = `campus:tests:${user.attemptId}`;
    // console.log("Key found")
    try {
      const redisStart = Date.now();
      let cachedTest = await redis.get(cacheKey);

      let testId;

      if (cachedTest) {
        const parsed = JSON.parse(cachedTest);
        testId = parsed._id;
      } else {
        const dbStart = Date.now();
        const userTest = await CampusTest.findOne({ groupId: user.attemptId , isAvailable:true })
          .select("_id")
          .sort({ createdAt: -1 });

        if (!userTest) {
          return res.status(404).json({ message: "No test available for your campus" });
        }

        testId = userTest._id.toString();
        await redis.set(cacheKey, JSON.stringify({ _id: testId }), "EX", 300);
      }

      return res.status(200).json({  user ,testId });

    } catch (err) {
      console.error("Error in /user:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }

  if (user.role === "campus-admin") {
    return res.json({
      message: "Authenticated as campus-admin",
      user,
    });
  }

  return res.status(403).json({ message: "Unauthorized role" });
});

export default campusAuthRouter;
