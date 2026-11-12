import express from 'express';
import * as galleryController from '../controllers/galleryController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { galleryUpload, createThumbnail, handleGalleryMulterError } from '../middleware/galleryUpload.js';  
import { uploadLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Álbumes

router.get('/folders', galleryController.listFolders);
router.get('/folders/:identifier', galleryController.getFolderByIdOrSlug);
router.get('/featured', galleryController.getFeaturedFolders);

router.post('/folders', authenticate, authorize('admin'), galleryController.createFolder);
router.put('/folders/:id', authenticate, authorize('admin'), galleryController.updateFolder);
router.delete('/folders/:id', authenticate, authorize('admin'), galleryController.deleteFolder);

// Antes de las rutas con :id
router.put('/folders/:folderId/cover', 
  authenticate, 
  authorize('admin'), 
  galleryController.setCoverImage
);

// Imágenes

router.get('/folders/:folderId/images', galleryController.listFolderImages);

router.post('/folders/:folderId/images', 
  authenticate, 
  authorize('admin'),
  uploadLimiter,
  galleryUpload.single('image'),    
  createThumbnail,                   
  handleGalleryMulterError,          
  galleryController.uploadImage
);

// Rutas fijas antes que las de :id
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

// Todas las imágenes

router.get('/images/:id', galleryController.getImageById);

router.get('/featured-images', galleryController.getFeaturedImages);

router.put('/images/:id/move', 
  authenticate, 
  authorize('admin'), 
  galleryController.moveImageToFolder
);

router.get('/stats', 
  authenticate, 
  authorize('admin'),
  galleryController.getStats
);

// Artistas etiquetados

router.get('/images', galleryController.getAllImagesWithArtists);
router.get('/images/:imageId/artists', galleryController.getImageArtists);
router.get('/folders/:folderId/artists', galleryController.getFolderArtists);
router.get('/artists/:artistId/content', galleryController.getContentByArtist);

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