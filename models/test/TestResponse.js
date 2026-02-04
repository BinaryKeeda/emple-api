// models/TestResponse.js
import mongoose, { Schema, model } from "mongoose";
import { boolean } from "zod";

// Response for a quiz question
// const QuizAnswerSchema = new Schema({
//   questionId: { type: Schema.Types.ObjectId, required: true },
//   selectedOptionId: { type: Schema.Types.ObjectId } // optional if not attempted
// });

// // Response for a coding problem
// const CodingAnswerSchema = new Schema({
//   id:{type:String},
//   userSolutionId: { type: Schema.Types.ObjectId, ref: 'UserSolution' } // or another solution model
// });

// Response to one section
const SectionResponseSchema = new Schema({
  sectionId: { type: Schema.Types.ObjectId, required: true },
  sectionType: { type: String, enum: ['Quiz', 'Coding'], required: true },
  quizAnswers: {type:[] , sparse:true},
  codingAnswers: {type:[Schema.Types.Mixed], sparse:true},
  totalQuestions  : {type:Number,default:-1},
  correctAnswers:{type:Number,default:-1}
});

// Full test response by a user
const TestResponseSchema = new Schema({
  testId: { type: Schema.Types.ObjectId, ref: 'Test', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
  isSubmitted: { type: Boolean, default: false },

  response: [SectionResponseSchema], // assuming you defined this elsewhere
  hasAgreed: { type: Boolean, default: false },

  startedAt: { type: Date, default: null },      // when test started
  endedAt: { type: Date, default: null },        // when test was submitted

  durationSpent: { type: Number, default: 0 },   // total active time (in ms)

  pausedAt: { type: Date, default: null },       // when test was paused (disconnected)
  lastSeenAt: { type: Date, default: null },     // last active time (used to calculate time spent)

  ufm: { type: Number, default: 0 },             // unauthorized fullscreen/tab switches
  curr: { type: Number, default: 0 },            // current section index
  attempt: { type: Number, default: 1 }    ,      // attempt count, if reattempting allowed
  isEvaluated  :{type:Boolean, default:false}
}, {
  timestamps: true
});

// Composite index: a user can have multiple attempts for a test
TestResponseSchema.index({ testId: 1, userId: 1 });

export const TestResponse = model('TestResponse', TestResponseSchema);
