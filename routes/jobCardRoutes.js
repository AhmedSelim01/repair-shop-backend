const express = require('express');
const { createJobCard, getAllJobCards, getJobCardById, updateJobCard, deleteJobCard } = require('../controllers/jobCardController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Create a new job card
router.post('/', authMiddleware, roleMiddleware(['admin', 'employee']), createJobCard);

// Get all job cards
router.get('/', authMiddleware, roleMiddleware(['admin', 'employee']), getAllJobCards);

// Get job card by ID
router.get('/:id', authMiddleware, roleMiddleware(['admin', 'employee']), getJobCardById);

// Update job card
router.put('/:id', authMiddleware, roleMiddleware(['admin', 'employee']), updateJobCard);

// Delete job card
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), deleteJobCard);

module.exports = router;