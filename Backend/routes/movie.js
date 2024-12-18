const express = require('express');
const verifyToken = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');
const getPaginationParams = require('../utils/pagination');
const db = require('../config/db');

const router = express.Router();

// get all movies
router.get('/', async (req, res) => {
    try {
        const query = `SELECT * FROM Movie`;
        const [movies] = await db.execute(query);

        if (!movies.length) {
            return res.status(404).json({
                success: false,
                message: 'No movies found.'
            });
        }

        res.status(200).json({
            success: true,
            message: "Movies retrieved successfully.",
            movies
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
            message: 'Movie: ',
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

// get all ratings and scores for a specific movie
router.get('/ratings/:movieId', async (req, res) => {
    const movieId = Number(req.params.movieId);

    if (!movieId || isNaN(movieId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid movie ID.'
        });
    }

    try {
        const query = `
            SELECT u.username, s.score, r.review
            FROM Movie m
            LEFT JOIN Score s ON m.movie_id = s.movie_id
            LEFT JOIN Review r ON m.movie_id = r.movie_id AND r.user_id = s.user_id
            LEFT JOIN User u ON u.user_id = s.user_id OR u.user_id = r.user_id
            WHERE m.movie_id = ?
        `;

        const [rows] = await db.execute(query, [movieId]);

        res.status(200).json({
            success: true,
            data: rows,
        });

    } catch (error) {
        console.error('Error fetching movie ratings and reviews:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch ratings and reviews.',
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

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const query = `
            INSERT INTO Movie (title, episodes, synopsis)
            VALUES (?, ?, ?)
        `;

        const [result] = await connection.execute(query, [title, validEpisodes, synopsis || null]);

        if (result.affectedRows === 0) {
            await connection.rollback(); // rollback if no rows were affected
            return res.status(404).json({
                success: false,
                message: 'No movie updated.'
            });
        }

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Movie added successfully!'
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error adding a new movie:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add movie.' 
        });
    } finally {
        connection.release(); // release the connection back to the pool
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

    const connection = await db.getConnection(); // get a connection from the pool
    try {
        await connection.beginTransaction(); // start a transaction
        const [existingMovie] = await connection.execute('SELECT * FROM Movie WHERE movie_id = ?', [movieId]);

        if (!existingMovie.length) {
            await connection.rollback();
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

        const [result] = await connection.execute(query, [newTitle, validEpisodes, newSynopsis || null, movieId]);

        if (result.affectedRows === 0) {
            await connection.rollback(); // rollback if no rows were affected
            return res.status(404).json({
                success: false,
                message: 'No movie updated.'
            });
        }

        await connection.commit(); // commit the transaction

        res.status(200).json({
            success: true,
            message: 'Movie updated successfully!'
        });

    } catch (error) {
        await connection.rollback(); // rollback the transaction in case of error
        console.error('Error updating a movie:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update movie.'
        });
    } finally {
        connection.release(); // release the connection back to the pool
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

    const connection = await db.getConnection(); // get a connection from the pool
    try {
        await connection.beginTransaction(); // start a transaction
        const [existingMovie] = await connection.execute('SELECT * FROM Movie WHERE movie_id = ?', [movieId]);

        if (!existingMovie.length) {
            await connection.rollback(); // rollback the transaction if movie not found
            return res.status(404).json({
                success: false,
                message: 'Movie not found.' });
        }

        const query = `
            DELETE FROM Movie WHERE movie_id = ?
        `;

        const [result] = await connection.execute(query, [movieId]);

        if (result.affectedRows === 0) {
            await connection.rollback(); // rollback if no rows were affected
            return res.status(404).json({
                success: false,
                message: 'No movie deleted'
            });
        }

        await connection.commit(); // commit the transaction

        res.status(200).json({
            success: true,
            message: 'Movie deleted successfully!'
        });

    } catch (error) {
        await connection.rollback(); // rollback the transaction in case of error
        console.error('Error deleting a movie:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete movie.'
        });
    } finally {
        connection.release(); // release the connection back to the pool
    }
});

module.exports = router;