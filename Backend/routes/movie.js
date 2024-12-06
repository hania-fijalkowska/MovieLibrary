const express = require('express');
const verifyToken = require('../middlewares/authMiddleware');
const db = require('../config/db');

const router = express.Router();

// get all movies
router.get('/', async (req, res) => {
    try {
        const [movies] = await db.execute('SELECT * FROM Movie');
        res.status(200).json(movies);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch movies.' });
    }
});

// add a new movie (moderators only)
router.post('/', verifyToken, async (req, res) => {
    const { title, episodes, synopsis, rating } = req.body;

    if (req.user.access_level === 'moderator') {
        return res.status(403).json({ message: 'Access denied. Moderators only.' });
    }

    try {
        const query = `
            INSERT INTO Movie (title, episodes, synopsis, rating)
            VALUES (?, ?, ?, ?)
        `;
        await db.execute(query, [title, episodes || 1, synopsis, rating || null]);
        res.status(201).json({ message: 'Movie added successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to add movie.' });
    }
});

module.exports = router;