const express = require('express');
const verifyToken = require('../middlewares/authMiddleware'); // import the middleware
const router = express.Router();

const db = require('../config/db'); // imports the database connection

router.get('/profile', verifyToken, async (req, res) => {
    try {
        const userId = req.user.user_id; // access the user ID from the token
        const query = `SELECT user_id, email, username, access_level FROM User WHERE user_id = ?`;
        const [rows] = await db.execute(query, [userId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json(rows[0]); // send user details
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch user profile.' });
    }
});

module.exports = router;