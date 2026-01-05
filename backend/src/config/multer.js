import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Crear directorios si no existen
const uploadsDir = path.join(__dirname, "../../uploads");
const dirs = ["avatars", "dni", "events", "gallery"];

dirs.forEach((dir) => {
  const dirPath = path.join(uploadsDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

/**
 * Configuración de almacenamiento para avatares
 */
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(uploadsDir, "avatars"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${req.user.id}-${uniqueSuffix}${ext}`);
  },
});

/**
 * Configuración de almacenamiento para DNI
 */
const dniStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(uploadsDir, "dni"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const side = file.fieldname === "dni_front" ? "front" : "back";
    cb(null, `dni-${req.user.id}-${side}-${uniqueSuffix}${ext}`);
  },
});

/**
 * Configuración de almacenamiento para eventos
 */
const eventStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(uploadsDir, "events"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `event-${uniqueSuffix}${ext}`);
  },
});

/**
 * Configuración de almacenamiento para galería
 */
const galleryStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(uploadsDir, "gallery"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `gallery-${uniqueSuffix}${ext}`);
  },
});

/**
 * Filtro para validar tipos de archivo (imágenes)
 */
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Solo se permiten imágenes (jpeg, jpg, png, webp)"));
  }
};

/**
 * Filtro para PDFs (para documentos)
 */
const pdfFilter = (req, file, cb) => {
  const allowedTypes = /pdf/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = file.mimetype === "application/pdf";

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Solo se permiten archivos PDF"));
  }
};

/**
 * Límites de tamaño de archivo
 */
const limits = {
  fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB por defecto
};

/**
 * Configuración para subir avatares
 */
export const uploadAvatar = multer({
  storage: avatarStorage,
  limits: limits,
  fileFilter: imageFilter,
});

/**
 * Configuración para subir DNI (frontal y trasero)
 */
export const uploadDNI = multer({
  storage: dniStorage,
  limits: limits,
  fileFilter: imageFilter,
});

/**
 * Configuración para subir imágenes de eventos
 */
export const uploadEventImage = multer({
  storage: eventStorage,
  limits: limits,
  fileFilter: imageFilter,
});

/**
 * Configuración para subir imágenes de galería
 */
export const uploadGalleryImage = multer({
  storage: galleryStorage,
  limits: limits,
  fileFilter: imageFilter,
});

// Alias más lógico y consistente con el resto del proyecto
export const uploadGallery = uploadGalleryImage;

/**
 * Función helper para eliminar archivo
 */
export const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error eliminando archivo:", error);
    return false;
  }
};

/**
 * Función helper para obtener URL pública del archivo
 */
export const getFileUrl = (filePath) => {
  if (!filePath) return null;
  const baseUrl = process.env.BACKEND_URL || "http://localhost:5000";
  return `${baseUrl}/${filePath}`;
};

export default {
  uploadAvatar,
  uploadDNI,
  uploadEventImage,
  uploadGalleryImage,
  uploadGallery,
  deleteFile,
  getFileUrl,
};
