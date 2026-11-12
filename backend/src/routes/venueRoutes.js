import express from 'express';
import {
  listVenues,
  getVenueById,
  createVenue,
  updateVenue,
  deleteVenue,
  deactivateVenue,
  activateVenue,      
  getActiveVenues
} from '../controllers/venueController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Rutas públicas

router.get('/active', getActiveVenues);

router.get('/', listVenues);

router.get('/:id', getVenueById);

// Solo admin

router.post('/', authenticate, authorize('admin'), createVenue);

router.put('/:id', authenticate, authorize('admin'), updateVenue);

router.delete('/:id', authenticate, authorize('admin'), deleteVenue);

router.patch('/:id/deactivate', authenticate, authorize('admin'), deactivateVenue);

router.patch('/:id/activate', authenticate, authorize('admin'), activateVenue);

export default router;