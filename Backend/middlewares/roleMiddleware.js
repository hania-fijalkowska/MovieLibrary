// middleware to check user role
const checkRole = (requiredRoles) => {
    return (req, res, next) => {

        if (!req.user || !requiredRoles.includes(req.user.access_level)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. This route requires one of the following roles: ${requiredRoles.join(', ')}.`
            });
        }

        next(); // allow the request to proceed
    };
};

module.exports = checkRole;