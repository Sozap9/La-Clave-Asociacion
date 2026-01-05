import crypto from 'crypto';

/**
 * Generar token aleatorio seguro
 * @param {number} length - Longitud en bytes (default: 32)
 * @returns {string} Token en formato hexadecimal
 */
export const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generar hash de un token
 * @param {string} token - Token a hashear
 * @returns {string} Hash SHA256 del token
 */
export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export default {
  generateToken,
  hashToken,
};