const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const COOKIE_NAME = 'freecycle_token';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function getSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error(
      'JWT_SECRET is not set. Add it to server/.env.'
    );
  }
  return process.env.JWT_SECRET;
}

function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function signToken(user) {
  return jwt.sign(
    { sub: user.id, name: user.name, email: user.email },
    getSecret(),
    { expiresIn: '7d' }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, getSecret());
  } catch {
    return null;
  }
}

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SEVEN_DAYS_MS,
  });
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME);
}

module.exports = {
  COOKIE_NAME,
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  setAuthCookie,
  clearAuthCookie,
};
