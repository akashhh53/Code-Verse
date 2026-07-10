const jwt = require('jsonwebtoken');

const ACCESS_TOKEN_COOKIE = 'accessToken';
const LEGACY_TOKEN_COOKIE = 'token';
const ACCESS_TOKEN_MAX_AGE_MS = 60 * 60 * 1000;

const createAccessToken = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      emailId: user.emailId,
      role: user.role,
    },
    process.env.JWT_KEY,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1h' }
  );
};

const getTokenFromRequest = (req) => {
  return getTokenCandidatesFromRequest(req)[0];
};

const getTokenCandidatesFromRequest = (req) => {
  const authHeader = req.headers.authorization || '';
  const tokens = [];

  if (authHeader.startsWith('Bearer ')) {
    tokens.push(authHeader.slice(7).trim());
  }

  if (req.cookies?.[ACCESS_TOKEN_COOKIE]) {
    tokens.push(req.cookies[ACCESS_TOKEN_COOKIE]);
  }

  if (req.cookies?.[LEGACY_TOKEN_COOKIE]) {
    tokens.push(req.cookies[LEGACY_TOKEN_COOKIE]);
  }

  return [...new Set(tokens.filter(Boolean))];
};

module.exports = {
  ACCESS_TOKEN_COOKIE,
  LEGACY_TOKEN_COOKIE,
  ACCESS_TOKEN_MAX_AGE_MS,
  createAccessToken,
  getTokenFromRequest,
  getTokenCandidatesFromRequest,
};
