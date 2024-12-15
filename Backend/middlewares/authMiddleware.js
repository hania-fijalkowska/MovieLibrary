const jwt = require('jsonwebtoken');

// verifyToken middleware
module.exports = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'Access token required.'
            });
        }

        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not configured');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded.user_id) {
            throw new Error('Invalid user ID in token');
        }

        req.user = decoded; // Attach user to request
        next(); // Proceed to the next middleware
    } catch (err) {
        console.error('Authentication error:', err.message);

        const status = err.message === 'Token has expired' ? 401 : 400;
        res.status(status).json({
            success: false,
            message: err.message || 'Authentication failed.'
        });
    }
};