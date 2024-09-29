// server/controllers/postController.ts

import { Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import Post from '../models/Post';

// Create a new post
export const createPost = [
    body('title').isString().trim().escape().withMessage('Title is required'),
    body('content').isString().trim().escape().withMessage('Content is required'),
    body('author').isMongoId().withMessage('Invalid author ID').trim().escape(),
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
        } catch (error) {
            console.error('Error creating post:', error);
            res.status(500).send('Error creating post');
        }
    }
];

// Get all posts
export const getPosts = async (req: Request, res: Response) => {
    try {
        const posts = await Post.find();
        res.status(200).json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).send('Error fetching posts');
    }
};

// Get post by ID
export const getPostById = [
    param('id').isMongoId().withMessage('Invalid post ID').trim().escape(),
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
        } catch (error) {
            console.error('Error fetching post:', error);
            res.status(500).send('Error fetching post');
        }
    }
];

// Delete post by ID
export const deletePost = [
    param('id').isMongoId().withMessage('Invalid post ID').trim().escape(),
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
        } catch (error) {
            console.error('Error deleting post:', error);
            res.status(500).send('Error deleting post');
        }
    }
];
