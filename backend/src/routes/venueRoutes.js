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

// ========================================
// RUTAS PÚBLICAS
// ========================================

// Venues activos (solo los que tienen activo=true)
router.get('/active', getActiveVenues);

// Listar venues (con filtros)
router.get('/', listVenues);

// Ver venue por ID
router.get('/:id', getVenueById);

// ========================================
// RUTAS PROTEGIDAS (SOLO ADMIN)
// ========================================

// Crear venue
router.post('/', authenticate, authorize('admin'), createVenue);

// Actualizar venue
router.put('/:id', authenticate, authorize('admin'), updateVenue);

// Eliminar venue (hard delete)
router.delete('/:id', authenticate, authorize('admin'), deleteVenue);

// Desactivar venue (activo = false)
router.patch('/:id/deactivate', authenticate, authorize('admin'), deactivateVenue);

// Reactivar venue (activo = true) 
router.patch('/:id/activate', authenticate, authorize('admin'), activateVenue);

export default router;