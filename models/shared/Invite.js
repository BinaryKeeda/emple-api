import mongoose, { Schema } from "mongoose";

const inviteSchema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
    sectionId: { type: mongoose.Schema.Types.ObjectId, ref: "Section" },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },        
    createdAt: { type: Date, default: Date.now },
    role : { type:String, enum:["user", "campus-admin" , "campus-superadmin"]}
});

export const GroupInvites = mongoose.model("GroupInvite", inviteSchema);
