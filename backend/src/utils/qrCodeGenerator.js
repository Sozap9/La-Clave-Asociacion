import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// QR de una reserva como archivo PNG
export const generateQRCode = async (codigoReserva, bookingId) => {
  try {
    const qrDir = path.join(__dirname, '../../uploads/qrcodes');
    if (!fs.existsSync(qrDir)) {
      fs.mkdirSync(qrDir, { recursive: true });
    }

    const filename = `qr-${bookingId}-${Date.now()}.png`;
    const filepath = path.join(qrDir, filename);

    const qrData = JSON.stringify({
      codigo: codigoReserva,
      booking_id: bookingId,
      timestamp: new Date().toISOString()
    });

    await QRCode.toFile(filepath, qrData, {
      errorCorrectionLevel: 'H',
      type: 'png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 300
    });

    return `/uploads/qrcodes/${filename}`;
  } catch (error) {
    logger.error('Error generando QR code:', error);
    throw error;
  }
};

// QR en base64
export const generateQRCodeBase64 = async (codigoReserva, bookingId) => {
  try {
    const qrData = JSON.stringify({
      codigo: codigoReserva,
      booking_id: bookingId,
      timestamp: new Date().toISOString()
    });

    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 300
    });

    return qrCodeDataURL;
  } catch (error) {
    logger.error('Error generando QR code base64:', error);
    throw error;
  }
};

// Comprobar un QR
export const verifyQRCode = (qrData) => {
  try {
    const data = JSON.parse(qrData);
    
    if (!data.codigo || !data.booking_id) {
      throw new Error('QR code inválido');
    }

    return data;
  } catch (error) {
    logger.error('Error verificando QR code:', error);
    throw new Error('QR code inválido o corrupto');
  }
};

// Borrar el archivo del QR
export const deleteQRCode = (qrPath) => {
  try {
    const fullPath = path.join(__dirname, '../..', qrPath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
    return false;
  } catch (error) {
    logger.error('Error eliminando QR code:', error);
    return false;
  }
};

export default {
  generateQRCode,
  generateQRCodeBase64,
  verifyQRCode,
  deleteQRCode
};