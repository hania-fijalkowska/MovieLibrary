const express = require('express');
const verifyToken = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');
const db = require('../config/db');

const router = express.Router();

// get all genres in the database
router.get('/', async (req, res) => {
    try {
        const query = `SELECT DISTINCT genre FROM Genre`;
        const [rows] = await db.execute(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch genres.' });
    }
});

// get all genres for a movie
router.get('/:movieId', async (req, res) => {
    const { movieId } = req.params;

    try {
        const query = `SELECT genre FROM Genre WHERE movie_id = ?`;
        const [rows] = await db.execute(query, [movieId]);
        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch genres for movie.' });
    }
});

// get all movies for a specific genre
router.get('/movies/:genre', async (req, res) => {
    const { genre } = req.params;

    try {
        const query = `
            SELECT m.movie_id, m.title, m.synopsis, m.rating 
            FROM Movie m
            JOIN Genre g ON m.movie_id = g.movie_id
            WHERE g.genre = ?;
        `;
        const [rows] = await db.execute(query, [genre]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'No movies found for the specified genre.' });
        }

        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch movies for the specified genre.' });
    }
});

// add a genre to a movie (moderators only)
router.post('/add', verifyToken, checkRole('moderator'), async (req, res) => {
    const { movieId, genre } = req.body;

    if (!movieId || !genre) {
        return res.status(400).json({ message: 'Movie ID and genre are required.' });
    }

    try {
        const query = `INSERT INTO Genre (movie_id, genre) VALUES (?, ?)`;
        await db.execute(query, [movieId, genre]);
        res.status(200).json({ message: 'Genre added to movie successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to add genre to movie.' });
    }
});

// update movie genre
router.put('/update', verifyToken, checkRole('moderator'), async (req, res) => {
    const { movieId, oldGenre, newGenre } = req.body;

    if (!movieId || !oldGenre || !newGenre) {
        return res.status(400).json({ message: 'Movie ID, old genre, and new genre are required.' });
    }

    try {
        const query = `UPDATE Genre SET genre = ? WHERE movie_id = ? AND genre = ?`;
        const [result] = await db.execute(query, [newGenre, movieId, oldGenre]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Genre not found for the specified movie.' });
        }

        res.status(200).json({ message: 'Genre updated successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update genre.' });
    }
});

// delete a genre from a movie (moderators only)
router.delete('/delete', verifyToken, checkRole('moderator'), async (req, res) => {
    const { movieId, genre } = req.body;

    if (!movieId || !genre) {
        return res.status(400).json({ message: 'Movie ID and genre are required.' });
    }

    try {
        const query = `DELETE FROM Genre WHERE movie_id = ? AND genre = ?`;
        await db.execute(query, [movieId, genre]);
        res.status(200).json({ message: 'Genre removed from movie successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to remove genre from movie.' });
    }
});


module.exports = router;