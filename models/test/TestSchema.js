import mongoose, { Schema, model } from 'mongoose'
import { QuestionSchema } from './QuestionSchema.js'
import slugify from 'slugify'

const SectionSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  sectionType: { type: String, enum: ['Quiz', 'Coding'], required: true },
  questionSet: [QuestionSchema],
  problemset: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Problem' }]
})

const TestSchema = new Schema({
  sections: [SectionSchema],
  name: { type: String, required: true },
  description: { type: String },
  duration: { type: Number },
  category: {
    type: String,
    enum: ['Placements', 'Gate'],
    default: 'Placements'
  },
  isAvailable: { type: Boolean, default: false },
  visibility: {
    type: String,
    enum: ['private', 'public', 'group'],
    default: 'private'
  },
  slug: { type: String },
  isGroup : { type : Boolean ,default :false},
  sectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section',
    required: function() { return !!this.sectionId; } // optional
  },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      required: false
    },
}, {
  timestamps: true
})

TestSchema.index({ slug: 1 }, { unique: true })

TestSchema.pre('validate', function (next) {
  if (this.isModified('name') || !this.slug) {
    const baseSlug = slugify(this.name, {
      lower: true,
      strict: true,
      trim: true
    })

    // Add a timestamp suffix to ensure uniqueness
    this.slug = `${baseSlug}-${Date.now()}`
  }
  next()
})


export const Test = model('Test', TestSchema)
