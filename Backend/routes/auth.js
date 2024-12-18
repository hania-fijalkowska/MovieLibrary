const express = require('express'); // for creating a web server and handling routing
const bcrypt = require('bcryptjs'); // for password hashing
const jwt = require('jsonwebtoken'); // for token generation
const validator = require('validator'); // for input validation
const verifyToken = require('../middlewares/authMiddleware'); // for token verification
const checkRole = require('../middlewares/roleMiddleware'); // for role verification
const db = require('../config/db'); // imports the database connection
const generateToken = require('../utils/generateToken');
const { verifyAndBlacklistToken } = require('../middlewares/blacklistMiddleware');

require('dotenv').config(); // loads environment variables

const router = express.Router();

// user registration route
router.post('/register', async (req, res) => { // defines POST route at /api/register
    const {email, username, password} = req.body; // extracts email, username, password from the request body

    const restrictedUsernames = ['admin', 'moderator', 'user']; // restricted usernames

    if (!email || !username || !password){
        return res.status(400).json({message: 'Email, username and password are required!'});
    }

    // check if the username is in the restricted list
    if (restrictedUsernames.includes(username.toLowerCase())) {
        return res.status(400).json({ message: 'Username cannot be "admin", "moderator", or "user".' });
    }

    if (!validator.isEmail(email)) {
        return res.status(400).json({ message: 'Invalid email format!' });
    }

    if (password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long!' });
    }

    try {
        // checks if the email or username already exists
        const [existingUser] = await db.execute(
            'SELECT * FROM User WHERE email = ? OR username = ?',
            [email, username]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({ message: 'Email or username already exists.' });
        }

        const hashed_password = await bcrypt.hash(password, 10); // hashes the password - salt factor of ten

        // insert user into database
        const query = `
            INSERT INTO User (email, username, password, access_level)
            VALUES (?, ?, ?, 'user')
        `;

        // execute the query with provided parameters
        await db.execute(query, [email, username, hashed_password]);
        
        res.status(201).json({
            success: true,
            message: 'User registered successfully!'
        });

    } catch (error) {
        console.error('Registration error: ', error);
        res.status(500).json({
            success: false,
            message: 'Error registering user.'
        });
    }
});


// user login route
router.post('/login', async (req, res) => {
    const {email, password} = req.body;

    if(! email || !password){
        return res.status(400).json({
            success: false,
            message: 'Email and password are required!'
        });
    }

    if (!validator.isEmail(email)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid email format!'
        });
    }

    try {
        const query = `SELECT * FROM User WHERE email = ?`;
        const[rows] = await db.execute(query, [email]);

        if (rows.length === 0){
            return res.status(401).json({
                success: false,
                message: 'Invalid email!'
            });
        }

        const user = rows[0];

        // compare passwords
        const doesPasswordMatch = await bcrypt.compare(password, user.password);
        if (!doesPasswordMatch){
            return res.status(401).json({
                success: false,
                message: 'Invalid password!'
            });
        }

        const token = generateToken(user);

        res.status(200).json({
            success: true,
            message: 'Login successful! :)', token
        });

    }
    catch (error) {
        console.error('Login error: ', error);
        res.status(500).json({
            success: false,
            message: 'Error logging in. :('
        })
    }
});

router.post('/logout', verifyAndBlacklistToken, (req, res) => {
    res.status(200).json({ success: true, message: 'Logged out successfully.' });
});

// register a new admin or moderator
router.post('/register/admin', verifyToken, checkRole(['admin']), async (req, res) => {
    const { email, username, password, role } = req.body;

    const restrictedUsernames = ['admin', 'moderator', 'user']; // restricted usernames

    if (!email || !username || !password || !role) {
        return res.status(400).json({ message: 'Email, username, password, and role are required!' });
    }

    // check if the username is in the restricted list
    if (restrictedUsernames.includes(username.toLowerCase())) {
        return res.status(400).json({ message: 'Username cannot be "admin", "moderator", or "user".' });
    }

    const allowedRoles = ['admin', 'moderator'];
    if (!allowedRoles.includes(role)) {
        return res.status(400).json({ message: 'Invalid role. Allowed roles: admin, moderator.' });
    }

    if (!validator.isEmail(email)) {
        return res.status(400).json({ message: 'Invalid email format!' });
    }

    if (password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long!' });
    }

    try {
        // check if a user with the provided email or username already exists
        const [existingUser] = await db.execute(
            'SELECT * FROM User WHERE email = ? OR username = ?',
            [email, username]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({ message: 'Email or username already exists.' });
        }

        const hashed_password = await bcrypt.hash(password, 10);

        // add the new user (admin/moderator) to the database
        const query = `
            INSERT INTO User (email, username, password, access_level)
            VALUES (?, ?, ?, ?)
        `;
        await db.execute(query, [email, username, hashed_password, role]);

        res.status(201).json({ message: `New ${role} registered successfully!` });
    } catch (error) {
        console.error('Admin registration error: ', error);
        res.status(500).json({ message: 'Error registering new admin or moderator.' });
    }
});

module.exports = router;