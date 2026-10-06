const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { generateBlog, summarize } = require('../controllers/aiController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('author', 'editor', 'admin'));
router.use(rateLimit({ windowMs: 60 * 1000, max: 10, message: { success: false, message: 'AI rate limit reached, try again in a minute' } }));

router.post('/generate-blog', generateBlog);
router.post('/summarize', summarize);

module.exports = router;
