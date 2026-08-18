const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  // Get token from header
  const token = req.header('Authorization');

  // Check if not token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Format of token: "Bearer <token>"
  try {
    const decodedToken = token.split(' ')[1];
    if(!decodedToken) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }
    const decoded = jwt.verify(decodedToken, process.env.JWT_SECRET);

    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
}

auth.optionalAuth = function (req, res, next) {
  const token = req.header('Authorization');
  if (token) {
    try {
      const decodedToken = token.split(' ')[1];
      if (decodedToken) {
        const decoded = jwt.verify(decodedToken, process.env.JWT_SECRET);
        req.user = decoded.user;
      }
    } catch (err) {
      // Ignore invalid token and continue as guest
    }
  }
  next();
};

module.exports = auth;

