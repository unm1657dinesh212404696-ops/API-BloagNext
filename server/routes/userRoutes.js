const router = require('express').Router();
const { listUsers, updateRole, deleteUser } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));
router.get('/', listUsers);
router.put('/:id/role', updateRole);
router.delete('/:id', deleteUser);

module.exports = router;
