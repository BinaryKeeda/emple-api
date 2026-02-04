import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
    sectionId: { type: mongoose.Schema.Types.ObjectId, ref: "Section" },
    createdAt: { type: Date, default: Date.now },
    text : { type:String, required:true },
});

export const NotificationModel = mongoose.model("Notification", notificationSchema);
