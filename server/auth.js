const express = require('express');
const router = express.Router();

// Example route
router.post('/login', async (req, res) => {
    // Authentication logic here
    res.send('Login route');
});

router.post('/register', async (req, res) => {
    // Registration logic here
    res.send('Register route');
});

module.exports = router;
