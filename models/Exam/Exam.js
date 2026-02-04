import mongoose, {  Schema } from 'mongoose'
import slugify from 'slugify'

const SectionSchema = new Schema({
  title: { type: String, required: true },
  questionPool: { type: Schema.Types.ObjectId, ref: 'QuestionBank' , default:null},
  problemPool: [{ type: Schema.Types.ObjectId, ref: 'Problem' }],
  maxQuestion: { type: Number },    
  maxTime: { type: Number },        
  maxScore: { type: Number },       
  description: { type: String },
  type: { type: String, enum: ['quiz', 'coding', 'mixed'], default: 'quiz' }
});

const ExamSchema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true },
  sections: [SectionSchema],
  isAvailable: { type: Boolean, default: false },
  visibility: {type:String , enum:['private' , 'public' , 'group'] , default:'public'},
  sectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section',
  },
  cost:{type:Number, default:20},
  userDetails:{
    type:[mongoose.Schema.Types.Mixed],
    default: []
  },
  passcode:{type:String , default:""},
  isProtected: {type:Boolean, default:false},
   creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: false
      },
}, {
  timestamps: true
});

ExamSchema.index({ slug: 1 })
ExamSchema.index({ status: 1, campusId: 1 })
ExamSchema.pre('validate', function (next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true, // removes special characters
      trim: true
    });
  }
  next();
})

const Exam =  mongoose.model('Exam', ExamSchema);
export default Exam;
