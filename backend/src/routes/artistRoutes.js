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

// ========================================
// RUTAS PÚBLICAS
// ========================================

// Artistas activos (solo los que tienen activo=true)
router.get('/active', getActiveArtists);

// Artistas destacados
router.get('/featured', getFeaturedArtists);

// Buscar artistas
router.get('/search', searchArtists);

// Eventos de un artista
router.get('/:id/eventos', getArtistEventos);

// Ver perfil de artista por ID
router.get('/:id', getArtistById);

// Listar artistas (con filtros)
router.get('/', listArtists);

// ========================================
// RUTAS PROTEGIDAS (SOLO ADMIN)
// ========================================

// Crear artista
router.post('/', authenticate, authorize('admin'), createArtist);

// Actualizar artista
router.put('/:id', authenticate, authorize('admin'), updateArtist);

// Eliminar artista (hard delete)
router.delete('/:id', authenticate, authorize('admin'), deleteArtist);

// Desactivar artista (activo = false)
router.patch('/:id/deactivate', authenticate, authorize('admin'), deactivateArtist);

// Reactivar artista (activo = true)  ← NUEVA RUTA
router.patch('/:id/activate', authenticate, authorize('admin'), activateArtist);

// Marcar/desmarcar como destacado
router.patch('/:id/featured', authenticate, authorize('admin'), toggleFeatured);

export default router;