// middleware/apiKey.js
module.exports = function apiKey(req, res, next) {
  const key = req.header('x-api-key');
  const required = process.env.OPERATOR_API_KEY;
  if (!required || !required.trim()) {
    return res.status(500).json({ message: 'Server missing OPERATOR_API_KEY' });
  }
  if (!key || key !== required) {
    return res.status(401).json({ message: 'Unauthorized: invalid API key' });
  }
  next();
};
