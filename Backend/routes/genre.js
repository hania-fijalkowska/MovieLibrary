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
        const query = `SELECT genre_name FROM Genre LIMIT ? OFFSET ?`;
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
        const query = `
        SELECT g.genre_name
        FROM Genre g
        JOIN Movie_Genre mg ON g.genre_id = mg.genre_id 
        WHERE mg.movie_id = ? LIMIT ? OFFSET ?
        `;

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
            SELECT m.movie_id, m.title, m.synopsis, m.score
            FROM Movie m
            JOIN Movie_Genre mg ON m.movie_id = mg.movie_id
            JOIN Genre g ON mg.genre_id = g.genre_id
            WHERE g.genre_name = ? LIMIT ? OFFSET ?;
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

        const getGenreIdQuery = `
        SELECT genre_id FROM Genre WHERE genre_name = ?
        `;



        const [ genres ] = await db.execute(getGenreIdQuery, [genre]);

        if(!genres.length){
            return res.status(404).json({
                success: false,
                message: 'Genre not found.'
            });
        }

        const genreId = genres[0].genre_id;

        const insertMovieGenreQuery = `
            INSERT INTO Movie_Genre (movie_id, genre_id) VALUES (?, ?)
        `;

        await db.execute(insertMovieGenreQuery, [movieId, genreId]);
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

        const getOldGenreId = `SELECT genre_id FROM Genre WHERE genre_name = ?`;
        const getNewGenreId = `SELECT genre_id FROM Genre WHERE genre_name = ?`;

        const [oldGenreResult] = await db.execute(getOldGenreId, [oldGenre]);
        const [newGenreResult] = await db.execute(getNewGenreId, [newGenre]);

        if (!oldGenreResult.length || !newGenreResult.length) {
            return res.status(404).json({
                success: false,
                message: 'Invalid old or new genre name.',
            });
        }

        const oldGenreId = oldGenreResult[0].genre_id;
        const newGenreId = newGenreResult[0].genre_id;

        const updateGenreQuery = `
        UPDATE Movie_Genre
        SET genre_id = ?
        WHERE movie_id = ? AND genre_id = ?
        `;

        const [result] = await db.execute(updateGenreQuery, [newGenreId, movieId, oldGenreId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Genre not found for the specified movie.',
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

        // resolve genre_id from genre_name
        const genreQuery = `SELECT genre_id FROM Genre WHERE genre_name = ?`;
        const [genreResult] = await db.execute(genreQuery, [genre]);

        if (!genreResult.length) {
            return res.status(404).json({
                success: false,
                message: 'Genre not found.',
            });
        }

        const genreId = genreResult[0].genre_id;

        // Delete the genre association from Movie_Genre
        const deleteQuery = `DELETE FROM Movie_Genre WHERE movie_id = ? AND genre_id = ?`;
        const [deleteResult] = await db.execute(deleteQuery, [movieId, genreId]);

        if (deleteResult.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Genre not associated with the specified movie.',
            });
        }

        await db.commit(); // commit transaction

        res.status(200).json({
            success: true,
            message: 'Genre removed from movie successfully!',
        });

    } catch (error) {
        await db.rollback(); // rollback transaction on error

        console.error('Error deleting genre from movie:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove genre from movie.',
        });
    }
});


module.exports = router;