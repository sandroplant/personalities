const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const userRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile'); // Ensure this is the correct path

const app = express(); // Define app

// Configure Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Middleware
app.use(bodyParser.json());
app.use('/uploads', express.static('uploads')); // Serve static files

// Routes
app.use('/api/auth', userRoutes);
app.use('/api/profile', profileRoutes); // Ensure this is correct

// Connect to MongoDB
mongoose.connect('mongodb+srv://sandroplant:xelosani1@personalities.ruznq.mongodb.net/?retryWrites=true&w=majority&appName=Personalities', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB Atlas!');
}).catch(err => {
    console.error('Error connecting to MongoDB:', err);
});

// Start server
app.listen(5001, () => {
    console.log('Server running at http://localhost:5001');
});
