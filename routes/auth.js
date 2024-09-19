// Example root routes/auth.js

const express = require('express');
const router = express.Router();

// Define any root-level routes or middleware here
router.get('/', (req, res) => {
    res.send('Welcome to the authentication service');
});

module.exports = router;
