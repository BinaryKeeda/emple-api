import { Router } from "express";
import { fetchUniversity } from "../controllers/profileControllers.js";
import Users from "../../../../models/core/User.js";
import { descope } from "../../../../config/descope.js";
const profileRouter = Router();

profileRouter.get("/university/:name/", fetchUniversity);
profileRouter.put("/profile/complete", async (req, res) => {
  try {
    const {
      id,
      name,
      email,
      avatar,
      yearOfGraduation,
      phone,
      specialisation,
      password,
      program,
      semester,
      university,
    } = req.body;
    const user = req.user;
    if (user._id != id) {
      return res
        .status(401)
        .json({ message: "You are not authorized to complete this profile" });
    }

    const newUser = await Users.findByIdAndUpdate(
      id,
      {
        $set: {
          name,
          email,
          avatar,
          yearOfGraduation,
          phone,
          specialisation,
          program,
          semester,
          university,
        },
      },
      { new: true },
    );
    // if(newUser.googleId) {
    newUser.password = password;
    // }
    // const userRank = new Rank({
    //   userId: newUser._id,
    // })
    // await userRank.save()
    // newUser.rankId = userRank._id;
    newUser.profileCompleted = true;
    await newUser.save();
    return res.json({ user: newUser });
  } catch (error) {
    console.log(error);
    return res.json({ e: error });
  }
});
profileRouter.put("/user/signup", async (req, res) => {
  try {
    const { id, name, university } = req.body;
    const user = await descope.management.user.loadByUserId(id);
    const email = user.data.email;

    const newUser = Users.create({
      name: name,
      email: email,
      university: university,
      googleId: id,
    });
    (await newUser).save();
    return res.json({ success: true, message: "" });
  } catch (e) {
    console.log(e);
    return res.json({ success: false, message: "" });
  }
});

export default profileRouter;
