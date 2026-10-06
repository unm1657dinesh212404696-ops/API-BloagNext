const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    postID: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
    userID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: [true, 'Comment text is required'], maxlength: 1000 },
    status: { type: String, enum: ['approved', 'pending', 'spam'], default: 'pending' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', commentSchema);
