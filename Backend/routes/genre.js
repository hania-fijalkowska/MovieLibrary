const express = require('express');
const verifyToken = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');
const getPaginationParams = require('../utils/pagination');
const db = require('../config/db');

const router = express.Router();

// get all genres in the database
router.get('/', async (req, res) => {
    try {
        const query = `SELECT genre_name FROM Genre`;
        const [rows] = await db.execute(query);

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

    if (!movieId || isNaN(movieId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid movie ID.'
        });
    }

    try {
        const query = `
        SELECT g.genre_name
        FROM Genre g
        JOIN Movie_Genre mg ON g.genre_id = mg.genre_id 
        WHERE mg.movie_id = ?
        `;

        const [rows] = await db.execute(query, [movieId]);

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

// get all movies for a genre
router.get('/movies/:genreId', async (req, res) => {
    const genreId = Number(req.params.genreId);

    if (!genreId || isNaN(genreId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid genre ID.'
        });
    }

    try {
        const query = `
            SELECT m.title, m.score
            FROM Movie m
            JOIN Movie_Genre mg ON m.movie_id = mg.movie_id
            JOIN Genre g ON mg.genre_id = g.genre_id
            WHERE g.genre_id = ?
        `;
        const [rows] = await db.execute(query, [genreId]);

        if (rows.length === 0) {
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

// add a new genre (moderators only)
router.post('/add-genre', verifyToken, checkRole('moderator'), async (req,res) => {
    const {genreName} = req.body;

    if (!genreName || genreName.trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'Genre name is required.'
        });
    }

    const connection = await db.getConnection();
    try{
        await connection.beginTransaction();

        const [existingGenre] = await connection.execute(
            'SELECT * FROM Genre WHERE genre_name = ?',
            [genreName.trim()]
        );

        if (existingGenre.length > 0) {
            await connection.rollback();
            return res.status(409).json({
                success: false,
                message: 'Genre already exists.'
            });
        }
        
        const query = `
            INSERT INTO Genre (genre_name)
            VALUES (?)
        `;

        await connection.execute(query, [genreName.trim()]);

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Genre added successfully!'
        });

    } catch {
        await connection.rollback();
        console.error('Error adding new genre', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to add new genre.'
        });
    } finally {
        connection.release(); // release the connection back to the pool
    }
});

// delete a genre from Genre table (moderators only)
router.delete('/delete-genre', verifyToken, checkRole('moderator'), async (req, res) => {
    const { genreId } = req.body;

    // Validate input genreId
    if (!genreId || isNaN(genreId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid genre ID.'
        });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const genreQuery = `SELECT * FROM Genre WHERE genre_id = ?`;
        const [genreResult] = await connection.execute(genreQuery, [genreId]);

        if (!genreResult.length) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Genre not found.'
            });
        }

        const deleteQuery = `DELETE FROM Genre WHERE genre_id = ?`;
        const [deleteResult] = await connection.execute(deleteQuery, [genreId]);

        if (deleteResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Failed to delete genre.'
            });
        }

        await connection.commit();

        res.status(200).json({
            success: true,
            message: 'Genre deleted successfully!'
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error deleting genre from Genre table:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete genre.'
        });
    } finally {
        connection.release(); // release the connection back to the pool
    }
});

// add a genre to a movie (moderators only)
router.post('/add', verifyToken, checkRole('moderator'), async (req, res) => {
    const { movieId, genreId } = req.body;

    if (!movieId || isNaN(movieId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid movie ID.'
        });
    }
    
    if (!genreId || isNaN(genreId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid genre ID.'
        });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [movieExists] = await connection.execute('SELECT * FROM Movie WHERE movie_id = ?', [movieId]);

        if (!movieExists.length) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Movie not found.'
            });
        }

        const [genreExists] = await connection.execute('SELECT * FROM Genre WHERE genre_id = ?', [genreId]);

        if (!genreExists.length) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Genre not found.'
            });
        }

        // check if the genre is already associated with the movie
        const [existingAssociation] = await connection.execute(
            'SELECT * FROM Movie_Genre WHERE movie_id = ? AND genre_id = ?',
            [movieId, genreId]
        );

        if (existingAssociation.length > 0) {
            await connection.rollback();
            return res.status(409).json({
                success: false,
                message: 'This genre is already associated with the movie.'
            });
        }

        const insertQuery = `
            INSERT INTO Movie_Genre (movie_id, genre_id) VALUES (?, ?)
        `;

        const [result] = await connection.execute(insertQuery, [movieId, genreId]);

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
            message: 'Genre added to movie successfully.'
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error adding genre to a movie: ', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add genre to movie.'
        });
    } finally {
        connection.release(); // release the connection back to the pool
    }
});

// update movie genre
router.put('/update', verifyToken, checkRole('moderator'), async (req, res) => {
    const { movieId, oldGenreId, newGenreId } = req.body;

    if (!movieId || isNaN(movieId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid movie ID.'
        });
    }

    if (!oldGenreId || isNaN(oldGenreId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid old genre ID.'
        });
    }

    if (!newGenreId || isNaN(newGenreId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid new genre ID.'
        });
    }

    if (oldGenreId === newGenreId) {
        return res.status(400).json({
            success: false,
            message: 'Old genre and new genre IDs cannot be the same.'
        });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const movieGenreQuery = `SELECT * FROM Movie_Genre WHERE movie_id = ? AND genre_id = ?`;
        const [movieGenreResult] = await connection.execute(movieGenreQuery, [movieId, oldGenreId]);

        if (!movieGenreResult.length) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Movie-Genre association not found.',
            });
        }

        const updateGenreQuery = `
        UPDATE Movie_Genre
        SET genre_id = ?
        WHERE movie_id = ? AND genre_id = ?
        `;

        const [result] = await connection.execute(updateGenreQuery, [newGenreId, movieId, oldGenreId]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Failed to update genre for a movie',
            });
        }

        await connection.commit();

        res.status(200).json({
            success: true,
            message: 'Genre updated successfully!'
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error updating movie genre: ', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update genre.'
        });
    } finally {
        connection.release();
    }
});

// delete a genre from a movie (moderators only)
router.delete('/delete', verifyToken, checkRole('moderator'), async (req, res) => {
    const { movieId, genreId } = req.body;

    if (!movieId || isNaN(movieId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid movie ID.'
        });
    }

    if (!genreId || isNaN(genreId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid genre ID.'
        });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const movieGenreQuery = `SELECT * FROM Movie_Genre WHERE genre_id = ? AND movie_id = ?`;
        const [movieGenreResult] = await connection.execute(movieGenreQuery, [genreId, movieId]);

        if (!movieGenreResult.length) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Movie-Genre association not found.',
            });
        }

        // delete the genre association from Movie_Genre
        const deleteQuery = `DELETE FROM Movie_Genre WHERE movie_id = ? AND genre_id = ?`;
        const [deleteResult] = await connection.execute(deleteQuery, [movieId, genreId]);

        if (deleteResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Failed to remove genre from a movie.',
            });
        }

        await connection.commit();

        res.status(200).json({
            success: true,
            message: 'Genre removed from movie successfully!',
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error deleting genre from movie:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete genre from movie.',
        });
    } finally {
        connection.release(); // release the connection back to the pool
    }
});


module.exports = router;