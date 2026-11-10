import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Crear directorios si no existen
const uploadsDir = path.join(__dirname, "../../uploads");
const dirs = ["avatars", "dni", "events", "gallery", "solicitudes"];

dirs.forEach((dir) => {
  const dirPath = path.join(uploadsDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

/**
 * Almacenamiento para avatares de usuario
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
 * Almacenamiento para DNI de usuarios ya registrados
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
 * Almacenamiento para DNI en solicitudes de socio
 * No hay req.user.id disponible (usuario aún no creado),
 * se usa un identificador temporal basado en timestamp + random
 */
const solicitudDniStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(uploadsDir, "solicitudes"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const side = file.fieldname === "dni_front" ? "front" : "back";
    cb(null, `sol-${side}-${uniqueSuffix}${ext}`);
  },
});

/**
 * Almacenamiento para imágenes de eventos
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
 * Almacenamiento para galería
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
 * Filtro para imágenes (jpeg, jpg, png, webp)
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
 * Filtro para PDFs
 */
const pdfFilter = (req, file, cb) => {
  const extname = /pdf/.test(path.extname(file.originalname).toLowerCase());
  const mimetype = file.mimetype === "application/pdf";

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Solo se permiten archivos PDF"));
  }
};

/**
 * Límites de tamaño
 */
const limits = {
  fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
};

// ============================================================
// EXPORTS
// ============================================================

export const uploadAvatar = multer({
  storage: avatarStorage,
  limits,
  fileFilter: imageFilter,
});

export const uploadDNI = multer({
  storage: dniStorage,
  limits,
  fileFilter: imageFilter,
});

/**
 * Para subir DNI en el flujo de solicitud de socio (ruta pública)
 * Acepta los campos: dni_front, dni_back
 */
export const uploadSolicitudDNI = multer({
  storage: solicitudDniStorage,
  limits,
  fileFilter: imageFilter,
});

export const uploadEventImage = multer({
  storage: eventStorage,
  limits,
  fileFilter: imageFilter,
});

export const uploadGalleryImage = multer({
  storage: galleryStorage,
  limits,
  fileFilter: imageFilter,
});

// Alias
export const uploadGallery = uploadGalleryImage;

/**
 * Eliminar un archivo del filesystem
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
 * Obtener URL pública de un archivo
 */
export const getFileUrl = (filePath) => {
  if (!filePath) return null;
  const baseUrl = process.env.BACKEND_URL || "http://localhost:5000";
  return `${baseUrl}/${filePath}`;
};

export default {
  uploadAvatar,
  uploadDNI,
  uploadSolicitudDNI,
  uploadEventImage,
  uploadGalleryImage,
  uploadGallery,
  deleteFile,
  getFileUrl,
};