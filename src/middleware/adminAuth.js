const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Token missing' });

  const token = authHeader.split(' ')[1]; // Expect 'Bearer <token>'
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'supersecret');
    // Only allow master admin (e.g., role === 'master')
    if (payload.role !== 'master') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    req.user = payload;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};
