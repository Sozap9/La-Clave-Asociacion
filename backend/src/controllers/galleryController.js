import Gallery from '../models/Gallery.js';
import { registrarActividad, getIpFromRequest } from '../utils/activityLogger.js';

/**
 * ========================================
 * FOLDERS - Endpoints de carpetas/álbumes
 * ========================================
 */

export const listFolders = async (req, res) => {
  try {
    const { visible, destacado, event_id, limit } = req.query;

    const filters = {};
    if (visible !== undefined) filters.visible = visible === 'true';
    if (destacado !== undefined) filters.destacado = destacado === 'true';
    if (event_id) filters.event_id = parseInt(event_id);
    if (limit) filters.limit = parseInt(limit);

    const folders = await Gallery.listFolders(filters);

    return res.status(200).json({
      success: true,
      count: folders.length,
      data: folders
    });
  } catch (error) {
    console.error('Error en listFolders:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener carpetas de galería',
      error: error.message
    });
  }
};

export const getFolderByIdOrSlug = async (req, res) => {
  try {
    const { identifier } = req.params;
    
    const field = isNaN(identifier) ? 'slug' : 'id';
    const value = field === 'id' ? parseInt(identifier) : identifier;

    const folder = await Gallery.findFolderBy(field, value);

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Carpeta no encontrada'
      });
    }

    const images = await Gallery.listImages(folder.id, true);

    return res.status(200).json({
      success: true,
      data: {
        ...folder,
        images
      }
    });
  } catch (error) {
    console.error('Error en getFolderByIdOrSlug:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener carpeta',
      error: error.message
    });
  }
};

export const createFolder = async (req, res) => {
  try {
    const { nombre, descripcion, fecha_evento, imagen_portada_url, visible, destacado, orden } = req.body;

    if (!nombre || nombre.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la carpeta es obligatorio'
      });
    }

    const folderData = {
      event_id: null,
      nombre: nombre.trim(),
      descripcion: descripcion || null,
      fecha_evento: fecha_evento || null,
      imagen_portada_url: imagen_portada_url || null,
      visible: visible !== undefined ? visible : true,
      destacado: destacado !== undefined ? destacado : false,
      orden: orden !== undefined ? parseInt(orden) : 0,
      created_by: req.user.id
    };

    const newFolder = await Gallery.createFolder(folderData);

    registrarActividad({
      userId: req.user?.id || null,
      accion: 'crear',
      entidadTipo: 'galeria',
      entidadId: newFolder.id,
      descripcion: `Carpeta de galería "${folderData.nombre}" creada`,
      ipAddress: getIpFromRequest(req),
    });

    return res.status(201).json({
      success: true,
      message: 'Carpeta creada exitosamente',
      data: newFolder
    });
  } catch (error) {
    console.error('Error en createFolder:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear carpeta',
      error: error.message
    });
  }
};

export const updateFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedFolder = await Gallery.updateFolder(id, updateData);

    if (!updatedFolder) {
      return res.status(404).json({
        success: false,
        message: 'Carpeta no encontrada'
      });
    }

    registrarActividad({
      userId: req.user?.id || null,
      accion: 'editar',
      entidadTipo: 'galeria',
      entidadId: Number(id),
      descripcion: `Carpeta de galería "${updatedFolder.nombre || `#${id}`}" editada`,
      ipAddress: getIpFromRequest(req),
    });

    return res.status(200).json({
      success: true,
      message: 'Carpeta actualizada exitosamente',
      data: updatedFolder
    });
  } catch (error) {
    console.error('Error en updateFolder:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar carpeta',
      error: error.message
    });
  }
};

export const deleteFolder = async (req, res) => {
  try {
    const { id } = req.params;

    const folder = await Gallery.findFolderBy('id', parseInt(id));
    const images = await Gallery.listImages(id, false);
    const deleted = await Gallery.deleteFolder(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Carpeta no encontrada'
      });
    }

    registrarActividad({
      userId: req.user?.id || null,
      accion: 'eliminar',
      entidadTipo: 'galeria',
      entidadId: Number(id),
      descripcion: `Carpeta de galería "${folder?.nombre || `#${id}`}" eliminada (${images.length} imagen${images.length !== 1 ? 'es' : ''})`,
      ipAddress: getIpFromRequest(req),
    });

    return res.status(200).json({
      success: true,
      message: 'Carpeta eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error en deleteFolder:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar carpeta',
      error: error.message
    });
  }
};

/**
 * Endpoints de imágenes
 */

export const listFolderImages = async (req, res) => {
  try {
    const { folderId } = req.params;
    const { visible_only } = req.query;

    const images = await Gallery.listImages(
      parseInt(folderId),
      visible_only === 'true'
    );

    return res.status(200).json({
      success: true,
      count: images.length,
      data: images
    });
  } catch (error) {
    console.error('Error en listFolderImages:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener imágenes',
      error: error.message
    });
  }
};

