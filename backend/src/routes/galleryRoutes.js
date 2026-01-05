import express from 'express';
import * as galleryController from '../controllers/galleryController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { galleryUpload, createThumbnail, handleGalleryMulterError } from '../middleware/galleryUpload.js';  
import { uploadLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * FOLDERS - Rutas de carpetas/álbumes
 */

// Públicas
router.get('/folders', galleryController.listFolders);
router.get('/folders/:identifier', galleryController.getFolderByIdOrSlug);
router.get('/featured', galleryController.getFeaturedFolders);

// Admin
router.post('/folders', authenticate, authorize('admin'), galleryController.createFolder);
router.put('/folders/:id', authenticate, authorize('admin'), galleryController.updateFolder);
router.delete('/folders/:id', authenticate, authorize('admin'), galleryController.deleteFolder);

// Establecer imagen de portada (ANTES de las rutas con :id)
router.put('/folders/:folderId/cover', 
  authenticate, 
  authorize('admin'), 
  galleryController.setCoverImage
);

/**
 * IMAGES - Rutas de imágenes
 */

// Públicas
router.get('/folders/:folderId/images', galleryController.listFolderImages);

// Admin - SUBIR IMAGEN CON UPLOAD LIMITER
router.post('/folders/:folderId/images', 
  authenticate, 
  authorize('admin'),
  uploadLimiter,
  galleryUpload.single('image'),    
  createThumbnail,                   
  handleGalleryMulterError,          
  galleryController.uploadImage
);

// ✅ RUTAS ESPECÍFICAS PRIMERO (bulk-update, bulk-delete)
router.put('/images/bulk-update', 
  authenticate, 
  authorize('admin'), 
  galleryController.bulkUpdateImages
);

router.delete('/images/bulk-delete', 
  authenticate, 
  authorize('admin'), 
  galleryController.bulkDeleteImages
);

// ✅ RUTAS CON PARÁMETROS DESPUÉS (:id)
router.put('/images/:id', 
  authenticate, 
  authorize('admin'), 
  galleryController.updateImage
);

router.delete('/images/:id', 
  authenticate, 
  authorize('admin'), 
  galleryController.deleteImage
);

router.put('/folders/:folderId/images/reorder', 
  authenticate, 
  authorize('admin'), 
  galleryController.reorderImages
);

/**
 * Gestión Global de Imágenes
 */

// Obtener imagen por ID (público)
router.get('/images/:id', galleryController.getImageById);

// Imágenes destacadas (público)
router.get('/featured-images', galleryController.getFeaturedImages);

// Mover imagen a otro folder (admin)
router.put('/images/:id/move', 
  authenticate, 
  authorize('admin'), 
  galleryController.moveImageToFolder
);

/**
 * ESTADÍSTICAS
 */
router.get('/stats', 
  authenticate, 
  authorize('admin'),
  galleryController.getStats
);

/**
 * ARTISTS - Rutas de gestión de artistas
 */

// Públicas - Ver imágenes con artistas
router.get('/images', galleryController.getAllImagesWithArtists);
router.get('/images/:imageId/artists', galleryController.getImageArtists);
router.get('/folders/:folderId/artists', galleryController.getFolderArtists);
router.get('/artists/:artistId/content', galleryController.getContentByArtist);

// Admin - Gestión de artistas en imágenes
router.post('/images/:imageId/artists', 
  authenticate, 
  authorize('admin'), 
  galleryController.addArtistToImage
);

router.put('/images/:imageId/artists', 
  authenticate, 
  authorize('admin'), 
  galleryController.updateImageArtists
);

router.delete('/images/:imageId/artists/:artistId', 
  authenticate, 
  authorize('admin'), 
  galleryController.removeArtistFromImage
);

// Admin - Gestión de artistas en folders
router.post('/folders/:folderId/artists', 
  authenticate, 
  authorize('admin'), 
  galleryController.addArtistToFolder
);

router.put('/folders/:folderId/artists', 
  authenticate, 
  authorize('admin'), 
  galleryController.updateFolderArtists
);

router.delete('/folders/:folderId/artists/:artistId', 
  authenticate, 
  authorize('admin'), 
  galleryController.removeArtistFromFolder
);

export default router;