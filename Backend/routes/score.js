const express = require('express');
const verifyToken = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');
const db = require('../config/db');

const router = express.Router();

// add or update score for a movie
router.post('/:movieId', verifyToken, checkRole('user'), async (req, res) => {
    const movieId = Number(req.params.movieId);
    const { score } = req.body; // score between 1 and 10

    if (!movieId || isNaN(movieId)) {
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

    const connection = await db.getConnection(); // get a connection from the pool
    try {
        await connection.beginTransaction(); // start a transaction

        // check if movieId exists in the Movie table
        const [movieCheck] = await connection.execute('SELECT movie_id FROM Movie WHERE movie_id = ?', [movieId]);
        if (!movieCheck.length) {
            await connection.rollback(); // rollback the transaction if movie not found
            return res.status(404).json({
                success: false,
                message: 'Movie not found.'
            });
        }

        // insert or update score
        const scoreQuery = `
            INSERT INTO Score (user_id, movie_id, score)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE score = ?;
        `;

        await connection.execute(scoreQuery, [req.user.user_id, movieId, score, score,]);

        // recalculate average rating
        const avgQuery = `
            UPDATE Movie
            SET score = COALESCE((SELECT AVG(score) FROM Score WHERE movie_id = ?), 0)
            WHERE movie_id = ?;
        `;

        await connection.execute(avgQuery, [movieId, movieId]);

        await connection.commit(); // commit the transaction

        res.status(200).json({
            success: true,
            message: 'Score added/updated successfully!'
        });

    } catch (error) {
        await connection.rollback(); // rollback the transaction in case of error
        console.error('Error adding/updating score:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add/update score.'
        });
    } finally {
        connection.release(); // release the connection back to the pool
    }
});

// delete a user's score
router.delete('/:movieId', verifyToken, checkRole('user'), async (req, res) => {
    const movieId = Number(req.params.movieId);

    if (!movieId || isNaN(movieId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid movie ID.'
        });
    }

    const connection = await db.getConnection(); // get a connection from the pool
    try {
        await connection.beginTransaction(); // start a transaction

        // check if movieId exists in the Movie table
        const [movieCheck] = await connection.execute('SELECT movie_id FROM Movie WHERE movie_id = ?', [movieId]);
        if (!movieCheck.length) {
            await connection.rollback(); // rollback the transaction if movie not found
            return res.status(404).json({
                success: false,
                message: 'Movie not found.'
            });
        }

        // delete the score from the Score table
        const query = `
            DELETE FROM Score
            WHERE user_id = ? AND movie_id = ?;
        `;
        const [result] = await connection.execute(query, [req.user.user_id, movieId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'No score found to delete.'
            });
        }

        // recalculate average rating for the movie
        const avgQuery = `
            UPDATE Movie
            SET score = COALESCE((SELECT AVG(score) FROM Score WHERE movie_id = ?), 0)
            WHERE movie_id = ?;
        `;

        await connection.execute(avgQuery, [movieId, movieId]);

        await connection.commit(); // commit the transaction

        res.status(200).json({
            success: true,
            message: 'Score deleted successfully!'
        });

    } catch (error) {
        await connection.rollback(); // rollback the transaction in case of error
        console.error('Error deleting score:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete score.'
        });
    }
});

module.exports = router;