const Post = require('../models/Post');
const Comment = require('../models/Comment');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');

const isStaff = (u) => u && ['admin', 'editor'].includes(u.role);
const isVisible = (p) =>
  p.status === 'published' || (p.status === 'scheduled' && p.scheduledAt && p.scheduledAt <= new Date());
const publicFilter = () => ({
  $or: [{ status: 'published' }, { status: 'scheduled', scheduledAt: { $lte: new Date() } }]
});
const parseTags = (t) => (Array.isArray(t) ? t : typeof t === 'string' ? t.split(',') : []).map((x) => String(x).trim().toLowerCase()).filter(Boolean);

// Public: list published posts with search / filter / pagination
exports.listPosts = asyncHandler(async (req, res) => {
  const { q, tag, category, author, sort = '-createdAt' } = req.query;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);

  const filter = publicFilter();
  if (q) filter.$text = { $search: String(q) };
  if (tag) filter.tags = String(tag).toLowerCase();
  if (category) filter.category = String(category).toLowerCase();
  if (author) filter.userID = author;

  const [posts, total] = await Promise.all([
    Post.find(filter).select('-likedBy').populate('userID', 'name').sort(String(sort)).skip((page - 1) * limit).limit(limit),
    Post.countDocuments(filter)
  ]);
  res.json({ success: true, total, page, pages: Math.ceil(total / limit), posts });
});

exports.getPost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id).select('-likedBy').populate('userID', 'name');
  if (!post) throw httpError(404, 'Post not found');
  const owner = req.user && String(post.userID._id) === String(req.user._id);
  if (!isVisible(post) && !owner && !isStaff(req.user)) throw httpError(404, 'Post not found');
  if (isVisible(post)) await Post.updateOne({ _id: post._id }, { $inc: { views: 1 } });
  res.json({ success: true, post });
});

exports.createPost = asyncHandler(async (req, res) => {
  const { name, message, photo, summary, category, tags, scheduledAt, aiGenerated } = req.body;
  let status = 'draft';
  if (req.body.status === 'pending') status = 'pending';
  if (scheduledAt && isStaff(req.user)) status = 'scheduled';
  const post = await Post.create({
    userID: req.user._id, name, message, photo, summary, category,
    tags: parseTags(tags), status, scheduledAt, aiGenerated: !!aiGenerated
  });
  res.status(201).json({ success: true, post });
});

exports.updatePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) throw httpError(404, 'Post not found');
  if (String(post.userID) !== String(req.user._id) && !isStaff(req.user)) throw httpError(403, 'Not your post');

  ['name', 'message', 'photo', 'summary', 'category'].forEach((f) => {
    if (req.body[f] !== undefined) post[f] = req.body[f];
  });
  if (req.body.tags !== undefined) post.tags = parseTags(req.body.tags);
  // Authors may only move between draft <-> pending
  if (req.body.status && ['draft', 'pending'].includes(req.body.status)) post.status = req.body.status;
  await post.save();
  res.json({ success: true, post });
});

exports.deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) throw httpError(404, 'Post not found');
  if (String(post.userID) !== String(req.user._id) && !isStaff(req.user)) throw httpError(403, 'Not your post');
  await Comment.deleteMany({ postID: post._id });
  await post.deleteOne();
  res.json({ success: true, message: 'Post deleted' });
});

// Editor/Admin: change publishing status (draft | pending | scheduled | published)
exports.setStatus = asyncHandler(async (req, res) => {
  const { status, scheduledAt } = req.body;
  if (!['draft', 'pending', 'scheduled', 'published'].includes(status)) throw httpError(400, 'Invalid status');
  if (status === 'scheduled' && !scheduledAt) throw httpError(400, 'scheduledAt is required for scheduled posts');
  const post = await Post.findByIdAndUpdate(
    req.params.id,
    { status, scheduledAt: status === 'scheduled' ? scheduledAt : undefined },
    { new: true, runValidators: true }
  );
  if (!post) throw httpError(404, 'Post not found');
  res.json({ success: true, post });
});

// Editor/Admin: review queue
exports.pendingQueue = asyncHandler(async (req, res) => {
  const posts = await Post.find({ status: 'pending' }).populate('userID', 'name email').sort('createdAt');
  res.json({ success: true, count: posts.length, posts });
});

// Author: their own posts (all statuses)
exports.myPosts = asyncHandler(async (req, res) => {
  const filter = { userID: req.user._id };
  if (req.query.status) filter.status = String(req.query.status);
  const posts = await Post.find(filter).sort('-createdAt');
  res.json({ success: true, count: posts.length, posts });
});

// Author: performance analytics
exports.myStats = asyncHandler(async (req, res) => {
  const posts = await Post.find({ userID: req.user._id }).select('name status views likes');
  const ids = posts.map((p) => p._id);
  const comments = await Comment.aggregate([
    { $match: { postID: { $in: ids } } },
    { $group: { _id: '$postID', count: { $sum: 1 } } }
  ]);
  const cmap = Object.fromEntries(comments.map((c) => [String(c._id), c.count]));
  const perPost = posts.map((p) => ({
    id: p._id, title: p.name, status: p.status, views: p.views, likes: p.likes, comments: cmap[String(p._id)] || 0
  }));
  const totals = perPost.reduce(
    (t, p) => ({ views: t.views + p.views, likes: t.likes + p.likes, comments: t.comments + p.comments }),
    { views: 0, likes: 0, comments: 0 }
  );
  res.json({ success: true, totalPosts: posts.length, totals, posts: perPost });
});

exports.toggleLike = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post || !isVisible(post)) throw httpError(404, 'Post not found');
  const idx = post.likedBy.findIndex((id) => String(id) === String(req.user._id));
  if (idx >= 0) post.likedBy.splice(idx, 1); else post.likedBy.push(req.user._id);
  post.likes = post.likedBy.length;
  await post.save();
  res.json({ success: true, liked: idx < 0, likes: post.likes });
});
