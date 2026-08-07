// ============================================
// Auth Service — JWT helpers & token management
// ============================================

import jwt from 'jsonwebtoken';
import env from '../config/environment.js';

// ─── Token Generators ───────────────────────
export const signAccessToken = (userId, role) =>
  jwt.sign({ id: userId, role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

export const signRefreshToken = (userId) =>
  jwt.sign({ id: userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });

// ─── Token Verification ─────────────────────
export const verifyAccessToken = (token) =>
  jwt.verify(token, env.JWT_SECRET);

export const verifyRefreshToken = (token) =>
  jwt.verify(token, env.JWT_REFRESH_SECRET);

// ─── Cookie Options ─────────────────────────
export const cookieOptions = () => ({
  httpOnly: env.COOKIE_HTTPONLY,
  secure: env.COOKIE_SECURE,
  sameSite: env.COOKIE_SAMESITE,
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

// ─── Default Export (optional but useful)
export default {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  cookieOptions,
};