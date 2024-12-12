const express = require('express');
const verifyToken = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');
const db = require('../config/db');

const router = express.Router();

// get all cast members for a movie
router.get('/movie/:movieId/role', async (req, res) => {
    const { movieId } = req.params;

    try {
        const query = `
            SELECT p.first_name, p.last_name, r.role
            FROM Role r
            JOIN Person p ON r.person_id = p.person_id
            WHERE r.movie_id = ?;
        `;
        const [rows] = await db.execute(query, [movieId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'No cast members found for this movie.' });
        }

        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch cast for movie.' });
    }
});

// get all movies a person has been cast in
router.get('/person/:personId/movies', async (req, res) => {
    const { personId } = req.params;

    try {
        const query = `
            SELECT m.movie_id, m.title, r.role
            FROM Movie m
            JOIN Role r ON m.movie_id = r.movie_id
            WHERE r.person_id = ?;
        `;
        const [rows] = await db.execute(query, [personId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'No movies found for this person.' });
        }

        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch movies for person.' });
    }
});

// add a cast member to a movie (moderators only)
router.post('/add', verifyToken, checkRole('moderator'), async (req, res) => {
    const { movieId, personId, role } = req.body;

    if (!movieId || !personId || !role) {
        return res.status(400).json({ message: 'Movie ID, Person ID, and Role are required.' });
    }

    try {
        const query = `
            INSERT INTO Role (movie_id, person_id, role)
            VALUES (?, ?, ?);
        `;
        await db.execute(query, [movieId, personId, role]);
        res.status(200).json({ message: 'Cast member added successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to add cast member.' });
    }
});

// edit a cast member's role in a movie (moderators only)
router.put('/edit', verifyToken, checkRole('moderator'), async (req, res) => {
    const { movieId, personId, newRole } = req.body;

    if (!movieId || !personId || !newRole) {
        return res.status(400).json({ message: 'Movie ID, Person ID, and new Role are required.' });
    }

    try {
        const query = `
            UPDATE Role
            SET role = ?
            WHERE movie_id = ? AND person_id = ?;
        `;
        const [result] = await db.execute(query, [newRole, movieId, personId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Cast member not found for this movie.' });
        }

        res.status(200).json({ message: 'Cast member role updated successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update cast member.' });
    }
});

// delete a cast member from a movie (moderators only)
router.delete('/delete', verifyToken, checkRole('moderator'), async (req, res) => {
    const { movieId, personId } = req.body;

    if (!movieId || !personId) {
        return res.status(400).json({ message: 'Movie ID and Person ID are required.' });
    }

    try {
        const query = `
            DELETE FROM Role
            WHERE movie_id = ? AND person_id = ?;
        `;
        const [result] = await db.execute(query, [movieId, personId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Cast member not found for this movie.' });
        }

        res.status(200).json({ message: 'Cast member removed from movie successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to remove cast member.' });
    }
});

module.exports = router;