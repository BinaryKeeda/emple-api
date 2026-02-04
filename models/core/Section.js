import mongoose from "mongoose";
import slugify from "slugify";

const sectionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  orderd: { type: Boolean, default: false },
  type: [],
  logo: {type:String},
  slug: { type: String, unique: true, index: true } // indexed & unique
});

// Pre-save hook to generate slug from name
sectionSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

// Optional: Pre-update hook for findOneAndUpdate
sectionSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update.name) {
    update.slug = slugify(update.name, { lower: true, strict: true });
    this.setUpdate(update);
  }
  next();
});

const Section = mongoose.model("Section", sectionSchema);
export default Section;
