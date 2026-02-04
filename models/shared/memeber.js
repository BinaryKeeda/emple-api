import mongoose, { Schema } from "mongoose";

const groupMemberSchema = new Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true }
});


const sectionMemberschema  = new Schema({
  section: { type: mongoose.Schema.Types.ObjectId, ref: "Section", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true }
});


export const GroupMember = mongoose.model("GroupMember", groupMemberSchema);
export const SectionMember = mongoose.model("SectionMember", sectionMemberschema );
