const express = require('express');
const verifyToken = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');
const getPaginationParams = require('../utils/pagination');
const db = require('../config/db');

const router = express.Router();

// get all cast members for a movie
router.get('/movie/:movieId/cast', async (req, res) => {
    const { movieId } = req.params;

    if (!movieId || isNaN(movieId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid movie ID.'
        });
    }

    try {
        const query = `
            SELECT p.first_name, p.last_name, c.cast_name
            FROM Cast c
            JOIN Person p ON c.person_id = p.person_id
            WHERE c.movie_id = ?
        `;
        const [rows] = await db.execute(query, [movieId]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No cast members found for this movie.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cast: ',
            data: rows
        });

    } catch (error) {
        console.error('Error fetching cast for a movie: ', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch cast for movie.'
        });
    }
});

// get all movies a person has been cast in
router.get('/person/:personId/movies', async (req, res) => {
    const { personId } = req.params; // sprawdzic personId

    if (!personId || isNaN(personId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid person ID.'
        });
    }

    try {
        const query = `
            SELECT m.movie_id, m.title, c.cast_name
            FROM Movie m
            JOIN Cast c ON m.movie_id = c.movie_id
            WHERE c.person_id = ?
        `;

        const [rows] = await db.execute(query, [personId]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No movies found for this person.' });
        }
        res.status(200).json({
            success: true,
            message: 'Movies: ',
            data: rows
        });

    } catch (error) {
        console.error('Error fetching movies for a person: ', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch movies for person.'
        });
    }
});

// add a cast member to a movie (moderators only)
router.post('/add', verifyToken, checkRole('moderator'), async (req, res) => {
    const { movieId, personId, castName } = req.body;

    if (!movieId || isNaN(movieId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid movie ID.'
        });
    }

    if (!personId || isNaN(personId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid person ID.'
        });
    }

    if (!castName) {
        return res.status(400).json({
            success: false,
            message: 'Cast name is required.'
        });
    }

    try {
        const query = `
            INSERT INTO Cast (movie_id, person_id, cast_name)
            VALUES (?, ?, ?)
        `;
        await db.execute(query, [movieId, personId, castName]);

        res.status(200).json({
            success: true,
            message: 'Cast member added successfully!'
        });

    } catch (error) {
        console.error('Error adding cast member for a movie: ', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add cast member.'
        });
    }
});

// edit a cast member's cast name in a movie (moderators only)
router.put('/edit', verifyToken, checkRole('moderator'), async (req, res) => {
    const { movieId, personId, newCastName } = req.body;

    if (!movieId || isNaN(movieId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid movie ID.'
        });
    }

    if (!personId || isNaN(personId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid person ID.'
        });
    }

    if (!newCastName) {
        return res.status(400).json({
            success: false,
            message: 'New cast name is required.'
        });
    }

    try {
        const query = `
            UPDATE Cast
            SET cast_name = ?
            WHERE movie_id = ? AND person_id = ?
        `;
        const [result] = await db.execute(query, [newCastName, movieId, personId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cast member not found for this movie.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cast member cast name updated successfully!'
        });

    } catch (error) {
        console.error('Error editing cast name for a cast member: ', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update cast member.'
        });
    }
});

// delete a cast member from a movie (moderators only)
router.delete('/delete', verifyToken, checkRole('moderator'), async (req, res) => {
    const { movieId, personId } = req.body;

    if (!movieId || isNaN(movieId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid movie ID.'
        });
    }

    if (!personId || isNaN(personId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid person ID.'
        });
    }

    try {
        const query = `
            DELETE FROM Cast
            WHERE movie_id = ? AND person_id = ?
        `;
        const [result] = await db.execute(query, [movieId, personId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cast member not found for this movie.'
            });
        }

        res.status(200).json({ message: 'Cast member removed from movie successfully!' });
    } catch (error) {
        console.error('Error deleting cast member from a movie: ', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove cast member.'
        });
    }
});

module.exports = router;