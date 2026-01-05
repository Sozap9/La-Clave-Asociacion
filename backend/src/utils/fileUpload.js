// utils/fileUpload.js
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta base de uploads
const UPLOAD_DIR = path.join(__dirname, '../../uploads');

/**
 * Asegurar que existe directorio
 */
const ensureDirectoryExists = async (dirPath) => {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
};

/**
 * Generar nombre único para archivo
 */
const generateUniqueFilename = (originalName) => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const ext = path.extname(originalName).toLowerCase();
  return `${timestamp}-${randomString}${ext}`;
};

/**
 * Obtener formato de imagen (MIME)
 */
const getImageFormat = (mimetype) => {
  const formats = {
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpeg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp'
  };
  return formats[mimetype] || 'jpeg';
};

/**
 * Subir imagen con optimización automática
 * @param {Buffer} fileBuffer - Buffer de la imagen
 * @param {String} folder - Carpeta destino (avatars, gallery/originals, events)
 * @param {Object} options - Opciones de procesamiento
 * @returns {Promise<Object>} - URLs y metadata
 */
export const uploadImage = async (fileBuffer, folder, options = {}) => {
  try {
    const {
      originalName = 'image.jpg',
      mimetype = 'image/jpeg',
      maxWidth = 1920,
      maxHeight = 1920,
      quality = 85,
      generateThumbnail = true,
      thumbnailSize = 400
    } = options;

    // Asegurar que existe el directorio
    const folderPath = path.join(UPLOAD_DIR, folder);
    await ensureDirectoryExists(folderPath);

    // Generar nombre único
    const filename = generateUniqueFilename(originalName);
    const format = getImageFormat(mimetype);

    // Procesar y optimizar imagen original
    const processedImage = await sharp(fileBuffer)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .toFormat(format, { quality })
      .toBuffer();

    // Guardar imagen original optimizada
    const imagePath = path.join(folderPath, filename);
    await fs.writeFile(imagePath, processedImage);

    // Obtener metadata
    const metadata = await sharp(processedImage).metadata();

    // URL pública
    const imageUrl = `/uploads/${folder}/${filename}`;

    const result = {
      url: imageUrl,
      path: imagePath,
      filename: filename,
      size: processedImage.length,
      width: metadata.width,
      height: metadata.height,
      format: metadata.format
    };

    // Generar thumbnail si se solicita
    if (generateThumbnail) {
      const thumbnailFolder = path.join(folderPath, 'thumbnails');
      await ensureDirectoryExists(thumbnailFolder);

      const thumbnailBuffer = await sharp(fileBuffer)
        .resize(thumbnailSize, thumbnailSize, {
          fit: 'cover',
          position: 'center'
        })
        .toFormat('jpeg', { quality: 80 })
        .toBuffer();

      const thumbnailPath = path.join(thumbnailFolder, filename);
      await fs.writeFile(thumbnailPath, thumbnailBuffer);

      result.thumbnailUrl = `/uploads/${folder}/thumbnails/${filename}`;
      result.thumbnailPath = thumbnailPath;
    }

    console.log(`✅ Imagen subida: ${imageUrl}`);
    return result;

  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Error al procesar y guardar la imagen');
  }
};

/**
 * Subir avatar de usuario (cuadrado, optimizado)
 */
export const uploadAvatar = async (fileBuffer, options = {}) => {
  return uploadImage(fileBuffer, 'avatars', {
    ...options,
    maxWidth: 500,
    maxHeight: 500,
    quality: 90,
    generateThumbnail: true,
    thumbnailSize: 150
  });
};

/**
 * Subir imagen de galería (alta calidad)
 */
export const uploadGalleryImage = async (fileBuffer, options = {}) => {
  return uploadImage(fileBuffer, 'gallery/originals', {
    ...options,
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 85,
    generateThumbnail: true,
    thumbnailSize: 400
  });
};

/**
 * Subir imagen de evento (cartel)
 */
export const uploadEventImage = async (fileBuffer, options = {}) => {
  return uploadImage(fileBuffer, 'events', {
    ...options,
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 85,
    generateThumbnail: true,
    thumbnailSize: 300
  });
};