export const uploadImage = async (req, res) => {
  try {
    const { folderId } = req.params;
    const { titulo, descripcion, visible, destacado } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ninguna imagen'
      });
    }

    // Rutas REALES de Multer
    const imageData = {
      folder_id: parseInt(folderId),
      imagen_url: `/uploads/gallery/originals/${req.file.filename}`,
      thumbnail_url: req.thumbnail ? req.thumbnail.url : `/uploads/gallery/originals/${req.file.filename}`,
      titulo: titulo || null,
      descripcion: descripcion || null,
      ancho: req.imageMetadata ? req.imageMetadata.width : null,
      alto: req.imageMetadata ? req.imageMetadata.height : null,
      tamano_kb: Math.round(req.file.size / 1024),
      visible: visible !== undefined ? (visible === 'true' || visible === true) : true,
      destacado: destacado !== undefined ? (destacado === 'true' || destacado === true) : false,
      uploaded_by: req.user.id
    };

    const newImage = await Gallery.addImage(imageData);

    registrarActividad({
      userId: req.user?.id || null,
      accion: 'crear',
      entidadTipo: 'imagen',
      entidadId: newImage.id,
      descripcion: `Imagen ${titulo ? `"${titulo}" ` : ''}subida a la carpeta #${folderId}`,
      ipAddress: getIpFromRequest(req),
    });

    return res.status(201).json({
      success: true,
      message: 'Imagen subida exitosamente',
      data: newImage
    });
  } catch (error) {
    console.error('Error en uploadImage:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al subir imagen',
      error: error.message
    });
  }
};

export const updateImage = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedImage = await Gallery.updateImage(id, updateData);

    if (!updatedImage) {
      return res.status(404).json({
        success: false,
        message: 'Imagen no encontrada'
      });
    }

    registrarActividad({
      userId: req.user?.id || null,
      accion: 'editar',
      entidadTipo: 'imagen',
      entidadId: Number(id),
      descripcion: `Imagen #${id} editada`,
      ipAddress: getIpFromRequest(req),
    });

    return res.status(200).json({
      success: true,
      message: 'Imagen actualizada exitosamente',
      data: updatedImage
    });
  } catch (error) {
    console.error('Error en updateImage:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar imagen',
      error: error.message
    });
  }
};

export const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;

    const image = await Gallery.findImageById(id);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Imagen no encontrada'
      });
    }

    const deleted = await Gallery.deleteImage(id);

    registrarActividad({
      userId: req.user?.id || null,
      accion: 'eliminar',
      entidadTipo: 'imagen',
      entidadId: Number(id),
      descripcion: `Imagen ${image.titulo ? `"${image.titulo}" ` : `#${id} `}eliminada`,
      ipAddress: getIpFromRequest(req),
    });

    return res.status(200).json({
      success: true,
      message: 'Imagen eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error en deleteImage:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar imagen',
      error: error.message
    });
  }
};

export const reorderImages = async (req, res) => {
  try {
    const { folderId } = req.params;
    const { image_ids } = req.body;

    if (!Array.isArray(image_ids) || image_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un array de IDs (image_ids)'
      });
    }

    await Gallery.reorderImages(parseInt(folderId), image_ids);

    return res.status(200).json({
      success: true,
      message: 'Imágenes reordenadas exitosamente'
    });
  } catch (error) {
    console.error('Error en reorderImages:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al reordenar imágenes',
      error: error.message
    });
  }
};

/**
 * MÉTODOS NUEVOS - Gestión Global de Imágenes
 */

export const getAllImages = async (req, res) => {
  try {
    const { folder_id, visible, destacado, limit } = req.query;

    const filters = {};
    if (folder_id) filters.folder_id = parseInt(folder_id);
    if (visible !== undefined) filters.visible = visible === 'true';
    if (destacado !== undefined) filters.destacado = destacado === 'true';
    if (limit) filters.limit = parseInt(limit);

    const images = await Gallery.getAllImages(filters);

    return res.status(200).json({
      success: true,
      count: images.length,
      data: images
    });
  } catch (error) {
    console.error('Error en getAllImages:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener imágenes',
      error: error.message
    });
  }
};

export const getImageById = async (req, res) => {
  try {
    const { id } = req.params;
    const image = await Gallery.findImageById(id);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Imagen no encontrada'
      });
    }

    return res.status(200).json({
      success: true,
      data: image
    });
  } catch (error) {
    console.error('Error en getImageById:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener imagen',
      error: error.message
    });
  }
};

export const moveImageToFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const { folder_id } = req.body;

    if (!folder_id) {
      return res.status(400).json({
        success: false,
        message: 'folder_id es obligatorio'
      });
    }

    const updatedImage = await Gallery.moveImageToFolder(id, folder_id);

    return res.status(200).json({
      success: true,
      message: 'Imagen movida correctamente',
      data: updatedImage
    });
  } catch (error) {
    console.error('Error en moveImageToFolder:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al mover imagen',
      error: error.message
    });
  }
};

