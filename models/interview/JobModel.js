import mongoose from 'mongoose';

const opportunitySchema = new mongoose.Schema({
  title: { type: String, required: true },                // Name of opportunity
  description: { type: String, required: true },          // Detailed description
  type: {                                                 // Job, Internship, etc.
    type: String,
    enum: ['Internship', 'Full-Time', 'Part-Time', 'Fellowship', 'Contract', 'Special'],
    required: true
  },
  company: { type: String },                              // Company / Organization name
  location: { type: String },                             // City / Remote / Hybrid
  salary: { type: String },                               // Could be "₹20k/month" or "Not disclosed"
  requirements: { type: [String] },                       // List of skills/requirements
  perks: { type: [String] },                              // Benefits/perks offered
  deadline: { type: Date },                               // Application deadline
  applyLink: { type: String },                            // External application link
}, { timestamps: true });                                 // Adds createdAt & updatedAt

export default mongoose.model('Opportunity', opportunitySchema);
