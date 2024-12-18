const express = require('express');
const verifyToken = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');
const db = require('../config/db');

const router = express.Router();

// get a person's details by ID
router.get('/:personId', async (req, res) => {
    const { personId } = req.params;

    if (!personId || isNaN(personId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid person ID.'
        });
    }

    try {
        const query = `SELECT * FROM Person WHERE person_id = ?`;
        const [rows] = await db.execute(query, [personId]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Person not found.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Person details: ',
            data: rows[0]
        });

    } catch (error) {
        console.error('Error fetching person details: ', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch person details.'
        });
    }
});

// add a new person (moderators only)
router.post('/add', verifyToken, checkRole('moderator'), async (req, res) => {
    const { firstName, lastName, gender, birthYear, birthCountry } = req.body;

    if (!firstName || !lastName || !gender || !birthYear || !birthCountry) {
        return res.status(400).json({
            success: false,
            message: 'All fields are required.'
        });
    }

    try {
        const query = `
            INSERT INTO Person (first_name, last_name, gender, birth_year, birth_country)
            VALUES (?, ?, ?, ?, ?);
        `;

        await db.execute(query, [firstName, lastName, gender, birthYear, birthCountry]);
        
        res.status(200).json({
            success: true,
            message: 'Person added successfully!'
        });

    } catch (error) {
        console.error('Error adding a new person: ', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add person.'
        });
    }
});

// edit a person's details (moderators only)
router.put('/edit/:personId', verifyToken, checkRole('moderator'), async (req, res) => {
    const { personId } = req.params;
    const { firstName, lastName, gender, birthYear, birthCountry } = req.body;

    if (!personId || isNaN(personId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid person ID.'
        });
    }

    if (!firstName || !lastName || !gender || !birthYear || !birthCountry) {
        return res.status(400).json({
            succcess: false,
            message: 'All fields are required.'
        });
    }

    try {
        const query = `
            UPDATE Person
            SET first_name = ?, last_name = ?, gender = ?, birth_year = ?, birth_country = ?
            WHERE person_id = ?;
        `;

        await db.execute(query, [firstName, lastName, gender, birthYear, birthCountry, personId]);

        res.status(200).json({
            success: true,
            message: 'Person updated successfully!'
        });

    } catch (error) {
        console.error('Error updating a person: ', error);
        res.status(500).json({ message: 'Failed to update person.' });
    }
});

// delete a person (moderators only)
router.delete('/delete/:personId', verifyToken, checkRole('moderator'), async (req, res) => {
    const { personId } = req.params;

    if (!personId || isNaN(personId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid person ID.'
        });
    }

    try {
        const query = `DELETE FROM Person WHERE person_id = ?`;
        await db.execute(query, [personId]);

        res.status(200).json({
            success: true,
            message: 'Person deleted successfully!'
        });

    } catch (error) {
        console.error('Error deleting a person: ', error);
        res.status(500).json({ message: 'Failed to delete person.' });
    }
});

module.exports = router;