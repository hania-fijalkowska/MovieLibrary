
// utils/pagination.js
function getPaginationParams(req) {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    return { page, limit, offset };
}


module.exports = getPaginationParams;