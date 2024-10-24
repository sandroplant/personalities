import { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import Post from '../models/Post.js';

// Create a new post
export const createPost = [
    body('title').isString().trim().escape().withMessage('Title is required'),
    body('content')
        .isString()
        .trim()
        .escape()
        .withMessage('Content is required'),
    body('author').isMongoId().withMessage('Invalid author ID'),
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { title, content, author } = req.body;
            const newPost = new Post({ title, content, author });
            await newPost.save();
            res.status(201).send('Post created');
        } catch {
            res.status(500).send('Error creating post');
        }
    },
];

// Get all posts
export const getPosts = async (_req: Request, res: Response) => {
    try {
        const posts = await Post.find();
        res.status(200).json(posts);
    } catch {
        res.status(500).send('Error fetching posts');
    }
};

// Get post by ID
export const getPostById = [
    param('id').isMongoId().withMessage('Invalid post ID'),
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { id } = req.params;
            const post = await Post.findById(id);
            if (post) {
                res.status(200).json(post);
            } else {
                res.status(404).send('Post not found');
            }
        } catch {
            res.status(500).send('Error fetching post');
        }
    },
];

// Delete post by ID
export const deletePost = [
    param('id').isMongoId().withMessage('Invalid post ID'),
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { id } = req.params;
            const post = await Post.findByIdAndDelete(id);
            if (post) {
                res.status(200).send('Post deleted');
            } else {
                res.status(404).send('Post not found');
            }
        } catch {
            res.status(500).send('Error deleting post');
        }
    },
];
