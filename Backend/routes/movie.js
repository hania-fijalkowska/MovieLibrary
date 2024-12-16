const express = require('express');
const verifyToken = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');
const getPaginationParams = require('../utils/pagination');
const db = require('../config/db');

const router = express.Router();



// get all movies
router.get('/', async (req, res) => {
    const { limit, offset, page } = getPaginationParams(req);

    try {
        const query = `SELECT * FROM Movie LIMIT ? OFFSET ?`; // NIE DZIALA LIMIT OFFSET - niepoprawne argumenty, może byc blad wersji mysql
        const [movies] = await db.execute(query, [limit, offset]);


        if (!movies.length) {
            return res.status(404).json({
                success: false,
                message: 'No movies found.'
            });
        }

        res.status(200).json({
            success: true,
            message: "Movies retrieved successfully.",
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
    const { title } = req.params;

    if (!title || title.trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'Title is required.',
        });
    }

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
        console.error('Error fetching a single movie by title', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch movie.'
        });
    }
});


// add a new movie (moderators only)
router.post('/', verifyToken, checkRole('moderator'), async (req, res) => {
    const {title, episodes, synopsis} = req.body;

    if (!title || title.trim() === "") {
        return res.status(400).json({
            success: false,
            message: 'Title is required.'
        });
    }

    // if episodes is not provided or is invalid, set it to 1
    let validEpisodes = 1;
    if(episodes !== undefined){
        if ((isNaN(episodes) || episodes < 1)) {
            return res.status(400).json({
                success: false,
                message: 'Episodes must be a positive integer.'
            });
        }
        validEpisodes = episodes;
    }

    try {
        await db.beginTransaction(); // start a transaction

        const query = `
            INSERT INTO Movie (title, episodes, synopsis)
            VALUES (?, ?, ?)
        `;

        await db.execute(query, [title, validEpisodes, synopsis || null]);

        await db.commit(); // commit transaction

        res.status(201).json({
            success: true,
            message: 'Movie added successfully!'
        });

    } catch (error) {
        await db.rollback(); // rollback transaction in case of error

        console.error('Error adding a new movie:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add movie.' 
        });
    }
});

// edit an existing movie (moderators only) route
router.put('/:movieId', verifyToken, checkRole('moderator'), async (req, res) => {
    const { newTitle, newEpisodes, newSynopsis} = req.body;
    const movieId = Number(req.params.movieId);

    if (!movieId || isNaN(movieId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid movie ID.'
        });
    }

    if (!newTitle || newTitle.trim() === "") {
        return res.status(400).json({
            success: false,
            message: 'Title is required.'
        });
    }

    let validEpisodes = 1;
    if(newEpisodes !== undefined){
        if ((isNaN(newEpisodes) || newEpisodes < 1)) {
            return res.status(400).json({
                success: false,
                message: 'Episodes must be a positive integer.'
            });
        }
        validEpisodes = newEpisodes;
    }


    try {
        await db.beginTransaction(); // start a transaction

        const [existingMovie] = await db.execute('SELECT * FROM Movie WHERE movie_id = ?', [movieId]);

        if (!existingMovie.length) {
            await db.rollback();
            return res.status(404).json({
                success: false,
                message: 'Movie not found.'
            });
        }

        const query = `
            UPDATE Movie 
            SET title = ?, episodes = ?, synopsis = ?
            WHERE movie_id = ?
        `;

        await db.execute(query, [newTitle, validEpisodes, newSynopsis, movieId]);

        await db.commit(); // commit transaction

        res.status(200).json({
            success: true,
            message: 'Movie updated successfully!'
        });

    } catch (error) {
        await db.rollback(); // rollback transaction in case of error

        console.error('Error updating a movie:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update movie.'
        });
    }
});

// delete a movie (moderators only)
router.delete('/:movieId', verifyToken, checkRole('moderator'), async (req, res) => {
    const movieId = Number(req.params.movieId);

    if (!movieId || isNaN(movieId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid movie ID.'
        });
    }

    try {
        await db.beginTransaction(); // start a transaction

        const [existingMovie] = await db.execute('SELECT * FROM Movie WHERE movie_id = ?', [movieId]);

        if (!existingMovie.length) {
            await db.rollback();
            return res.status(404).json({
                success: false,
                message: 'Movie not found.' });
        }

        const query = `
            DELETE FROM Movie WHERE movie_id = ?
        `;

        await db.execute(query, [movieId]);
        
        await db.commit(); // commit transaction

        res.status(200).json({
            success: true,
            message: 'Movie deleted successfully!'
        });

    } catch (error) {
        await db.rollback(); // rollback transaction in case of error

        console.error('Error deleting a movie:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete movie.'
        });
    }
});

module.exports = router;