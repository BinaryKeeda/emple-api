import mongoose, { mongo, Schema } from 'mongoose'
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

const TestSchema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true },
  sections: [SectionSchema],
  groupId: { type: Schema.Types.ObjectId, ref: 'Group' },
  isAvailable: { type: Boolean, default: false },
  visibility: {type:String , enum:['private' , 'public' , 'group'] , default:'public'},
  userDetails:{
    type:[mongoose.Schema.Types.Mixed],
    default: ['Name' , 'Email' , 'Sap ID' , 'Phone']
  },
}, {
  timestamps: true
});

TestSchema.index({ slug: 1 })
TestSchema.index({ status: 1, campusId: 1 })
TestSchema.pre('validate', function (next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true, // removes special characters
      trim: true
    });
  }
  next();
})

const CampusTest =  mongoose.model('CampusTest', TestSchema)
export default CampusTest;
