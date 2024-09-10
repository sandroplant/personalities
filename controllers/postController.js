const User = require('../models/User');
const Post = require('../models/Post');

exports.getProfile = async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ username });
        if (user) {
            res.status(200).json(user.profile);
        } else {
            res.status(404).send('User not found');
        }
    } catch (error) {
        res.status(500).send('Error fetching profile');
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { username } = req.params;
        const { bio, location, website } = req.body;
        const user = await User.findOneAndUpdate(
            { username },
            { $set: { 'profile.bio': bio, 'profile.location': location, 'profile.website': website }},
            { new: true }
        );
        if (user) {
            res.status(200).send('Profile updated');
        } else {
            res.status(404).send('User not found');
        }
    } catch (error) {
        res.status(500).send('Error updating profile');
    }
};

exports.createPost = async (req, res) => {
    try {
        const { username, title, content } = req.body;
        const user = await User.findOne({ username });

        if (user) {
            const newPost = new Post({ title, content, author: username });
            await newPost.save();
            user.posts.push(newPost._id);
            await user.save();
            res.status(201).send('Post created');
        } else {
            res.status(404).send('User not found');
        }
    } catch (error) {
        res.status(500).send('Error creating post');
    }
};
