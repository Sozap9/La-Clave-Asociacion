import express from 'express';
import {
  listArtists,
  getArtistById,
  createArtist,
  updateArtist,
  deleteArtist,
  deactivateArtist,
  activateArtist,    
  toggleFeatured,
  getActiveArtists,
  getFeaturedArtists,
  searchArtists,
  getArtistEventos
} from '../controllers/artistController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Rutas públicas

router.get('/active', getActiveArtists);

router.get('/featured', getFeaturedArtists);

router.get('/search', searchArtists);

router.get('/:id/eventos', getArtistEventos);

router.get('/:id', getArtistById);

router.get('/', listArtists);

// Solo admin

router.post('/', authenticate, authorize('admin'), createArtist);

router.put('/:id', authenticate, authorize('admin'), updateArtist);

router.delete('/:id', authenticate, authorize('admin'), deleteArtist);

router.patch('/:id/deactivate', authenticate, authorize('admin'), deactivateArtist);

router.patch('/:id/activate', authenticate, authorize('admin'), activateArtist);

router.patch('/:id/featured', authenticate, authorize('admin'), toggleFeatured);

export default router;