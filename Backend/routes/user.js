const express = require('express');
const verifyToken = require('../middlewares/authMiddleware'); // import the middleware
const bcrypt = require('bcryptjs'); // for password hashing
const validator = require('validator'); // for email vaildation

const router = express.Router();
const db = require('../config/db'); // imports the database connection

// get user profile
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const userId = req.user.user_id; // access the user ID from the token

        if (!userId || isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID in token.'
            });
        }

        const query = `
            SELECT user_id, email, username, access_level
            FROM User
            WHERE user_id = ?
        `;

        const [rows] = await db.execute(query, [userId]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        res.status(200).json({
            success: true,
            data: rows[0]
        });

    } catch (error) {
        console.error('Error fetching user profile: ', error);

        res.status(500).json({
            success: false,
            message: 'Failed to fetch user profile.'
        });
    }
});

// edit user profile (username and password only)
router.put('/profile', verifyToken, async (req, res) => {
    const { newUsername, password, newPassword } = req.body;  // expecting the new username and new password

    const userId = req.user.user_id; // access the user ID from the token

    if (!newUsername || !password || !newPassword) {
        return res.status(400).json({
            success: false,
            message: 'New username, current password, and new password are required.',
        });
    }

    // retrieve the user's current data from the database
    try {
        await db.beginTransaction(); // start transaction

        const [user] = await db.execute('SELECT * FROM User WHERE user_id = ?', [userId]);

        if (!user.length) {
            return res.status(404).json({
                success: false,
                message: 'User not found.',
            });
        }

        // check if the provided password matches the current password in the database
        const doesPasswordMatch = await bcrypt.compare(password, user[0].password);
        if (!doesPasswordMatch) {
            await db.rollback();
            return res.status(401).json({
                success: false,
                message: 'Invalid password!'
            });
        }

        // check if the new username is already taken by another user (excluding the current user)
        const [existingUser] = await db.execute(
            'SELECT * FROM User WHERE username = ? AND user_id != ?',
            [newUsername, userId]
        );

        if (existingUser.length > 0) {
            await db.rollback();
            return res.status(409).json({
                success: false,
                message: 'Username already exists.',
            });
        }

        // hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // update the username and password in the database
        const query = `UPDATE User SET username = ?, password = ? WHERE user_id = ?`;
        await db.execute(query, [newUsername, hashedPassword, userId]);

        await db.commit(); // commit transaction

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully.',
        });

    } catch (error) {
        await db.rollback(); // rollback on error
        console.error('Error updating profile:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while updating the profile.',
        });
    }
});

// delete user profile
router.delete('/profile', verifyToken, async (req, res) => {
    try {
        const userId = req.user.user_id; // extract user ID from token

        // check if the user exists
        const [existingUser] = await db.execute(
            'SELECT user_id FROM User WHERE user_id = ?',
            [userId]
        );

        if (existingUser.length === 0) {
            await db.rollback(); // rollback on error
            return res.status(404).json({
                success: false,
                message: 'User not found.',
            });
        }

        // delete the user
        await db.execute('DELETE FROM User WHERE user_id = ?', [userId]);

        await db.commit(); // commit transaction

        res.status(200).json({
            success: true,
            message: 'User profile deleted successfully.',
        });

    } catch (error) {
        await db.rollback(); // rollback on error
        console.error('Error deleting profile:',error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user profile.',
        });
    }
});

// get user reviews and scores - RATINGS (with pagination)
router.get('/profile/ratings', verifyToken, async (req, res) => {
    const userId = req.user.user_id;

    let page = parseInt(req.query.page) || 1;
    let limit = 10;

    if (page <= 0) page = 1;

    const offset = (page - 1) * limit;

    try {
        const query = `
            SELECT r.movie_id, s.score, r.review, m.title 
            FROM Review r
            JOIN Score s ON r.movie_id = s.movie_id AND r.user_id = s.user_id
            JOIN Movie m ON r.movie_id = m.movie_id
            WHERE r.user_id = ?
            LIMIT ? OFFSET ?
        `;

        const [rows] = await db.execute(query, [userId, limit, offset]);

        res.status(200).json({
            success: true,
            data: rows,
            pagination: {
                page: page,
                limit: limit,
            }
        });

    } catch (error) {
        console.error('Error fetching user ratings:',error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch ratings.',
        });
    }
});

module.exports = router;