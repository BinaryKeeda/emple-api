import mongoose, { Schema, model } from "mongoose";

const UserSolutionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  responseId: { type: Schema.Types.ObjectId, ref: 'TestResponse', required: true }, // ADDED
  problemId: { type: Schema.Types.ObjectId, ref: 'Problem', required: true },
  language: { type: String, required: true },
  code: { type: String, required: true },
  codeReview:{},
  passedTestCases: { type: Number, default: 0 },
  totalTestCases: { type: Number, default: 0 },
  executionTime: { type: Number },
  memoryUsed: { type: Number },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Composite index: handles user submissions for same problem in different tests
UserSolutionSchema.index({ userId: 1, problemId: 1, testId: 1, submittedAt: -1 });

export const UserSolution = model('UserSolution', UserSolutionSchema);
