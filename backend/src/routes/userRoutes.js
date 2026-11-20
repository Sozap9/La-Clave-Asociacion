import express from 'express';
import { 
  getUserProfile, 
  updateUserProfile, 
  changePassword 
} from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';
import { uploadProfileImages } from '../config/multer.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/profile', getUserProfile);

// Los errores de multer (tamaño, formato) se devuelven como 400 con su mensaje
const profileUpload = (req, res, next) => {
  uploadProfileImages(req, res, (err) => {
    if (!err) return next();
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'La imagen no puede superar los 5 MB'
      : err.message;
    return res.status(400).json({ success: false, message });
  });
};

router.put('/profile', profileUpload, updateUserProfile);

router.put('/change-password', changePassword);

export default router;