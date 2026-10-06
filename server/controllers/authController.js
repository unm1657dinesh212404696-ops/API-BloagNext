const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const send = (res, status, user) =>
  res.status(status).json({
    success: true,
    token: signToken(user._id),
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  });

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  // Public signup may only choose reader/author. Admin/editor are granted by an admin.
  const safeRole = role === 'author' ? 'author' : 'reader';
  const user = await User.create({ name, email, password, role: safeRole });
  send(res, 201, user);
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw httpError(400, 'Email and password are required');
  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password))) throw httpError(401, 'Invalid credentials');
  send(res, 200, user);
});

exports.me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});
