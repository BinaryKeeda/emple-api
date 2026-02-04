import mongoose from 'mongoose';

const RankSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  points: {
    type: Number,
    required: true,
    default: 0,
  },
  solutions:{
    totalQuizSolutions: {type:Number , default:0},
    totalTestSolutions: {type:Number , default:0},
    aptitude:{
        average:{type:Number, default:0},
      attempted:{type:Number, default:0},
    },
    miscellaneous:{
        average:{type:Number, default:0},
        attempted:{type:Number, default:0},
    },
    core:{
        average:{type:Number, default:0},
        attempted:{type:Number, default:0},
    },
    easy:{
         average:{type:Number, default:0},
         attempted:{type:Number, default:0},
    },
    medium: {
         average:{type:Number, default:0},
        attempted:{type:Number, default:0},
    },
    hard :{
         average:{type:Number, default:0},
        attempted:{type:Number, default:0},
    }
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

RankSchema.index({ points: -1 });

const Rank = mongoose.model('Rank', RankSchema);
export default Rank;
