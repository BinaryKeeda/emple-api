import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as LocalStrategy } from 'passport-local';
import User from "../models/core/User.js";
import { configDotenv } from 'dotenv';
import Users from "../models/core/User.js";
import { Strategy as MicrosoftStrategy } from "passport-microsoft";
import { GroupOwner, SectionOwner } from "../models/shared/owner.js";
import bcrypt from "bcryptjs";
configDotenv();
passport.use(
  new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
    try {
      const user = await User.findOne({ email: email.trim() });
      if (!user) {
        user = await User.create({ email: email.trim() });
      }

      if (!user) return done(null, false, { message: "User not found" });
      if (user.password == "") {
        return done(null, false, { message: "This password is not yet set up for this account. Please sign in with Google." });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return done(null, false, { message: "Incorrect password" });
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URL,
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    },
    async (accessToken, refreshToken, profile, done) => {
      console.log(process.env.CALLBACK_URL);
      console.log(process.env.GOOGLE_CLIENT_SECRET);
      try {
        let user = await User.findOne({ email: profile.emails[0].value });
        console.log(user);
        if (!user) {
          user = await User.create({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            avatar: profile.photos[0].value,
            isVerified: true,
          });
        }
        if (!user.googleId) {
          user.googleId = profile.id;
          user.name = profile.displayName;
          user.email = profile.emails[0].value;
          user.avatar = profile.photos[0].value;
          user.isVerified = true;
          await user.save();
        }
        // User exists, proceed to log them in (Sign-In)
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);
passport.use(
  new MicrosoftStrategy(
    {
      clientID: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      callbackURL: process.env.MICROSOFT_CALLBACK_URL,
      tenant: "common",
      scope: [
        "openid",
        "profile",
        "email",
        "User.Read",
      ]


    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(null, false, { message: "No email found in Microsoft profile" });
        }

        let user = await User.findOne({ email });

        if (!user) {
          user = await User.create({
            microsoftId: profile.id,
            name: profile.displayName,
            email,
            avatar: profile.photos?.[0]?.value || "",
            isVerified: true,
          });
        }

        // Link Microsoft account if user exists
        if (!user.microsoftId) {
          user.microsoftId = profile.id;
          user.name = profile.displayName;
          user.avatar = profile.photos?.[0]?.value || "";
          user.isVerified = true;
          await user.save();
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);


// Serialize user
passport.serializeUser((user, done) => done(null, user.id));



passport.deserializeUser(async (id, done) => {
  try {
    const user = await Users.findById(id)
      .select('-password');
    if (!user) return done(null, null);
    if (user.role == "admin" || user.role == "user") return done(null, { _id: user._id, user: user });
    else if (user.role == "campus-superadmin") {
      return done(null, { _id: user?._id, user });
    } else if (user.role == "campus-admin") {
      return done(null, { _id: user?._id, user })
    }
    return done(null, user);
  } catch (error) {
    done(error, null);
  }
});

