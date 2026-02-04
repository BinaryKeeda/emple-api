import mongoose, { Schema } from "mongoose";
import { boolean } from "zod";

const SolutionSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true
  },
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  attemptNo: {
    type: Number,
    required: true,
    min: 1
  },
  response: {
    type: Map,
    default: {}
  },
  ufmAttempts: { type: Number, default: 0 },
  score: { type: Number, default: 0 },
  isSubmitted: { type: Boolean, default: false },
  isEvaluated: { type:Boolean, default:false }
}, {
  timestamps: true
});

// Performance index
SolutionSchema.index({ quizId: 1, userId: 1, isSubmitted: 1 });
// SolutionSchema.index({
//   title: "text",
//   description: "text",
//   content: "text"
// })

const Solution = mongoose.model('Solution', SolutionSchema);
export default Solution;
