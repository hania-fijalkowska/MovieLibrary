const jwt = require('jsonwebtoken'); // for token generation

const generateToken = (user) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined in the environment variables!');
    }
    return jwt.sign(
        { user_id: user.user_id, username: user.username, access_level: user.access_level },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
};

module.exports = generateToken;