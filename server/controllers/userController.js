const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');

exports.listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort('-createdAt');
  res.json({ success: true, count: users.length, users });
});

exports.updateRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!User.ROLES.includes(role)) throw httpError(400, `Role must be one of: ${User.ROLES.join(', ')}`);
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true, runValidators: true });
  if (!user) throw httpError(404, 'User not found');
  res.json({ success: true, user });
});

exports.deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === String(req.user._id)) throw httpError(400, 'You cannot delete yourself');
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw httpError(404, 'User not found');
  res.json({ success: true, message: 'User deleted' });
});
