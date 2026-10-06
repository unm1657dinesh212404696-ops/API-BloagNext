const Comment = require('../models/Comment');
const Post = require('../models/Post');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');

exports.addComment = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.postId);
  if (!post) throw httpError(404, 'Post not found');
  const comment = await Comment.create({ postID: post._id, userID: req.user._id, text: req.body.text });
  res.status(201).json({ success: true, message: 'Comment submitted for moderation', comment });
});

exports.listForPost = asyncHandler(async (req, res) => {
  const comments = await Comment.find({ postID: req.params.postId, status: 'approved' })
    .populate('userID', 'name').sort('-createdAt');
  res.json({ success: true, count: comments.length, comments });
});

exports.moderationQueue = asyncHandler(async (req, res) => {
  const comments = await Comment.find({ status: String(req.query.status || 'pending') })
    .populate('userID', 'name email').populate('postID', 'name').sort('createdAt');
  res.json({ success: true, count: comments.length, comments });
});

exports.setStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['approved', 'pending', 'spam'].includes(status)) throw httpError(400, 'Status must be approved, pending or spam');
  const comment = await Comment.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!comment) throw httpError(404, 'Comment not found');
  res.json({ success: true, comment });
});

exports.deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) throw httpError(404, 'Comment not found');
  const owner = String(comment.userID) === String(req.user._id);
  if (!owner && req.user.role !== 'admin') throw httpError(403, 'Not allowed');
  await comment.deleteOne();
  res.json({ success: true, message: 'Comment deleted' });
});
