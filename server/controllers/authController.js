const User = require('../models/User');
const Post = require('../models/Post'); // Add this line

exports.register = async (req, res) => {
    try {
        const { username, password } = req.body;
        const newUser = new User({ username, password });
        await newUser.save();
        res.status(201).send('User registered');
    } catch (error) {
        res.status(500).send('Error registering user');
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username, password });
        if (user) {
            res.status(200).send('User logged in');
        } else {
            res.status(401).send('Invalid credentials');
        }
    } catch (error) {
        res.status(500).send('Error logging in');
    }
};

// Add the createPost method
exports.createPost = async (req, res) => {
    try {
        const { title, content, author } = req.body;
        const newPost = new Post({ title, content, author });
        await newPost.save();
        res.status(201).send('Post created');
    } catch (error) {
        res.status(500).send('Error creating post');
    }
};
