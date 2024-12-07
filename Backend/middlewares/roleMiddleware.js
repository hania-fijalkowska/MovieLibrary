const checkRole = (role) => {
    return (req, res, next) => {
        if (req.user.access_level !== role) {
            return res.status(403).json({ message: `Access denied. ${role}s only.` });
        }
        next(); // allow the request to proceed
    };
};

module.exports = checkRole;