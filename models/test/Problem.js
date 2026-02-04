import mongoose from 'mongoose';
import slugify from 'slugify';
const ProblemSchema = new mongoose.Schema({
  
  title: {
    type: String,
    trim: true,
    default:""
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Easy'
  },
  tags: {
    type: [String],
    default: [],
  },
  description: {
    type: String,
  },
  descriptionMarkdown: {
    type: Boolean,
    default: true,
  },
  constraints: {
    type: [String],
    default: [],
  },
  inputFormat: {
    type: [String],
    default: [],
  },
  outputFormat: {
    type: [String],
    default: [],
  },
  examples: [
    {
      input: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
        trim:true
      },
      output: {
        type: mongoose.Schema.Types.Mixed,
            trim:true,
        required: true,
      },
      explanation: String,
    }
  ],
  testCases: [
    {
      input: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
      },
      output: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
      },
      hidden: {
        type: Boolean,
        default: true,
      }
    }
  ],
  functionSignature: [
    {
      language:String,
      signature:String
    }
  ],
  solution: {
    explanation: { type: String },
    timeComplexity: { type: String },
    spaceComplexity: { type: String },
  },
  boilerplate: {
    python: { type: String, default: '' },
    cpp: { type: String, default: '' },
    java: { type: String, default: '' },
    js: { type: String, default: '' }
  },
  hints: {
    type: [String],
    default: [],
  },
  timeLimit: {
    type: Number,
    default: 1000 
  },
  memoryLimit: {
    type: Number,
    default: 256000 
  },
  languagesSupported: {
    type: [String],
    enum: ['python', 'cpp', 'java', 'c'],
    default: ['python', 'cpp', 'java' , 'c']
  },
  performanceStats: {
    avgRuntimeMs: { type: Number, default: 0 },
    avgMemoryKb: { type: Number, default: 0 },
    successRate: { type: Number, default: 0.0 },
    submissionCount: { type: Number, default: 0 }
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: false
  },
  isDeleted: {
    type:Boolean,
    default:false
  } ,
  slug:{type:String  }
}, {timestamps:true});

// Optional: Automatically update `updatedAt`
ProblemSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});
// ProblemSchema.pre('validate', function (next) {
//   if(!this.title) next();
//   if (this.isModified('title') || !this.slug) {
//     this.slug = slugify(this.title, {
//       lower: true,
//       strict: true, // removes special characters
//       trim: true
//     });
//   }
//   next();
// })
const Problem = mongoose.model('Problem' ,ProblemSchema);
export default Problem;