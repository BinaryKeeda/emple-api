import mongoose, {  Schema } from "mongoose";

const SectionResponseSchema = new Schema({
  sectionId: { type: Schema.Types.ObjectId, required: true },
  sectionType: { type: String, enum: ['quiz', 'coding'], required: true },
  quizAnswers: {type:[] , sparse:true},
  codingAnswers: {type:[Schema.Types.Mixed], sparse:true},
  totalQuestions  : {type:Number,default:-1},
  correctAnswers:{type:Number,default:-1},
  startedAt: {type:Date}, 
  pausedAt: {type:Date},
  durationUnavailaible : {type:Date}, 
  isSubmitted:{ type:Boolean,default:false},
});

const ExamSolutionSchema = new Schema({
  userId : {type: mongoose.Schema.ObjectId , ref : 'Users'}, 
  testId : {type:mongoose.Schema.ObjectId, ref: 'Exam'},
  currSection : {type : Number , default: 0},
  ufmAttempts: {type : Number, default: 0},
  testSnapshot: {type:[mongoose.Schema.Types.Mixed] , default:[]},
  response: [SectionResponseSchema],
  hasAgreed: {type:Boolean , default:false},
  isSubmitted: {type:Boolean, default:false},
  userDetails:[mongoose.Schema.Types.Mixed],
  isEvaluated: {type:Boolean , default:false},
  feedback:[mongoose.Schema.Types.Mixed]
},
{
  timestamps:true
});
ExamSolutionSchema.index({
  userId: 1,
  testId: 1,
})
const ExamSolution =  mongoose.model('ExamSolution', ExamSolutionSchema);  //
export default ExamSolution;