const express = require('express');
const verifyToken = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');
const db = require('../config/db');

const router = express.Router();

// get all movies
router.get('/', async (req, res) => {
    try {
        const [movies] = await db.execute('SELECT * FROM Movie');

        if (!movies.length) {
            return res.status(404).json({ message: 'No movies found.' });
        }

        res.status(200).json(movies);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch movies.' });
    }
});

// get a single movie by title
router.get('/title/:title', async (req, res) => {
    const { title } = req.params; // extract the movie title from the route parameter

    try {
        const query = `SELECT * FROM Movie WHERE title = ?`;
        const [movies] = await db.execute(query, [title]);

        if (movies.length === 0) {
            return res.status(404).json({ message: 'Movie not found.' });
        }

        res.status(200).json(movies[0]); // send the first (and only) movie
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch movie.' });
    }
});


// add a new movie (moderators only) route
router.post('/', verifyToken, checkRole('moderator'), async (req, res) => {
    const { title, episodes, synopsis, rating } = req.body;

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

// edit an existing movie (moderators only) route
router.put('/:movieId', verifyToken, checkRole('moderator'), async (req, res) => {
    const { title, episodes, synopsis, rating } = req.body;
    const { movieId } = req.params; // get movieId from URL params

    try {
        const query = `
            UPDATE Movie 
            SET title = ?, episodes = ?, synopsis = ?, rating = ?
            WHERE movie_id = ?
        `;
        await db.execute(query, [title, episodes, synopsis, rating, movieId]);
        res.status(200).json({ message: 'Movie updated successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update movie.' });
    }
});

// delete a movie (moderators only)
router.delete('/:movieId', verifyToken, checkRole('moderator'), async (req, res) => {
    const { movieId } = req.params; // get movieId from URL params

    try {
        const query = `
            DELETE FROM Movie WHERE movie_id = ?
        `;
        const [result] = await db.execute(query, [movieId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Movie not found.' });
        }

        res.status(200).json({ message: 'Movie deleted successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to delete movie.' });
    }
});

// add rating and review (users only)
router.post('/rating/:movieId', verifyToken, checkRole('user'), async (req, res) => {
    const { movieId } = req.params;
    const { score, review } = req.body; // score between 1 and 10, review up to 200 words

    if (!score || score < 1 || score > 10) {
        return res.status(400).json({ message: 'Rating must be between 1 and 10.' });
    }

    if (review) {
        // split the review into words and check the length
        const reviewWords = review.split(/\s+/); // split by any whitespace (space, tab, newline)
        if (reviewWords.length > 200) {
            return res.status(400).json({ message: 'Review must be less than or equal to 200 words.' });
        }
    }

    try {
        const query = `
            INSERT INTO Rating (user_id, movie_id, score, review)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE score = ?, review = ?;
        `;
        await db.execute(query, [
            req.user.user_id, movieId, score, review, score, review
        ]);

        res.status(200).json({ message: 'Rating and review added successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to add rating and review.' });
    }
});

module.exports = router;