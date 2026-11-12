import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate, requireAdmin } from '../middleware/authMiddleware.js';
import {
  createEvent,
  updateEvent,
  getAllEventsAdmin,
  getEventDetails,
  deleteEvent,
  publishEvent,
  unpublishEvent,
  togglePublishEvent,
  cancelEvent,
  featureEvent,
  unfeatureEvent,
  toggleFeatureEvent,
  getEventsStats,
  activateTanda,
  deactivateTanda
} from '../controllers/eventController.js';

const router = express.Router();

// ========================================
// MULTER CONFIGURATION
// ========================================
const uploadsDir = './uploads/events';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `event-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: fileFilter
});

// ========================================
// AUTHENTICATION - ALL ROUTES REQUIRE ADMIN
// ========================================
router.use(authenticate);
router.use(requireAdmin);

// ========================================
// ROUTES
// ========================================

/**
 * @route   GET /api/admin/events/stats
 * @desc    Get events statistics
 * @access  Admin
 */
router.get('/stats', getEventsStats);

/**
 * @route   GET /api/admin/events
 * @desc    Get all events (admin view)
 * @access  Admin
 */
router.get('/', getAllEventsAdmin);

/**
 * @route   GET /api/admin/events/:id
 * @desc    Get event details
 * @access  Admin
 */
router.get('/:id', getEventDetails);

/**
 * @route   POST /api/admin/events
 * @desc    Create new event
 * @access  Admin
 */
router.post(
  '/',
  upload.single('imagen'),
  createEvent
);

/**
 * @route   PUT /api/admin/events/:id
 * @desc    Update event
 * @access  Admin
 */
router.put(
  '/:id',
  upload.single('imagen'),
  updateEvent
);

/**
 * @route   DELETE /api/admin/events/:id
 * @desc    Delete event
 * @access  Admin
 */
router.delete('/:id', deleteEvent);

/**
 * @route   PATCH /api/admin/events/:id/publish
 * @desc    Publish event
 * @access  Admin
 */
router.patch('/:id/publish', publishEvent);

/**
 * @route   PATCH /api/admin/events/:id/unpublish
 * @desc    Unpublish event
 * @access  Admin
 */
router.patch('/:id/unpublish', unpublishEvent);

/**
 * @route   PATCH /api/admin/events/:id/toggle-publish
 * @desc    Toggle publish/unpublish
 * @access  Admin
 */
router.patch('/:id/toggle-publish', togglePublishEvent);

/**
 * @route   PATCH /api/admin/events/:id/cancel
 * @desc    Cancel event
 * @access  Admin
 */
router.patch('/:id/cancel', cancelEvent);

/**
 * @route   PATCH /api/admin/events/:id/feature
 * @desc    Feature event
 * @access  Admin
 */
router.patch('/:id/feature', featureEvent);

/**
 * @route   PATCH /api/admin/events/:id/unfeature
 * @desc    Unfeature event
 * @access  Admin
 */
router.patch('/:id/unfeature', unfeatureEvent);

/**
 * @route   PATCH /api/admin/events/:id/toggle-feature
 * @desc    Toggle featured status
 * @access  Admin
 */
router.patch('/:id/toggle-feature', toggleFeatureEvent);

/**
 * @route   PATCH /api/admin/events/:id/tandas/:tierId/activar
 * @desc    Forzar una tanda como vigente ahora mismo (sin esperar a su hora)
 * @access  Admin
 */
router.patch('/:id/tandas/:tierId/activar', activateTanda);

/**
 * @route   PATCH /api/admin/events/:id/tandas/desactivar
 * @desc    Quitar el forzado manual, volver al modo automático
 * @access  Admin
 */
router.patch('/:id/tandas/desactivar', deactivateTanda);

export default router;