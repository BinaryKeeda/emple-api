import mongoose, { Schema, model } from 'mongoose';
import { QuestionSchema } from '../test/QuestionSchema.js';

const QuestionBankSchema = new Schema({
  name: { type: String, required: true }, 
  category: {
    type: String,
    enum: ['Core', 'Aptitude', 'Excel', 'Miscellaneous'],
    required: true
  },
  questions: {
    type: [QuestionSchema],
    default: [],
  },
  groupId : {
    type: mongoose.Schema.Types.ObjectId, ref: "Group", 
  },
  creator:{
    type: mongoose.Schema.Types.ObjectId, ref: "Users", 
  }
}, { timestamps: true });

export const QuestionBank = model('QuestionBank', QuestionBankSchema);
