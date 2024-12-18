const jwt = require('jsonwebtoken');

const blacklist = new Set();

// Middleware to verify and blacklist tokens
function verifyAndBlacklistToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, 'secret');
        blacklist.add(token);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }
}

module.exports = { verifyAndBlacklistToken, blacklist };