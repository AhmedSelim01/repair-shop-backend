const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { roleMiddleware } = require('../middleware/roleMiddleware');
const { validateObjectId } = require('../middleware/validationMiddleware')
const { getAllUsers, getUserById, updateUser, deleteUser } = require('../controllers/userControllers');
const router = express.Router();

// User management routes
router.get('/', authMiddleware, roleMiddleware(['admin', 'employee']), getAllUsers);
router.get('/:id', validateObjectId, authMiddleware, roleMiddleware(['admin', 'employee']), getUserById);
router.put('/:id', validateObjectId, authMiddleware, roleMiddleware(['admin']), updateUser);
router.delete('/:id', validateObjectId, authMiddleware, roleMiddleware(['admin']), deleteUser);

module.exports = router;