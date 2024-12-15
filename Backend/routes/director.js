const express = require('express');
const verifyToken = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');
const db = require('../config/db');

const router = express.Router();

// get all directors for a specific movie
router.get('/movie/:movieId', async (req, res) => {
    const { movieId } = req.params;

    if (!movieId || isNaN(movieId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid movie ID.'
        });
    }

    try {
        const query = `
            SELECT p.person_id, p.first_name, p.last_name, p.gender, p.birth_year, p.birth_country 
            FROM Director d
            JOIN Person p ON d.person_id = p.person_id
            WHERE d.movie_id = ?;
        `;
        const [rows] = await db.execute(query, [movieId]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No directors found for this movie.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Directors: ',
            data: rows
        });

    } catch (error) {
        console.error('Error fetching directors for the movie: ', error);
        res.status(500).json({
            succcess: false,
            message: 'Failed to fetch directors for the movie.'
        });
    }
});

// get all movies for a specific director
router.get('/person/:personId', async (req, res) => {
    const { personId } = req.params;

    if (!personId || isNaN(personId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid person ID.'
        });
    }

    try {
        const query = `
            SELECT m.movie_id, m.title, m.synopsis, m.rating 
            FROM Director d
            JOIN Movie m ON d.movie_id = m.movie_id
            WHERE d.person_id = ?;
        `;
        const [rows] = await db.execute(query, [personId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'No movies found for this director.' });
        }

        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch movies for the director.' });
    }
});

// add a director to a movie (moderators only)
router.post('/add', verifyToken, checkRole('moderator'), async (req, res) => {
    const { movieId, personId } = req.body;

    if (!movieId || !personId) {
        return res.status(400).json({ message: 'Movie ID and Person ID are required.' });
    }

    try {
        const query = `INSERT INTO Director (movie_id, person_id) VALUES (?, ?)`;
        await db.execute(query, [movieId, personId]);
        res.status(201).json({ message: 'Director added to movie successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to add director to movie.' });
    }
});

// remove a director from a movie (moderators only)
router.delete('/remove', verifyToken, checkRole('moderator'), async (req, res) => {
    const { movieId, personId } = req.body;

    if (!movieId || !personId) {
        return res.status(400).json({ message: 'Movie ID and Person ID are required.' });
    }

    try {
        const query = `DELETE FROM Director WHERE movie_id = ? AND person_id = ?`;
        await db.execute(query, [movieId, personId]);
        res.status(200).json({ message: 'Director removed from movie successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to remove director from movie.' });
    }
});

module.exports = router;
