const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'skillproject_fallback_secret_key_change_me';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer <TOKEN>

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authentication token is missing.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, name, ... }
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired session. Please log in again.'
    });
  }
}

module.exports = {
  authenticateToken,
  JWT_SECRET
};
