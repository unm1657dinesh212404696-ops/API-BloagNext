const Post = require('../models/Post');
const gemini = require('../services/gemini');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');

// POST /api/ai/generate-blog  { topic, tone?, length?, keywords?, save? }
exports.generateBlog = asyncHandler(async (req, res) => {
  const { topic, tone, length, keywords, save } = req.body;
  if (!topic) throw httpError(400, 'topic is required');
  const kw = Array.isArray(keywords) ? keywords : [];
  const blog = await gemini.generateBlog({ topic, tone, length, keywords: kw });

  let post = null;
  if (save) {
    post = await Post.create({
      userID: req.user._id,
      name: blog.title || topic,
      message: blog.content,
      tags: (blog.tags || []).map((t) => String(t).toLowerCase()),
      category: String(blog.category || 'general').toLowerCase(),
      status: 'draft',
      aiGenerated: true
    });
  }
  res.json({ success: true, blog, savedPost: post });
});

// POST /api/ai/summarize  { text } or { postId }
exports.summarize = asyncHandler(async (req, res) => {
  let { text, postId } = req.body;
  let post = null;
  if (postId) {
    post = await Post.findById(postId);
    if (!post) throw httpError(404, 'Post not found');
    text = post.message;
  }
  if (!text || text.length < 50) throw httpError(400, 'Provide text (min 50 chars) or a valid postId');
  const summary = await gemini.summarize(text);
  if (post && String(post.userID) === String(req.user._id)) {
    post.summary = summary;
    await post.save();
  }
  res.json({ success: true, summary });
});
