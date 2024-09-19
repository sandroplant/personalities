const Post = require('../models/Post');
const User = require('../models/User');

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

exports.getPosts = async (req, res) => {
    try {
        const posts = await Post.find();
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).send('Error fetching posts');
    }
};

exports.getPostById = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await Post.findById(id);
        if (post) {
            res.status(200).json(post);
        } else {
            res.status(404).send('Post not found');
        }
    } catch (error) {
        res.status(500).send('Error fetching post');
    }
};

exports.deletePost = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await Post.findByIdAndDelete(id);
        if (post) {
            res.status(200).send('Post deleted');
        } else {
            res.status(404).send('Post not found');
        }
    } catch (error) {
        res.status(500).send('Error deleting post');
    }
};
