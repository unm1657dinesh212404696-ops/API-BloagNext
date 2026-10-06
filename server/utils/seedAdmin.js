// Usage: node utils/seedAdmin.js  (creates admin@blognest.com / Admin@123 if missing)
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const email = 'admin@blognest.com';
  if (await User.findOne({ email })) console.log('Admin already exists');
  else { await User.create({ name: 'Admin', email, password: 'Admin@123', role: 'admin' }); console.log('Admin created:', email, '/ Admin@123'); }
  await mongoose.disconnect();
})();
