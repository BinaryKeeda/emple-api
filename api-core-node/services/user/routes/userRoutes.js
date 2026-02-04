import { Router } from "express";
import { getProblems, getProblemsBySlug, getSections, getUserGroup, getUserInvite, getUserQuiz, getUserQuizSolutionList, getUserTests, getUserTestSoltutionList, respondToInvite, userFeedback } from "../controllers/getData.js";
import { isUser } from "../../../middlewares/isAuthenticated.js";
import transporter from "../../../../config/transporter.js";
import Users from "../../../../models/core/User.js";
import axios from 'axios'
import { CODE_EXECUTION_API } from "../../core/routes/codeExecute.js";
const userDataRouter = Router();

userDataRouter.post("/executecode", async (req, res) => {
  try {
    const response = await axios.post(
      CODE_EXECUTION_API + "/submissions?base64_encoded=true&wait=true",  // your Judge0 server
      req.body,
      { headers: { "Content-Type": "application/json" } }
    );
    // const response = {data:""}
    
    res.json(response.data);
  } catch (err) {
    console.log(err)
    res.status(500).json({
      error: true,
      message: err?.response?.data || err.message,
    });
  }
});

const pollSubmissions = async (tokens, interval = 1000) => {
  const results = [];
  for (const token of tokens) {
    let done = false;
    let submissionResult = null;

    while (!done) {
      try {
        const res = await axios.get(`${CODE_EXECUTION_API}/submissions/${token}?base64_encoded=false`);
        submissionResult = res.data;

        // Status codes >= 3 indicate completion
        if (submissionResult.status && submissionResult.status.id >= 3) {
          done = true;
        } else {
          await new Promise((r) => setTimeout(r, interval));
        }
      } catch (err) {
        console.error("Polling error:", err.message);
        done = true;
      }
    }

    results.push(submissionResult);
  }

  return results;
};

userDataRouter.post("/executecode/batch", async (req, res) => {
  try {
    // req.body must be: { submissions: [ {language_id, source_code, stdin}, ... ] }
    const { wait = false } = req.body; // optional flag

    // Send batch submissions
    const response = await axios.post(
      `${CODE_EXECUTION_API}/submissions/batch?base64_encoded=false&wait=${wait}`,
      req.body,
      { headers: { "Content-Type": "application/json" } }
    );

    if (wait) {
      // If wait=true, Judge0 already returns results
      res.json(response.data);
    } else {
      // If wait=false, we need to poll using tokens
      const tokens = response.data.map((submission) => submission.token);
      const results = await pollSubmissions(tokens);
      res.json(results);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: true,
      message: err?.response?.data || err.message,
    });
  }
});

userDataRouter.get('/user/problems' , getProblems);
userDataRouter.get('/user/problems/:slug' , getProblemsBySlug);
userDataRouter.get('/user/solutions/test' , isUser, getUserTestSoltutionList);
userDataRouter.get('/user/solutions/quiz' , isUser,getUserQuizSolutionList);
userDataRouter.post('/user/contact' , async  (req,res) => {
    try {
        const { name, email, message } = req.body;
        await transporter.sendMail(
        {
            from: '"BinaryKeeda" <no-reply@binarykeeda.com>',  // sender
            to: "contact@binarykeeda.com",                   // receiver(s)
            subject: "Test Email ",
            html: `${name} , ${email} , ${message}`, // optional HTML
        },
        (err, info) => {
            if (err) {
            console.error("Error sending mail:", err);
            } else {
            console.log("Email sent:", info.response);
            }
        }
        );
        res.json({})
    }catch(e) {
        res.json({message : "Error " , status :false});
    }
});
userDataRouter.post("/user/respond", async (req, res) => {
  try {
    let { userId, groupId, sectionIds, action , role } = req.body; 
    // action = "accept" | "reject"

    if (!userId || !groupId || !Array.isArray(sectionIds) || !action) {
      return res.status(400).json({
        message: "userId, groupId, sectionIds, and action are required",
      });
    }

    const user = await Users.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if(role == "campus-admin") {
        user.role = role;
        user.groupOwner = groupId;
    }
    // ✅ Ensure groups is a Map
    if (!(user.groups instanceof Map)) {
      user.groups = new Map(Object.entries(user.groups || {}));
    }

    // 🔍 Find the pending invite (handle populated groupId)
    const inviteIndex = user.pendingInvites.findIndex(inv => {
      const invGroupId = inv.groupId._id ? inv.groupId._id.toString() : inv.groupId.toString();
      const reqGroupId = groupId._id ? groupId._id.toString() : groupId.toString();
      return invGroupId === reqGroupId;
    });

    if (inviteIndex === -1) {
      return res.status(404).json({ message: "Invite not found" });
    }

    if (action === "accept") {
      // ✅ Add sections to the Map for this group
      const groupIdStr = groupId._id ? groupId._id.toString() : groupId.toString();
      const currentSections = user.groups.get(groupIdStr) || [];

      sectionIds.forEach(section => {
        const sectionIdStr = section._id ? section._id.toString() : section.toString();
        if (!currentSections.includes(sectionIdStr)) {
          currentSections.push(sectionIdStr);
        }
      });

      user.groups.set(groupIdStr, currentSections);
    }

    // ✅ Remove invite whether accepted or rejected
    user.pendingInvites.splice(inviteIndex, 1);

    await user.save();

    res.json({
      message: `Invite ${action}ed successfully`,
      groups: Object.fromEntries(user.groups), // convert Map to object for JSON
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});
userDataRouter.get("/user/quiz" , getUserQuiz);
userDataRouter.get("/user/test" , getUserTests);
userDataRouter.post('/user/respond' );;
// new `campus func apis's
userDataRouter.get('/user/groups/:id' ,isUser, getUserGroup);
userDataRouter.get('/user/invites/:id', isUser, getUserInvite);
userDataRouter.post('/invites/respond' , isUser , respondToInvite);
userDataRouter.get('/user/sections/:id/:groupId' , isUser, getSections )
export default userDataRouter;