export const getFeaturedImages = async (req, res) => {
  try {
    const { limit = 12 } = req.query;
    const images = await Gallery.getFeaturedImages(parseInt(limit));

    return res.status(200).json({
      success: true,
      count: images.length,
      data: images
    });
  } catch (error) {
    console.error('Error en getFeaturedImages:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener imágenes destacadas',
      error: error.message
    });
  }
};

/**
 * ESTADÍSTICAS Y UTILIDADES
 */

export const getStats = async (req, res) => {
  try {
    const stats = await Gallery.getStats();

    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error en getStats:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};

export const getFeaturedFolders = async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    const folders = await Gallery.getFeaturedFolders(parseInt(limit));

    return res.status(200).json({
      success: true,
      count: folders.length,
      data: folders
    });
  } catch (error) {
    console.error('Error en getFeaturedFolders:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener carpetas destacadas',
      error: error.message
    });
  }
};

/**
 * ARTISTS - Endpoints de gestión de artistas
 */

export const getAllImagesWithArtists = async (req, res) => {
  try {
    const { folder_id, artist_id, limit } = req.query;

    const filters = {};
    if (folder_id) filters.folder_id = parseInt(folder_id);
    if (artist_id) filters.artist_id = parseInt(artist_id);
    if (limit) filters.limit = parseInt(limit);

    const images = await Gallery.getAllImagesWithArtists(filters);

    return res.status(200).json({
      success: true,
      count: images.length,
      data: images
    });
  } catch (error) {
    console.error('Error en getAllImagesWithArtists:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener imágenes',
      error: error.message
    });
  }
};

export const getImageArtists = async (req, res) => {
  try {
    const { imageId } = req.params;
    const artists = await Gallery.getImageArtists(parseInt(imageId));

    return res.status(200).json({
      success: true,
      count: artists.length,
      data: artists
    });
  } catch (error) {
    console.error('Error en getImageArtists:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener artistas de la imagen',
      error: error.message
    });
  }
};

export const addArtistToImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    const { artist_id } = req.body;

    if (!artist_id) {
      return res.status(400).json({
        success: false,
        message: 'El ID del artista es obligatorio'
      });
    }

    await Gallery.addArtistToImage(parseInt(imageId), parseInt(artist_id));

    return res.status(200).json({
      success: true,
      message: 'Artista añadido a la imagen'
    });
  } catch (error) {
    console.error('Error en addArtistToImage:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al añadir artista a la imagen',
      error: error.message
    });
  }
};

export const updateImageArtists = async (req, res) => {
  try {
    const { imageId } = req.params;
    const { artist_ids } = req.body;

    if (!Array.isArray(artist_ids)) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un array de IDs de artistas (artist_ids)'
      });
    }

    await Gallery.updateImageArtists(parseInt(imageId), artist_ids);

    return res.status(200).json({
      success: true,
      message: 'Artistas actualizados correctamente'
    });
  } catch (error) {
    console.error('Error en updateImageArtists:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar artistas',
      error: error.message
    });
  }
};

export const removeArtistFromImage = async (req, res) => {
  try {
    const { imageId, artistId } = req.params;

    await Gallery.removeArtistFromImage(parseInt(imageId), parseInt(artistId));

    return res.status(200).json({
      success: true,
      message: 'Artista eliminado de la imagen'
    });
  } catch (error) {
    console.error('Error en removeArtistFromImage:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar artista de la imagen',
      error: error.message
    });
  }
};

export const getFolderArtists = async (req, res) => {
  try {
    const { folderId } = req.params;
    const artists = await Gallery.getFolderArtists(parseInt(folderId));

    return res.status(200).json({
      success: true,
      count: artists.length,
      data: artists
    });
  } catch (error) {
    console.error('Error en getFolderArtists:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener artistas del álbum',
      error: error.message
    });
  }
};

export const addArtistToFolder = async (req, res) => {
  try {
    const { folderId } = req.params;
    const { artist_id } = req.body;

    if (!artist_id) {
      return res.status(400).json({
        success: false,
        message: 'El ID del artista es obligatorio'
      });
    }

    await Gallery.addArtistToFolder(parseInt(folderId), parseInt(artist_id));

    return res.status(200).json({
      success: true,
      message: 'Artista añadido al álbum'
    });
  } catch (error) {
    console.error('Error en addArtistToFolder:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al añadir artista al álbum',
      error: error.message
    });
  }
};

