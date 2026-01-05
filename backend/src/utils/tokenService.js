import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '30d';

/**
 * Genera un token de acceso JWT
 * @param {Object} payload - Datos del usuario a incluir en el token
 * @returns {String} Token JWT
 */
export const generateAccessToken = (payload) => {
  // Asegurarse de que el role está incluido
  const tokenPayload = {
    id: payload.id,
    username: payload.username,
    email: payload.email,
    role: payload.role // IMPORTANTE: Incluir el role
  };
  
  return jwt.sign(tokenPayload, JWT_SECRET, {
    expiresIn: JWT_EXPIRE,
    issuer: 'la-clave-api'
  });
};

/**
 * Genera un refresh token
 * @param {Object} payload - Datos del usuario
 * @returns {String} Refresh token
 */
export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRE,
    issuer: 'la-clave-api'
  });
};

/**
 * Verifica un token de acceso
 * @param {String} token - Token a verificar
 * @returns {Object} Payload decodificado
 */
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expirado');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Token inválido');
    }
    throw error;
  }
};

/**
 * Verifica un refresh token
 * @param {String} token - Refresh token a verificar
 * @returns {Object} Payload decodificado
 */
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token expirado');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Refresh token inválido');
    }
    throw error;
  }
};

/**
 * Genera un par de tokens (acceso y refresh)
 * @param {Object} user - Datos del usuario
 * @returns {Object} { accessToken, refreshToken }
 */
export const generateTokens = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role
  };

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken({ id: user.id })
  };
};

/**
 * Decodifica un token sin verificar (útil para debugging)
 * @param {String} token - Token a decodificar
 * @returns {Object} Payload decodificado
 */
export const decodeToken = (token) => {
  return jwt.decode(token);
};

export default {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateTokens,
  decodeToken
};