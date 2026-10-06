const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    userID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: [true, 'Title is required'], trim: true },       // title
    photo: { type: String, default: '' },                                           // media path
    message: { type: String, required: [true, 'Content is required'] },              // body
    summary: { type: String, default: '' },
    category: { type: String, trim: true, lowercase: true, default: 'general', index: true },
    tags: { type: [String], default: [], index: true },
    status: {
      type: String,
      enum: ['draft', 'pending', 'scheduled', 'published'],
      default: 'draft',
      index: true
    },
    scheduledAt: { type: Date },
    likes: { type: Number, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    views: { type: Number, default: 0 },
    aiGenerated: { type: Boolean, default: false }
  },
  { timestamps: true }
);

postSchema.index({ name: 'text', message: 'text', tags: 'text' });

module.exports = mongoose.model('Post', postSchema);
