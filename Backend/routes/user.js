const express = require('express');
const verifyToken = require('../middlewares/authMiddleware'); // import the middleware
const getPaginationParams = require('../utils/pagination');
const bcrypt = require('bcryptjs'); // for password hashing
// const validator = require('validator'); // for email vaildation
const checkRole = require('../middlewares/roleMiddleware'); // Import middleware do sprawdzania roli użytkownika


const router = express.Router();
const db = require('../config/db'); // imports the database connection

// get user profile
router.get('/profile', verifyToken, async (req, res) => {
    const userId = Number(req.user.user_id); // access the user ID from the token

    if (!userId || isNaN(userId)) {
        return res.status(400).json({
        success: false,
        message: 'Invalid user ID in token.'
        });
    }

    try {
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

    const userId = Number(req.user.user_id); // access the user ID from the token

    if (!userId || isNaN(userId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid user ID in token.'
        });
    }

    if (!newUsername || !password || !newPassword) {
        return res.status(400).json({
            success: false,
            message: 'New username, current password, and new password are required.',
        });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long!' });
    }

    try {
        await db.beginTransaction(); // start transaction

        // retrieve the user's current data from the database
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
    const userId = Number(req.user.user_id); // extract user ID from token

        if (!userId || isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID in token.'
            });
        }

    try {
        await db.beginTransaction(); // start transaction

        // attempt to delete the user
        const [ result ] = await db.execute('DELETE FROM User WHERE user_id = ?', [userId]);

        if (result.affectedRows === 0) {
            // no rows were deleted, meaning the user does not exist
            await db.rollback();
            return res.status(404).json({
                success: false,
                message: 'User not found.',
            });
        }

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

// get user reviews and scores (with pagination)
router.get('/profile/ratings', verifyToken, async (req, res) => {
    const userId = Number(req.user.user_id); // extract user ID from token
    const { limit, offset } = getPaginationParams(req);

    if (!userId || isNaN(userId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid user ID in token.'
        });
    }

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


// get users by username or access level
router.get('/admin-view/profile/:filter', verifyToken, async (req, res, next) => {
    const { filter } = req.params;

    // check if the filter is an access level; if yes, require admin role
    const accessLevels = ['admin', 'moderator', 'user'];
    if (accessLevels.includes(filter.toLowerCase())) {
        return checkRole(['admin'])(req, res, next); // Call middleware for admin role
    }

    next(); // if the filter is not an access level, proceed
}, async (req, res) => {
    const { filter } = req.params;

    try {
        let query, params;

        if (['admin', 'moderator', 'user'].includes(filter.toLowerCase())) {
            query = `SELECT user_id, username, email, access_level FROM User WHERE access_level = ?`;
            params = [filter];
        } else {
            query = `SELECT user_id, username, email, access_level FROM User WHERE username = ?`;
            params = [filter];
        }

        const [users] = await db.execute(query, params);

        if (!users.length) {
            return res.status(404).json({
                success: false,
                message: 'No users found.',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Users retrieved successfully.',
            users,
        });
    } catch (error) {
        console.error('Error fetching users by filter:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users.',
        });
    }
});

// delete a user from the database by username, can't delete other admins
router.delete('/profile/:username', verifyToken, checkRole(['admin']), async (req, res) => {
    const { username } = req.params; // get the username from the URL parameters

    try {
        // fetch the details of the user to be deleted
        const queryGetUser = `SELECT user_id, username, email, access_level FROM User WHERE username = ?`;
        const [users] = await db.execute(queryGetUser, [username]);

        // check if the user exists
        if (!users.length) {
            return res.status(404).json({
                success: false,
                message: 'User not found.',
            });
        }

        const userToDelete = users[0];

        // check if the user is an admin
        if (userToDelete.access_level === 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You cannot delete another admin.',
            });
        }

        // delete the user
        const queryDeleteUser = `DELETE FROM User WHERE username = ?`;
        const [result] = await db.execute(queryDeleteUser, [username]);

        if (result.affectedRows === 0) {
            return res.status(500).json({
                success: false,
                message: 'Failed to delete user.',
            });
        }

        res.status(200).json({
            success: true,
            message: `User '${username}' deleted successfully.`,
        });

    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while deleting the user.',
        });
    }
});


module.exports = router;