const express = require('express');
const verifyToken = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');
const db = require('../config/db');

const router = express.Router();

// get all movies
router.get('/', async (req, res) => {
    let page = parseInt(req.query.page) || 1;
    let limit = 10;

    if (page <= 0) page = 1;

    const offset = (page - 1) * limit;

    try {
        const query = 'SELECT * FROM Movie LIMIT ? OFFSET ?';
        const [movies] = await db.execute(query, [limit, offset]);

        if (!movies.length) {
            return res.status(404).json({
                success: false,
                message: 'No movies found.'
            });
        }

        res.status(200).json({
            success: true,
            movies,
            pagination: {
                page: page,
                limit: limit,
            }
        });

    } catch (error) {
        console.error('Error fetching all movies: ', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch movies.'
        });
    }
});

// get a single movie by title
router.get('/title/:title', async (req, res) => {
    const { title } = req.params; // extract the movie title from the route parameter

    try {
        const query = `SELECT * FROM Movie WHERE title = ?`;
        const [movies] = await db.execute(query, [title]);

        if (!movies.length) {
            return res.status(404).json({
                success: false,
                message: 'Movie not found.'
            });
        }

        res.status(200).json({
            success: true,
            movie: movies[0] // send the first (and only) movie
        });

    } catch (error) {
        console.error('Error fetching a single movie by title: ', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch movie.'
        });
    }
});


// add a new movie (moderators only)
router.post('/', verifyToken, checkRole('moderator'), async (req, res) => {
    const {title, episodes, synopsis} = req.body;

    try {
        if (!title || title.trim() === "") {
            return res.status(400).json({
                success: false,
                message: 'Title is required.'
            });
        }

        // if episodes is not provided or is invalid, set it to 1
        let validEpisodes = 1;
        if (episodes && (isNaN(episodes) || episodes <= 0)) {
            return res.status(400).json({
                success: false,
                message: 'Episodes must be a positive integer.'
            });
        } else if (episodes) {
            validEpisodes = episodes;
        }

        const query = `
            INSERT INTO Movie (title, episodes, synopsis)
            VALUES (?, ?, ?)
        `;

        await db.execute(query, [title, validEpisodes, synopsis || null]);

        res.status(201).json({
            success: true,
            message: 'Movie added successfully!'
        });

    } catch (error) {
        console.error('Error adding a new movie:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add movie.' 
        });
    }
});

// edit an existing movie (moderators only) route
router.put('/:movieId', verifyToken, checkRole('moderator'), async (req, res) => {
    const { title, episodes, synopsis} = req.body;
    const { movieId } = req.params; // get movieId from URL params

    try {
        const [existingMovie] = await db.execute('SELECT * FROM Movie WHERE movie_id = ?', [movieId]);

        if (!existingMovie.length) {
            return res.status(404).json({
                success: false,
                message: 'Movie not found.'
            });
        }

        if (!title || title.trim() === "") {
            return res.status(400).json({
                success: false,
                message: 'Title is required.'
            });
        }

        let validEpisodes = 1;
        if (episodes && (isNaN(episodes) || episodes <= 0)) {
            return res.status(400).json({
                success: false,
                message: 'Episodes must be a positive integer.'
            });
        } else if (episodes) {
            validEpisodes = episodes;
        }

        const query = `
            UPDATE Movie 
            SET title = ?, episodes = ?, synopsis = ?
            WHERE movie_id = ?
        `;

        await db.execute(query, [title, validEpisodes, synopsis, movieId]);
        res.status(200).json({
            success: true,
            message: 'Movie updated successfully!'
        });

    } catch (error) {
        console.error('Error updating a movie:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update movie.'
        });
    }
});

// delete a movie (moderators only)
router.delete('/:movieId', verifyToken, checkRole('moderator'), async (req, res) => {
    const { movieId } = req.params;

    try {

        const [existingMovie] = await db.execute('SELECT * FROM Movie WHERE movie_id = ?', [movieId]);

        if (!existingMovie.length) {
            return res.status(404).json({
                success: false,
                message: 'Movie not found.' });
        }

        const query = `
            DELETE FROM Movie WHERE movie_id = ?
        `;

        await db.execute(query, [movieId]);

        res.status(200).json({
            success: true,
            message: 'Movie deleted successfully!'
        });

    } catch (error) {
        console.error('Error deleting a movie:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete movie.'
        });
    }
});

module.exports = router;