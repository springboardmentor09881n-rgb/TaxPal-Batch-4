const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
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
};
