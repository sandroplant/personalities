const express = require('express');
const router = express.Router();
const { MongoClient, ObjectId } = require('mongodb');

// MongoDB connection
const uri = "mongodb+srv://sandroplant:xelosani1@personalities.ruznq.mongodb.net/?retryWrites=true&w=majority&appName=Personalities";
const client = new MongoClient(uri);
const dbName = "personalities";
const collectionName = "profiles";

async function getCollection() {
    if (!client.isConnected()) await client.connect();
    const db = client.db(dbName);
    return db.collection(collectionName);
}

// Get profile
router.get('/:id', async (req, res) => {
    try {
        const collection = await getCollection();
        const profile = await collection.findOne({ _id: new ObjectId(req.params.id) });
        if (profile) {
            res.json(profile);
        } else {
            res.status(404).json({ message: 'Profile not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create or update profile
router.post('/', async (req, res) => {
    try {
        const collection = await getCollection();
        const { _id, ...profileData } = req.body;
        if (_id) {
            await collection.updateOne({ _id: new ObjectId(_id) }, { $set: profileData }, { upsert: true });
            res.json({ message: 'Profile updated' });
        } else {
            const result = await collection.insertOne(profileData);
            res.json({ message: 'Profile created', profileId: result.insertedId });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
