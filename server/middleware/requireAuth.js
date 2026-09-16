const { verifyToken, COOKIE_NAME } = require('../lib/auth');

// Blocks the request with 401 if not logged in. Use on routes that
// require a signed-in user (posting items, claiming, messaging).
function requireAuth(req, res, next) {
  const token = req.cookies[COOKIE_NAME];
  const payload = token ? verifyToken(token) : null;
  if (!payload) {
    return res.status(401).json({ error: 'You need to be signed in to do that.' });
  }
  req.user = { id: payload.sub, name: payload.name, email: payload.email };
  next();
}

// Never blocks — just attaches req.user if the cookie is valid, or
// req.user = null otherwise. Use for routes like GET /me that need to
// report "who's logged in, if anyone" without erroring for guests.
function attachUser(req, res, next) {
  const token = req.cookies[COOKIE_NAME];
  const payload = token ? verifyToken(token) : null;
  req.user = payload ? { id: payload.sub, name: payload.name, email: payload.email } : null;
  next();
}

module.exports = { requireAuth, attachUser };
