const jwt = require('jsonwebtoken');

// middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Authorization header missing or malformed.'
        });
    }

    const token = authHeader.split(' ')[1]; // extract token from "Bearer <token>"

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'No token provided. Access denied.'
        });
    }

    if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET is not defined in environment variables.');
        return res.status(500).json({
            success: false,
            message: 'Server configuration error.'
        });
    }


    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // verify token
        req.user = decoded; // attach user information to the request object
        next(); // move to the next middleware or route handler
    } catch (error) {
        console.error('Token verification error:', error);
        if(error.name === 'TokenExpiredError'){
            return res.status(401).json({
                success: false,
                message: 'Token has expired. Please log in again.'
            });
        }

        res.status(403).json({
            success: false,
            message: 'Invalid token.'
        });
    }
};

module.exports = verifyToken;