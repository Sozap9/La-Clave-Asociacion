import express from 'express';
import { 
  getUserProfile, 
  updateUserProfile, 
  changePassword 
} from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/profile', getUserProfile);

router.put('/profile', updateUserProfile);

router.put('/change-password', changePassword);

export default router;
