const express = require('express');
const verifyToken = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');
const db = require('../config/db');

const router = express.Router();

// add or update review for a movie
router.post('/:movieId', verifyToken, checkRole('user'), async (req, res) => {
    const movieId = Number(req.params.movieId);
    const { review } = req.body; // review up to 200 words

    if (!movieId || isNaN(movieId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid movie ID.'
        });
    }

    if (!review || review.trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'Review cannot be empty.'
        });
    }
    
    const reviewWords = review.trim().split(/\s+/); // split by whitespace
    if (reviewWords.length > 200) {
        return res.status(400).json({
            success: false,
            message: 'Review must be less than or equal to 200 words.'
        });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [movieExists] = await connection.execute('SELECT 1 FROM Movie WHERE movie_id = ?', [movieId]);
        if (!movieExists.length) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Movie not found.',
            });
        }

        // insert or update review (if provided)
        const query = `
            INSERT INTO Review (user_id, movie_id, review)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE review = ?;
        `;

        const [result] = await connection.execute(query, [req.user.user_id, movieId, review, review,]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'No movie updated.'
            });
        }

        await connection.commit();

        res.status(200).json({
            success: true,
            message: 'Review added/updated successfully!'
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error adding/updating review:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add/update review.'
        });
    } finally {
        connection.release();
    }
});


// delete a user's review
router.delete('/:movieId', verifyToken, checkRole('user'), async (req, res) => {
    const movieId = Number(req.params.movieId);

    if (!movieId || isNaN(movieId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid movie ID.'
        });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [movieExists] = await connection.execute('SELECT 1 FROM Movie WHERE movie_id = ?', [movieId]);

        if (!movieExists.length) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Movie not found.',
            });
        }
        
        // delete the review from the Review table
        const query = `
            DELETE FROM Review
            WHERE user_id = ? AND movie_id = ?;
        `;
        const [result] = await connection.execute(query, [req.user.user_id, movieId]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'No review found to delete.'
            });
        }

        await connection.commit();

        res.status(200).json({
            success: true,
            message: 'Review deleted successfully!'
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error deleting review:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete review.'
        });
    } finally {
        connection.release(); // release the connection back to the pool
    }
});


// GET: Pobierz wszystkie recenzje dla filmu
router.get('/:movieId', async (req, res) => {
    const movieId = Number(req.params.movieId);

    if (!movieId || isNaN(movieId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid movie ID.'
        });
    }

    const connection = await db.getConnection();
    try {
        // Pobranie wszystkich recenzji dla filmu, posortowanych po movie_id i user_id
        const [reviews] = await connection.execute(
            'SELECT review, user_id FROM Review WHERE movie_id = ? ORDER BY movie_id DESC, user_id DESC',
            [movieId]
        );

        if (!reviews.length) {
            return res.status(404).json({
                success: false,
                message: 'No reviews found for this movie.'
            });
        }

        res.status(200).json({
            success: true,
            reviews
        });

    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reviews.'
        });
    } finally {
        connection.release(); // release the connection back to the pool
    }
});



module.exports = router;