/**
 * Subir documento (DNI, firma) sin optimización agresiva
 */
export const uploadDocument = async (fileBuffer, documentType, options = {}) => {
  try {
    const folder = `documents/${documentType}`;
    const folderPath = path.join(UPLOAD_DIR, folder);
    await ensureDirectoryExists(folderPath);

    const filename = generateUniqueFilename(options.originalName || 'document.pdf');
    const filePath = path.join(folderPath, filename);

    // Si es imagen, optimizar ligeramente; si es PDF, guardar directamente
    if (options.mimetype?.startsWith('image/')) {
      const processed = await sharp(fileBuffer)
        .toFormat('jpeg', { quality: 95 }) // Alta calidad para documentos
        .toBuffer();
      await fs.writeFile(filePath, processed);
    } else {
      await fs.writeFile(filePath, fileBuffer);
    }

    const fileUrl = `/uploads/${folder}/${filename}`;
    console.log(`✅ Documento subido: ${fileUrl}`);

    return {
      url: fileUrl,
      path: filePath,
      filename: filename
    };

  } catch (error) {
    console.error('Error uploading document:', error);
    throw new Error('Error al guardar el documento');
  }
};

/**
 * Eliminar archivo del servidor
 */
export const deleteFile = async (fileUrl) => {
  try {
    if (!fileUrl || !fileUrl.startsWith('/uploads/')) {
      console.warn('URL no válida para eliminar:', fileUrl);
      return { success: false, message: 'URL no válida' };
    }

    // Convertir URL a ruta del sistema
    const relativePath = fileUrl.replace('/uploads/', '');
    const filePath = path.join(UPLOAD_DIR, relativePath);

    // Verificar que existe
    try {
      await fs.access(filePath);
    } catch {
      console.warn('Archivo no encontrado:', filePath);
      return { success: false, message: 'Archivo no encontrado' };
    }

    // Eliminar archivo
    await fs.unlink(filePath);
    console.log(`🗑️ Archivo eliminado: ${fileUrl}`);

    // Si es una imagen, intentar eliminar thumbnail
    const dir = path.dirname(filePath);
    const filename = path.basename(filePath);
    const possibleThumbnailPath = path.join(dir, 'thumbnails', filename);
    
    try {
      await fs.unlink(possibleThumbnailPath);
      console.log(`🗑️ Thumbnail eliminado`);
    } catch {
      // Thumbnail no existe, no pasa nada
    }

    return { success: true, message: 'Archivo eliminado' };

  } catch (error) {
    console.error('Error deleting file:', error);
    return { success: false, message: 'Error al eliminar archivo' };
  }
};

/**
 * Eliminar múltiples archivos
 */
export const deleteMultipleFiles = async (fileUrls) => {
  const results = await Promise.all(
    fileUrls.map(url => deleteFile(url))
  );
  return results;
};

/**
 * Obtener estadísticas de almacenamiento
 */
export const getStorageStats = async () => {
  try {
    const folders = ['avatars', 'gallery', 'events', 'documents'];
    const stats = {};

    for (const folder of folders) {
      const folderPath = path.join(UPLOAD_DIR, folder);
      try {
        const files = await fs.readdir(folderPath, { recursive: true });
        let totalSize = 0;
        let fileCount = 0;

        for (const file of files) {
          const filePath = path.join(folderPath, file);
          try {
            const stat = await fs.stat(filePath);
            if (stat.isFile()) {
              totalSize += stat.size;
              fileCount++;
            }
          } catch {
            continue;
          }
        }

        stats[folder] = {
          fileCount,
          totalSize,
          totalSizeMB: Math.round(totalSize / 1024 / 1024 * 100) / 100
        };
      } catch {
        stats[folder] = { fileCount: 0, totalSize: 0, totalSizeMB: 0 };
      }
    }

    return stats;

  } catch (error) {
    console.error('Error getting storage stats:', error);
    return {};
  }
};

// Exportar todo
export default {
  uploadImage,
  uploadAvatar,
  uploadGalleryImage,
  uploadEventImage,
  uploadDocument,
  deleteFile,
  deleteMultipleFiles,
  getStorageStats
};