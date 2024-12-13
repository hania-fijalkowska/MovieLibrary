const express = require('express');
const verifyToken = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');
const getPaginationParams = require('../utils/pagination');
const db = require('../config/db');

const router = express.Router();

// get all genres in the database
router.get('/', async (req, res) => {
    const { limit, offset } = getPaginationParams(req);

    try {
        const query = `SELECT DISTINCT genre FROM Genre LIMIT ? OFFSET ?`;
        const [rows] = await db.execute(query, [limit, offset]);

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: 'No genres found.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'All genres: ',
            data: rows
        });

    } catch (error) {
        console.error('Error fetching all genres: ', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch all genres.'
        });
    }
});

// get all genres for a movie
router.get('/:movieId', async (req, res) => {
    const movieId = Number(req.params.movieId);

    const { limit, offset } = getPaginationParams(req);

    if (!movieId || isNaN(movieId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid movie ID.'
        });
    }

    try {
        const query = `SELECT genre FROM Genre WHERE movie_id = ? LIMIT ? OFFSET ?`;
        const [rows] = await db.execute(query, [movieId, limit, offset]);

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: 'No genres found for the specified movie.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'All genres: ',
            data: rows
        });

    } catch (error) {
        console.error('Error fetching genres for a movie: ', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch genres for a movie.'
        });
    }
});

// get all movies for a specific genre
router.get('/movies/:genre', async (req, res) => {
    const { genre } = req.params;

    const { limit, offset } = getPaginationParams(req);

    try {
        const query = `
            SELECT m.movie_id, m.title, m.synopsis, m.rating 
            FROM Movie m
            JOIN Genre g ON m.movie_id = g.movie_id
            WHERE g.genre = ? LIMIT ? OFFSET ?;
        `;
        const [rows] = await db.execute(query, [genre, limit, offset]);

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: 'No movies found for the specified genre.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'All movies: ',
            data: rows
        });

    } catch (error) {
        console.error('Error fetching movies for a genre: ', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch movies for a genre.'
        });
    }
});

// add a genre to a movie (moderators only)
router.post('/add', verifyToken, checkRole('moderator'), async (req, res) => {
    const { movieId, genre } = req.body;

    if (!movieId || isNaN(movieId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid movie ID.'
        });
    }
    
    if (!genre) {
        return res.status(400).json({
            success: false,
            message: 'Genre is required.'
        });
    }

    try {
        await db.beginTransaction(); // start a transaction
        const query = `INSERT INTO Genre (movie_id, genre) VALUES (?, ?)`;

        await db.execute(query, [movieId, genre]);
        await db.commit(); // commit transaction

        res.status(200).json({
            success: true,
            message: 'Genre added to movie successfully!'
        });

    } catch (error) {
        await db.rollback(); // rollback transaction in case of error

        console.error('Error adding a movie: ', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add genre to movie.'
        });
    }
});

// update movie genre
router.put('/update', verifyToken, checkRole('moderator'), async (req, res) => {
    const { movieId, oldGenre, newGenre } = req.body;

    if (!movieId || isNaN(movieId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid movie ID.'
        });
    }

    if (!oldGenre || !newGenre) {
        return res.status(400).json({
            success: false,
            message: 'Old genre and new genre are required.'
        });
    }

    try {
        await db.beginTransaction(); // start a transaction
        const query = `UPDATE Genre SET genre = ? WHERE movie_id = ? AND genre = ?`;
        const [result] = await db.execute(query, [newGenre, movieId, oldGenre]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Genre not found for the specified movie.'
            });
        }

        await db.commit(); // commit transaction

        res.status(200).json({
            success: true,
            message: 'Genre updated successfully!'
        });

    } catch (error) {
        await db.rollback(); // rollback transaction in case of error

        console.error('Error updating movie genre: ', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update genre.'
        });
    }
});

// delete a genre from a movie (moderators only)
router.delete('/delete', verifyToken, checkRole('moderator'), async (req, res) => {
    const { movieId, genre } = req.body;

    if (!movieId || isNaN(movieId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid movie ID.'
        });
    }

    if (!genre) {
        return res.status(400).json({
            success: false,
            message: 'Genre is required.'
        });
    }

    try {
        await db.beginTransaction(); // start a transaction
        const query = `DELETE FROM Genre WHERE movie_id = ? AND genre = ?`;
        await db.execute(query, [movieId, genre]);
        await db.commit(); // commit transaction

        res.status(200).json({
            success: true,
            message: 'Genre removed from movie successfully!'
        });

    } catch (error) {
        await db.rollback(); // rollback transaction in case of error
        console.error('Error deleting genre from movie: ', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove genre from movie.'
        });
    }
});


module.exports = router;