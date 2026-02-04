import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import { configDotenv } from "dotenv";
import axios from "axios";
import { verifyOtp } from "../controllers/auth.js";
import Users from "../../../../models/core/User.js";
import { USER_JWT_SECRET } from "../../../../config/config.js";
import bcrypt from "bcryptjs";
import { descope } from "../../../../config/descope.js";
configDotenv();
const authRouter = express.Router();

async function verifyRecaptchaToken(token, expectedAction) {
  try {
    const params = new URLSearchParams();
    console.log(process.env.RECAPTCHA_SECRET);
    params.append("secret", process.env.RECAPTCHA_SECRET);
    params.append("response", token);

    const { data } = await axios.post(
      "https://www.google.com/recaptcha/api/siteverify",
      params.toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
    );

    if (!data.success) throw new Error("Recaptcha verification failed");
    if (typeof data.score === "number" && data.score < 0.5)
      throw new Error("Low recaptcha score");
    if (expectedAction && data.action !== expectedAction)
      throw new Error(`Recaptcha action mismatch: ${data.action}`);

    return data;
  } catch (err) {
    throw err;
  }
}

// Start Microsoft login
authRouter.get(
  "/microsoft",
  passport.authenticate("microsoft", { prompt: "select_account" }),
);

// Callback
authRouter.get(
  "/microsoft/callback",
  passport.authenticate("microsoft", {
    successRedirect: `${process.env.REDIRECT_URL}`,
    failureRedirect: `${process.env.REDIRECT_URL}/login`,
  }),
);

authRouter.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);
authRouter.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.REDIRECT_URL}/login`,
  }),
  (req, res) => {
    const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.redirect(`${process.env.REDIRECT_URL}/${req.user.role}`);
  },
);
authRouter.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: "Logout failed" });
    res.json({ msg: "Logged Out" });
  });
});

authRouter.get("/user", async (req, res) => {
  try {
    // 1️⃣ Passport (session / cookie)

    if (req.isAuthenticated?.() && req.user) {
      return res.json(req.user);
    }

    // 2️⃣ Bearer token (Descope)
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;
    if (token) {
      try {
        const session = await descope.validateSession(token);
        const dUserId = session.token.sub;
        let user = await Users.findOne({ descopeId: dUserId });
        if (user) {
          session.user = user;
        } else {
          const descopeUser = await descope.management.user.load(dUserId);
          const email = descopeUser.data.email;
          user = await Users.findOneAndUpdate(
            { email },
            { descopeId: dUserId },
            { new: true },
          );
          session.user = user;
          req.user = user;
        }
        return res.json({
          provider: "descope",
          user: session.user,
        });
      } catch (err) {
        console.error("Descope session validation error:", err);
        return res.status(401).json({ message: "Invalid or expired token" });
      }
    }

    // 3️⃣ No auth
    return res.status(401).json({ message: "Not authenticated" });
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

authRouter.post("/login", async (req, res, next) => {
  const { captchaToken, email, password } = req.body;
  if (!captchaToken) {
    return res.status(400).json({ message: "Captcha is required" });
  }

  try {
    const captchaRes = await verifyRecaptchaToken(captchaToken, "LOGIN");
    if (
      !captchaRes.success ||
      captchaRes.action !== "LOGIN" ||
      captchaRes.score < 0.5
    ) {
      return res
        .status(403)
        .json({ message: "Suspicious activity detected. Try again." });
    }

    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user)
        return res
          .status(400)
          .json({ message: info.message || "Login failed" });

      req.login(user, (err) => {
        if (err) return next(err);

        // return res.redirect(`${process.env.REDIRECT_URL}`);
        return res.json({ message: "Login successful", user });
      });
    })(req, res, next);
  } catch (error) {
    console.error("Captcha verification error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

authRouter.post("/verify", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Authorization token missing or malformed" });
    }

    const token = authHeader.split(" ")[1];
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const decoded = jwt.verify(token, USER_JWT_SECRET);
    const user = await Users.findOne({ email: decoded.email });
    if (!user || user.verificationToken != token) {
      return res.status(401).json({ message: "Token invalid or already used" });
    }

    user.password = password;
    user.verificationToken = null; // clear the token
    user.isVerified = true; // optional flag
    await user.save();

    return res
      .status(200)
      .json({ message: "Your password has been set successfully", user });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Token expired. Please request a new one." });
    }
    console.log(err);
    res.status(400).json({ message: "Invalid or expired token" });
  }
});

authRouter.post("/verify/otp", verifyOtp);
authRouter.post("/reset/password", async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user._id; // from JWT middleware
    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Old and new passwords are required." });
    }

    const user = await Users.findById(userId).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect." });
    }

    // Prevent same password
    if (oldPassword === newPassword) {
      return res
        .status(400)
        .json({ message: "New password must be different." });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ message: "Server error." });
  }
});
export default authRouter;
