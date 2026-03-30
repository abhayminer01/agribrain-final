const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ success: false, message: "Unauthorized. Please log in." });
    }
    next();
};

const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ success: false, message: "Unauthorized. Please log in." });
        }
        
        const userRole = req.session.role;
        
        if (!userRole || !allowedRoles.includes(userRole)) {
            return res.status(403).json({ success: false, message: "Forbidden. Insufficient permissions." });
        }
        next();
    };
};

module.exports = { requireAuth, requireRole };
