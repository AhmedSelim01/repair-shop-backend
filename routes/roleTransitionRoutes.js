const express = require('express');
const { validateUserFields, validateObjectId } = require('../middleware/validationMiddleware');
const { handleRoleTransition } = require('../middleware/roleTransitionMiddleware');
const router = express.Router();

// Role transition route
router.post('/role-transition',validateUserFields, validateObjectId, handleRoleTransition, (req, res) => {
    res.send('Role transition request');
});

// Export the router to be used in server.js
module.exports = router;