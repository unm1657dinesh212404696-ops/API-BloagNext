const router = require('express').Router();
const c = require('../controllers/commentController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('editor', 'admin'), c.moderationQueue);
router.put('/:id/status', protect, authorize('editor', 'admin'), c.setStatus);
router.delete('/:id', protect, c.deleteComment);

module.exports = router;
