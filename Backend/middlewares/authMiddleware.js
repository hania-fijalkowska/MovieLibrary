const jwt = require('jsonwebtoken');

// middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // extract token from Authorization header

    if (!token) {
        return res.status(401).json({ message: 'No token provided. Access denied.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // verify token
        req.user = decoded; // attach user information to the request object
        next(); // move to the next middleware or route handler
    } catch (error) {
        res.status(403).json({ message: 'Invalid token.' });
    }
};

module.exports = verifyToken;