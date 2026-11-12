import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import logger from '../config/logger.js';

const galleryDir = './uploads/gallery';
const galleryOriginalsDir = './uploads/gallery/originals';
const galleryThumbsDir = './uploads/gallery/thumbs';

[galleryDir, galleryOriginalsDir, galleryThumbsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Almacenamiento de la galería
const galleryStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, galleryOriginalsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const sanitizedName = path.basename(file.originalname, ext).replace(/[^a-z0-9]/gi, '-').toLowerCase();
    cb(null, `gallery-${uniqueSuffix}-${sanitizedName}${ext}`);
  }
});

// Solo imágenes
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp)'));
  }
};

export const galleryUpload = multer({
  storage: galleryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB
  },
  fileFilter: fileFilter
});

// Miniatura de 400x400 tras subir la imagen
export const createThumbnail = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    const originalPath = req.file.path;
    const thumbnailFilename = `thumb-${req.file.filename}`;
    const thumbnailPath = path.join(galleryThumbsDir, thumbnailFilename);

    await sharp(originalPath)
      .resize(400, 400, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);

    req.thumbnail = {
      filename: thumbnailFilename,
      path: thumbnailPath,
      url: `/uploads/gallery/thumbs/${thumbnailFilename}`
    };

    const metadata = await sharp(originalPath).metadata();
    req.imageMetadata = {
      width: metadata.width,
      height: metadata.height
    };

    next();
  } catch (error) {
    logger.error('Error creating thumbnail:', error);
    // Si falla, se sigue sin miniatura
    next();
  }
};

// Errores de multer
export const handleGalleryMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'El archivo es demasiado grande. Máximo 10MB'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Error al subir archivo: ${err.message}`
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};
