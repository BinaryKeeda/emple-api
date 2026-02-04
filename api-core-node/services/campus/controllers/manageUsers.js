import axios from "axios";
import mongoose from "mongoose";
import Users from "../../../../models/core/User.js";
import { GroupInvites } from "../../../../models/shared/Invite.js";
import { GroupMember, SectionMember } from "../../../../models/shared/memeber.js";
import { SectionOwner } from "../../../../models/shared/owner.js";
function generateRandomPassword(length = 10) {
  // const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
  // let password = "";
  // for (let i = 0; i < length; i++) {
  //   password += chars.charAt(Math.floor(Math.random() * chars.length));
  // }
  // return password;
  return "Student@1123"
}

export const addUsersToSections = async (req, res) => {
    try {
        const invites = req.body.invites;
        console.log(invites);
        if (!Array.isArray(invites) || invites.length === 0) {
            return res.status(400).json({ message: "No invites provided" });
        }

        const validRoles = ["user", "campus-admin", "campus-superadmin"];
        const results = [];

        for (const invite of invites) {
            // Validate ObjectIds
            // if (!mongoose.Types.ObjectId.isValid(invite.groupId)) throw new Error("IPnvalid groupId");
            if (!mongoose.Types.ObjectId.isValid(invite.sectionId)) throw new Error("Invalid sectionId");
            if (!mongoose.Types.ObjectId.isValid(invite.invitedBy)) throw new Error("Invalid invitedBy");

            if (!validRoles.includes(invite.role)) invite.role = invite?.role?.toLowerCase() || "user";

            // Check if user exists
            let newuser = false;
            let user = await Users.findOne({ email: invite.email });
            let password = generateRandomPassword();

            if (!user) {
                // Generate random password for new user
                // password = generateRandomPassword();
                user = await Users.create({
                    name: invite.name || "Unknown",
                    email: invite.email,
                    role: invite.role,
                    password, // store hashed in real app
                });
                newuser = true
            } else {
              
                // user.password = password;; // optional, or skip sending
            }
            user.save();

            // Create invite
            const existingInvite = await GroupInvites.findOne({
                userId: user._id,
                groupId: invite.groupId,
                sectionId: invite.sectionId,
            });
            
            if (!existingInvite) {
              const newInvite = await GroupInvites.create({
                  userId: user?._id,
                  groupId: invite.groupId,
                  sectionId: invite.sectionId,
                  invitedBy: invite.invitedBy,
                  role: invite.role,
              });
              await newInvite.save();
              results.push(newInvite);
            }
            // Call webhook
            if(newuser) {
                await axios.post(`${process.env.EVALUATOR_API}/api/v4/mail/campus`, {
                    email: user.email,
                    role: invite.role,
                    password,
                    name: user.name,
                });
            }


        }

        res.status(201).json({ message: "Invites processed successfully", count: results.length });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to process invites", error: err.message });
    }
}
export const deleteUsersFromSection = async (req, res) => {
  try {
    const { sectionId, studentId } = req.params;
  const { status } = req.query;
    // ✅ Validation
    if (!sectionId || !studentId) {
      return res.status(400).json({
        success: false,
        message: "Section ID and Student ID are required",
      });
    }

    const user = await Users.findOne({_id:studentId});
    let existing = null;
    if(status == "invite") {
      existing = await GroupInvites.deleteOne({
        sectionId:sectionId,
        userId:studentId
      })
    } else if(user.role = "campus-admin") {
      existing = await SectionOwner.deleteOne({
        section:sectionId,
        userId:studentId
      })
    }else {
      existing = await SectionMember.deleteOne({
      section: sectionId,
      userId: studentId,
      });
    } 

    
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "User not found in this section",
      });
    }

    // ✅ Delete from section
    await SectionMember.deleteOne({
      section: sectionId,
      userId: studentId,
    });

    // ✅ Check if user is still in any section
    const stillMember = await SectionMember.countDocuments({ userId: studentId });

    if (stillMember === 0) {
      // ❌ If not in any section, remove from group
      await GroupMember.deleteOne({ userId: studentId });
    }

    return res.status(200).json({
      success: true,
      message:
        stillMember === 0
          ? "User removed from section and group successfully"
          : "User removed from section successfully",
    });
  } catch (e) {
    console.error("Error deleting user:", e);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: e.message,
    });
  }
};