export const updateFolderArtists = async (req, res) => {
  try {
    const { folderId } = req.params;
    const { artist_ids } = req.body;

    if (!Array.isArray(artist_ids)) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un array de IDs de artistas (artist_ids)'
      });
    }

    await Gallery.updateFolderArtists(parseInt(folderId), artist_ids);

    return res.status(200).json({
      success: true,
      message: 'Artistas actualizados correctamente'
    });
  } catch (error) {
    console.error('Error en updateFolderArtists:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar artistas',
      error: error.message
    });
  }
};

export const removeArtistFromFolder = async (req, res) => {
  try {
    const { folderId, artistId } = req.params;

    await Gallery.removeArtistFromFolder(parseInt(folderId), parseInt(artistId));

    return res.status(200).json({
      success: true,
      message: 'Artista eliminado del álbum'
    });
  } catch (error) {
    console.error('Error en removeArtistFromFolder:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar artista del álbum',
      error: error.message
    });
  }
};

export const getContentByArtist = async (req, res) => {
  try {
    const { artistId } = req.params;
    const content = await Gallery.getContentByArtist(parseInt(artistId));

    return res.status(200).json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Error en getContentByArtist:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener contenido del artista',
      error: error.message
    });
  }
};

/**
 * Imagen de portada del álbum
 */
export const setCoverImage = async (req, res) => {
  try {
    const { folderId } = req.params;
    const { image_id } = req.body;

    if (!image_id) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere image_id'
      });
    }

    // Verificar que la imagen pertenece al folder
    const image = await Gallery.findImageById(image_id);
    
    if (!image || image.folder_id !== parseInt(folderId)) {
      return res.status(400).json({
        success: false,
        message: 'La imagen no pertenece a este álbum'
      });
    }

    // Actualizar la imagen de portada del folder
    const updatedFolder = await Gallery.updateFolder(folderId, {
      imagen_portada_url: image.imagen_url
    });

    return res.status(200).json({
      success: true,
      message: 'Imagen de portada actualizada',
      data: updatedFolder
    });
  } catch (error) {
    console.error('Error en setCoverImage:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al establecer imagen de portada',
      error: error.message
    });
  }
};

/**
 *Actualizar múltiples imágenes
 */
export const bulkUpdateImages = async (req, res) => {
  try {
    const { image_ids, updates } = req.body;

    if (!Array.isArray(image_ids) || image_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un array de IDs (image_ids)'
      });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren actualizaciones (updates)'
      });
    }

    // Actualizar cada imagen
    const results = [];
    for (const imageId of image_ids) {
      try {
        const updated = await Gallery.updateImage(imageId, updates);
        if (updated) {
          results.push({ id: imageId, success: true });
        } else {
          results.push({ id: imageId, success: false, error: 'Imagen no encontrada' });
        }
      } catch (err) {
        results.push({ id: imageId, success: false, error: err.message });
      }
    }

    const successCount = results.filter(r => r.success).length;

    registrarActividad({
      userId: req.user?.id || null,
      accion: 'actualizar',
      entidadTipo: 'imagen',
      entidadId: null,
      descripcion: `Actualización masiva: ${successCount} de ${image_ids.length} imágenes`,
      ipAddress: getIpFromRequest(req),
    });

    return res.status(200).json({
      success: true,
      message: `${successCount} de ${image_ids.length} imágenes actualizadas`,
      data: {
        total: image_ids.length,
        updated: successCount,
        failed: image_ids.length - successCount,
        results
      }
    });
  } catch (error) {
    console.error('Error en bulkUpdateImages:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar imágenes',
      error: error.message
    });
  }
};

/**
 * Eliminar múltiples imágenes
 */
export const bulkDeleteImages = async (req, res) => {
  try {
    const { image_ids } = req.body;

    if (!Array.isArray(image_ids) || image_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un array de IDs (image_ids)'
      });
    }

    // Eliminar cada imagen
    const results = [];
    for (const imageId of image_ids) {
      try {
        const deleted = await Gallery.deleteImage(imageId);
        if (deleted) {
          results.push({ id: imageId, success: true });
        } else {
          results.push({ id: imageId, success: false, error: 'Imagen no encontrada' });
        }
      } catch (err) {
        results.push({ id: imageId, success: false, error: err.message });
      }
    }

    const successCount = results.filter(r => r.success).length;

    registrarActividad({
      userId: req.user?.id || null,
      accion: 'eliminar',
      entidadTipo: 'imagen',
      entidadId: null,
      descripcion: `Eliminación masiva: ${successCount} de ${image_ids.length} imágenes`,
      ipAddress: getIpFromRequest(req),
    });

    return res.status(200).json({
      success: true,
      message: `${successCount} de ${image_ids.length} imágenes eliminadas`,
      data: {
        total: image_ids.length,
        deleted: successCount,
        failed: image_ids.length - successCount,
        results
      }
    });
  } catch (error) {
    console.error('Error en bulkDeleteImages:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar imágenes',
      error: error.message
    });
  }
};