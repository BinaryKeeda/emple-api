import mongoose, { mongo, Mongoose } from "mongoose";

const GroupSchema = new mongoose.Schema({
  groupName: { type: String, required: true },
  isCampus: { type: Boolean, default: false },
});

GroupSchema.index({ groupName: 1 }, { unique: true }); 

GroupSchema.index({ isCampus: 1 });

const Group = mongoose.model('Group', GroupSchema);

export default Group;
