const router = require('express').Router();
const c = require('../controllers/postController');
const cc = require('../controllers/commentController');
const { protect, optionalAuth, authorize } = require('../middleware/auth');

// Public
router.get('/', c.listPosts);

// Author / staff (must come before '/:id')
router.get('/mine/list', protect, authorize('author', 'editor', 'admin'), c.myPosts);
router.get('/mine/stats', protect, authorize('author', 'editor', 'admin'), c.myStats);
router.get('/queue/pending', protect, authorize('editor', 'admin'), c.pendingQueue);

router.get('/:id', optionalAuth, c.getPost);
router.post('/', protect, authorize('author', 'editor', 'admin'), c.createPost);
router.put('/:id', protect, authorize('author', 'editor', 'admin'), c.updatePost);
router.delete('/:id', protect, authorize('author', 'editor', 'admin'), c.deletePost);
router.put('/:id/status', protect, authorize('editor', 'admin'), c.setStatus);
router.post('/:id/like', protect, c.toggleLike);

// Comments nested under a post
router.get('/:postId/comments', cc.listForPost);
router.post('/:postId/comments', protect, cc.addComment);

module.exports = router;
