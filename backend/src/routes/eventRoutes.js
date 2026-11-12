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

// Subida del cartel
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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: fileFilter
});

// Todo requiere sesión de admin
router.use(authenticate);
router.use(requireAdmin);

router.get('/stats', getEventsStats);

router.get('/', getAllEventsAdmin);

router.get('/:id', getEventDetails);

router.post(
  '/',
  upload.single('imagen'),
  createEvent
);

router.put(
  '/:id',
  upload.single('imagen'),
  updateEvent
);

router.delete('/:id', deleteEvent);

router.patch('/:id/publish', publishEvent);

router.patch('/:id/unpublish', unpublishEvent);

router.patch('/:id/toggle-publish', togglePublishEvent);

router.patch('/:id/cancel', cancelEvent);

router.patch('/:id/feature', featureEvent);

router.patch('/:id/unfeature', unfeatureEvent);

router.patch('/:id/toggle-feature', toggleFeatureEvent);

router.patch('/:id/tandas/:tierId/activar', activateTanda);

router.patch('/:id/tandas/desactivar', deactivateTanda);

export default router;