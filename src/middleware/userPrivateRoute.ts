import JwtToken from '../utils/jwtToken.js';

export default function PrivateRoute(req, res, next) {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!token.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const tokenString = token.split(' ')[1];

  if (!tokenString) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const payload = JwtToken.decode(tokenString);

  if (!payload || payload.type !== 'user_auth_token') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Attach user info to request
  req.user = { id: payload.user_id };

  next();
}