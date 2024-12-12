const express = require('express');
const verifyToken = require('../middlewares/authMiddleware');
const db = require('../config/db');

const router = express.Router();


// add or update review for a movie
router.post('/:movieId', verifyToken, async (req, res) => {
    const { movieId } = req.params;
    const { review } = req.body; // review up to 200 words

    if (review) {
        const reviewWords = review.split(/\s+/); // split by whitespace
        if (reviewWords.length > 200) {
            return res.status(400).json({
                success: false,
                message: 'Review must be less than or equal to 200 words.'
            });
        }
    }

    try {
        // start a transaction
        await db.beginTransaction();

        // insert or update review (if provided)
        const reviewQuery = `
            INSERT INTO Review (user_id, movie_id, review)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE review = ?;
        `;
        await db.execute(reviewQuery, [
            req.user.user_id, movieId, review, review,
        ]);

        // commit transaction
        await db.commit();

        res.status(200).json({
            success: true,
            message: 'Review added/updated successfully!'
        });

    } catch (error) {
        // rollback transaction in case of error
        await db.rollback();
        console.error('Error adding/updating review:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add/update review.'
        });
    }
});


// delete a user's review
router.delete('/:movieId', verifyToken, async (req, res) => {
    const { movieId } = req.params;

    try {
        // start a transaction
        await db.beginTransaction();

        // delete the review from the Review table
        const reviewQuery = `
            DELETE FROM Review
            WHERE user_id = ? AND movie_id = ?;
        `;
        const [result] = await db.execute(reviewQuery, [req.user.user_id, movieId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'No review found to delete.'
            });
        }

        // commit transaction
        await db.commit();

        res.status(200).json({
            success: true,
            message: 'Review deleted successfully!'
        });

    } catch (error) {
        // rollback transaction in case of error
        await db.rollback();
        console.error('Error deleting review:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete review.'
        });
    }
});

module.exports = router;