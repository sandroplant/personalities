import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import User from './models/User.js';
const router = express.Router();
const validateLogin = [
    body('email').isEmail().withMessage('Invalid email address').normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .trim()
        .escape(),
];
const validateRegister = [
    body('email').isEmail().withMessage('Invalid email address').normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .trim()
        .escape(),
    body('name').not().isEmpty().withMessage('Name is required').trim().escape(),
];
router.post('/login', validateLogin, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }
        req.session.user = user.id;
        res.send('Login successful');
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/register', validateRegister, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const { email, password, name } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            res.status(409).json({ message: 'Email already in use' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            email,
            password: hashedPassword,
            name,
        });
        await newUser.save();
        req.session.user = newUser.id;
        res.send('Registration successful');
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
export default router;
