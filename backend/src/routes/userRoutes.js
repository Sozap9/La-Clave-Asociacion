import express from 'express';
import { 
  getUserProfile, 
  updateUserProfile, 
  changePassword 
} from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// @route   GET /api/users/profile
// @desc    Obtener perfil del usuario autenticado
// @access  Private
router.get('/profile', getUserProfile);

// @route   PUT /api/users/profile
// @desc    Actualizar perfil del usuario
// @access  Private
router.put('/profile', updateUserProfile);

// @route   PUT /api/users/change-password
// @desc    Cambiar contraseña del usuario
// @access  Private
router.put('/change-password', changePassword);

export default router;
