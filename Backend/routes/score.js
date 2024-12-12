const express = require('express');
const verifyToken = require('../middlewares/authMiddleware');
const db = require('../config/db');

const router = express.Router();

// add or update score for a movie
router.post('/:movieId', verifyToken, async (req, res) => {
    const movieId = Number(req.params.movieId);
    const { score } = req.body; // score between 1 and 10

    if (isNaN(movieId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid movie ID.'
        });
    }

    if (typeof score !== 'number' || score < 1 || score > 10) {
        return res.status(400).json({
            success: false,
            message: 'Score must be a number between 1 and 10.'
        });
    }

    try {
        // start a transaction
        await db.beginTransaction();

        // insert or update score
        const query = `
            INSERT INTO Score (user_id, movie_id, score)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE score = ?;
        `;

        await db.execute(query, [req.user.user_id, movieId, score, score,]);

        // recalculate average rating
        const avgQuery = `
            UPDATE Movie
            SET rating = COALESCE((SELECT AVG(score) FROM Score WHERE movie_id = ?), 0)
            WHERE movie_id = ?;
        `;

        await db.execute(avgQuery, [movieId, movieId]);

        // commit transaction
        await db.commit();

        res.status(200).json({
            success: true,
            message: 'Score added/updated successfully!'
        });

    } catch (error) {
        // rollback transaction in case of error
        await db.rollback();
        console.error('Error adding/updating score:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add/update score.'
        });
    }
});

// delete a user's score
router.delete('/:movieId', verifyToken, async (req, res) => {
    const movieId = Number(req.params.movieId);

    if (isNaN(movieId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid movie ID.'
        });
    }

    try {
        // start a transaction
        await db.beginTransaction();

        // delete the score from the Score table
        const query = `
            DELETE FROM Score
            WHERE user_id = ? AND movie_id = ?;
        `;
        const [result] = await db.execute(query, [req.user.user_id, movieId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'No score found to delete.'
            });
        }

        // recalculate average rating for the movie
        const avgQuery = `
            UPDATE Movie
            SET rating = COALESCE((SELECT AVG(score) FROM Score WHERE movie_id = ?), 0)
            WHERE movie_id = ?;
        `;

        await db.execute(avgQuery, [movieId, movieId]);

        // commit transaction
        await db.commit();

        res.status(200).json({
            success: true,
            message: 'Score deleted successfully!'
        });

    } catch (error) {
        // rollback transaction in case of error
        await db.rollback();
        console.error('Error deleting score:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete score.'
        });
    }
});

module.exports = router;