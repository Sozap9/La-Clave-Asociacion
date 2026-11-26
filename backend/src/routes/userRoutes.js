import express from 'express';
import { 
  getUserProfile, 
  getMyDni,
  updateUserProfile, 
  changePassword 
} from '../controllers/userController.js';
import { solicitarCambioEmail } from '../controllers/emailCambioController.js';
// Comprueba en la base que la cuenta sigue activa (no solo el token)
import { authenticate } from '../middleware/authMiddleware.js';
import { uploadProfileImages } from '../config/multer.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { changePasswordValidator } from '../validators/authValidator.js';
import { handleValidationErrors } from '../middleware/validationMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/profile', getUserProfile);

router.get('/profile/dni', getMyDni);

// Los errores de multer (tamaño, formato) se devuelven como 400 con su mensaje
const profileUpload = (req, res, next) => {
  uploadProfileImages(req, res, (err) => {
    if (!err) return next();
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'La imagen no puede superar los 5 MB'
      : err.code === 'LIMIT_UNEXPECTED_FILE'
        ? 'Solo se puede cambiar la foto de perfil'
        : err.message;
    return res.status(400).json({ success: false, message });
  });
};

router.put('/profile', profileUpload, updateUserProfile);

// Con contraseña y límite de intentos, como el login
router.put('/profile/email', authLimiter, solicitarCambioEmail);

router.put(
  '/change-password',
  authLimiter,
  changePasswordValidator,
  handleValidationErrors,
  changePassword
);

export default router;
