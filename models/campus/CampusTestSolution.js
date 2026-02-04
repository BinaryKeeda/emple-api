import mongoose, { Mongoose, Schema } from "mongoose";

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

const CampusTestSolutionScheam = new Schema({
  userId : {type: mongoose.Schema.ObjectId , ref : 'Users'}, 
  testId : {type:mongoose.Schema.ObjectId, ref: 'CampusTest'},
  currSection : {type : Number , default: 0},
  ufmAttempts: {type : Number, default: 0},
  testSnapshot: {type:[mongoose.Schema.Types.Mixed] , default:[]},
  response: [SectionResponseSchema],
  hasAgreed: {type:Boolean , default:false},
  isSubmitted: {type:Boolean, default:false},
  userDetails:[mongoose.Schema.Types.Mixed],
  feedback:[mongoose.Schema.Types.Mixed]
},
{
  timestamps:true
});
CampusTestSolutionScheam.index({ testId: 1 }, { unique: true });
CampusTestSolutionScheam.index({
  userId: 1,
  testId: 1,
})
const CampusTestSolution =  mongoose.model('CampusTestSolution', CampusTestSolutionScheam);  //
export default CampusTestSolution;