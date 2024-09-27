import express from 'express';
import Message from '../models/Message.js';

const router = express.Router();

// Dummy AI function for responding (replace with actual AI service)
async function getAIResponse(content) {
    return `AI Response to: "${content}"`; // Placeholder for AI response
}

// Send message with optional AI response
router.post('/send', async (req, res) => {
    const { senderId, recipientId, content, includeAI } = req.body;

    try {
        let aiResponse = null;

        if (includeAI) {
            aiResponse = await getAIResponse(content);
        }

        const newMessage = new Message({
            sender: senderId,
            recipient: recipientId,
            content,
            aiResponse,
        });

        await newMessage.save();
        res.status(200).json({
            message: 'Message sent successfully!',
            aiResponse,
        });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Get conversation between two users
router.get('/conversation/:userId1/:userId2', async (req, res) => {
    const { userId1, userId2 } = req.params;

    try {
        const messages = await Message.find({
            $or: [
                { sender: userId1, recipient: userId2 },
                { sender: userId2, recipient: userId1 },
            ],
        }).sort({ timestamp: 1 });

        res.status(200).json(messages);
    } catch (error) {
        console.error('Error retrieving conversation:', error);
        res.status(500).json({ error: 'Failed to retrieve conversation' });
    }
});

// Send mystery message
router.post('/send-mystery', async (req, res) => {
    const { senderId, recipientId, content } = req.body;

    try {
        const newMessage = new Message({
            sender: senderId,
            recipient: recipientId,
            content,
            isMysteryMessage: true, // Mark as mystery message
        });

        await newMessage.save();
        res.status(200).json({ message: 'Mystery message sent successfully!' });
    } catch (error) {
        console.error('Error sending mystery message:', error);
        res.status(500).json({ error: 'Failed to send mystery message' });
    }
});

// Open mystery message and trigger reaction recording
router.get('/open-mystery/:messageId', async (req, res) => {
    const { messageId } = req.params;

    try {
        const message = await Message.findById(messageId);

        if (message.isMysteryMessage) {
            res.json({ message: 'Recording reaction for mystery message!' });
        } else {
            res.status(400).json({ error: 'This is not a mystery message.' });
        }
    } catch (error) {
        console.error('Error opening mystery message:', error);
        res.status(500).json({ error: 'Failed to open mystery message' });
    }
});

// Placeholder for starting a call
router.post('/start-call', (req, res) => {
    const { senderId, recipientId, callType } = req.body; // callType: 'audio' or 'video'

    console.log(
        `Starting a ${callType} call from ${senderId} to ${recipientId}`
    );
    res.json({ message: `Starting a ${callType} call between users.` });
});

// Placeholder for saving a recording
router.post('/save-recording', (req, res) => {
    res.json({ message: 'Recording saved successfully!' });
});

export default router;
