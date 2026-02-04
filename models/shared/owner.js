import mongoose, { Schema } from "mongoose";

const groupOwnerSchema = new Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true }
});

groupOwnerSchema.index({ group: 1, userId: 1 }, { unique: true });

const sectionOwnerSchema = new Schema({
  section: { type: mongoose.Schema.Types.ObjectId, ref: "Section", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true }
});


export const GroupOwner = mongoose.model("GroupOwner", groupOwnerSchema);
export const SectionOwner = mongoose.model("SectionOwner", sectionOwnerSchema);
