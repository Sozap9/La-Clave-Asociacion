import { query } from '../config/database.js';
import logger from '../config/logger.js';

// Galería: álbumes, imágenes y artistas etiquetados
class Gallery {
  // Álbumes

  static async listFolders(filters = {}) {
    try {
      let sql = `
        SELECT 
          gf.*,
          u.nombre as created_by_nombre,
          COUNT(DISTINCT gi.id) as total_imagenes,
          SUM(gi.tamano_kb) as tamano_total_kb
        FROM gallery_folders gf
        LEFT JOIN users u ON gf.created_by = u.id
        LEFT JOIN gallery_images gi ON gf.id = gi.folder_id
        WHERE 1=1
      `;
      const params = [];

      if (filters.visible !== undefined) {
        sql += ' AND gf.visible = ?';
        params.push(filters.visible ? 1 : 0);
      }

      if (filters.destacado !== undefined) {
        sql += ' AND gf.destacado = ?';
        params.push(filters.destacado ? 1 : 0);
      }

      if (filters.event_id) {
        sql += ' AND gf.event_id = ?';
        params.push(filters.event_id);
      }

      sql += ' GROUP BY gf.id';
      sql += ' ORDER BY gf.created_at DESC, gf.fecha_evento DESC';

      if (filters.limit) {
        sql += ' LIMIT ?';
        params.push(parseInt(filters.limit));
      }

      const results = await query(sql, params);
      return results;
    } catch (error) {
      logger.error('Error en Gallery.listFolders:', error);
      throw error;
    }
  }

  static async findFolderBy(field, value) {
    try {
      const allowedFields = ['id', 'slug'];
      if (!allowedFields.includes(field)) {
        throw new Error('Campo no permitido');
      }

      const sql = `
        SELECT 
          gf.*,
          u.nombre as created_by_nombre,
          COUNT(DISTINCT gi.id) as total_imagenes,
          SUM(gi.tamano_kb) as tamano_total_kb
        FROM gallery_folders gf
        LEFT JOIN users u ON gf.created_by = u.id
        LEFT JOIN gallery_images gi ON gf.id = gi.folder_id
        WHERE gf.${field} = ?
        GROUP BY gf.id
        LIMIT 1
      `;

      const results = await query(sql, [value]);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      logger.error('Error en Gallery.findFolderBy:', error);
      throw error;
    }
  }

  static async createFolder(folderData) {
    try {
      const {
        event_id = null,
        nombre,
        descripcion = null,
        fecha_evento = null,
        imagen_portada_url = null,
        visible = true,
        destacado = false,
        orden = 0,
        created_by
      } = folderData;

      if (!nombre || nombre.trim().length === 0) {
        throw new Error('El nombre es obligatorio');
      }

      const baseSlug = nombre
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      let slug = baseSlug;
      let counter = 1;
      let slugExists = true;

      while (slugExists) {
        const checkSql = 'SELECT id FROM gallery_folders WHERE slug = ?';
        const existing = await query(checkSql, [slug]);
        
        if (existing.length === 0) {
          slugExists = false;
        } else {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }
      }

      const sql = `
        INSERT INTO gallery_folders (
          event_id, nombre, slug, descripcion, fecha_evento,
          imagen_portada_url, visible, destacado, orden, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const results = await query(sql, [
        event_id,
        nombre.trim(),
        slug,
        descripcion,
        fecha_evento,
        imagen_portada_url,
        visible ? 1 : 0,
        destacado ? 1 : 0,
        orden,
        created_by
      ]);

      return {
        id: results.insertId,
        slug,
        ...folderData
      };
    } catch (error) {
      logger.error('Error en Gallery.createFolder:', error);
      throw error;
    }
  }

  static async updateFolder(id, updateData) {
    try {
      const allowedFields = [
        'nombre', 'descripcion', 'fecha_evento', 'imagen_portada_url',
        'visible', 'destacado', 'orden', 'event_id'
      ];

      const fields = [];
      const values = [];

      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key)) {
          fields.push(`${key} = ?`);
          if (typeof updateData[key] === 'boolean') {
            values.push(updateData[key] ? 1 : 0);
          } else {
            values.push(updateData[key]);
          }
        }
      });

      if (fields.length === 0) {
        throw new Error('No hay campos válidos para actualizar');
      }

      values.push(id);

      const sql = `
        UPDATE gallery_folders 
        SET ${fields.join(', ')}, updated_at = NOW()
        WHERE id = ?
      `;

      await query(sql, values);
      return this.findFolderBy('id', id);
    } catch (error) {
      logger.error('Error en Gallery.updateFolder:', error);
      throw error;
    }
  }

  static async deleteFolder(id) {
    try {
      const sql = 'DELETE FROM gallery_folders WHERE id = ?';
      const results = await query(sql, [id]);
      return results.affectedRows > 0;
    } catch (error) {
      logger.error('Error en Gallery.deleteFolder:', error);
      throw error;
    }
  }

  // Imágenes

  static async listImages(folderId, visibleOnly = false) {
    try {
      let sql = `
        SELECT 
          gi.*,
          u.nombre as uploaded_by_nombre
        FROM gallery_images gi
        LEFT JOIN users u ON gi.uploaded_by = u.id
        WHERE gi.folder_id = ?
      `;
      const params = [folderId];

      if (visibleOnly) {
        sql += ' AND gi.visible = 1';
      }

      sql += ' ORDER BY gi.created_at DESC';

      const results = await query(sql, params);
      return results;
    } catch (error) {
      logger.error('Error en Gallery.listImages:', error);
      throw error;
    }
  }

  static async findImageById(id) {
    try {
      const sql = `
        SELECT 
          gi.*,
          u.nombre as uploaded_by_nombre,
          gf.nombre as folder_nombre,
          gf.slug as folder_slug
        FROM gallery_images gi
        LEFT JOIN users u ON gi.uploaded_by = u.id
        LEFT JOIN gallery_folders gf ON gi.folder_id = gf.id
        WHERE gi.id = ?
        LIMIT 1
      `;

      const results = await query(sql, [id]);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      logger.error('Error en Gallery.findImageById:', error);
      throw error;
    }
  }

  static async addImage(imageData) {
  try {
    const {
      folder_id,
      imagen_url,
      thumbnail_url = null,
      titulo = null,
      descripcion = null,
      ancho = null,
      alto = null,
      tamano_kb = null,
      visible = true,
      destacado = false,
      uploaded_by
    } = imageData;

    const orderSql = 'SELECT COALESCE(MAX(orden), 0) + 1 as next_orden FROM gallery_images WHERE folder_id = ?';
    
    const orderResult = await query(orderSql, [folder_id]);
    const nextOrden = orderResult[0].next_orden;

    const sql = `
      INSERT INTO gallery_images (
        folder_id, imagen_url, thumbnail_url, titulo, descripcion,
        ancho, alto, tamano_kb, visible, destacado, orden, uploaded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const results = await query(sql, [
      folder_id,
      imagen_url,
      thumbnail_url,
      titulo,
      descripcion,
      ancho,
      alto,
      tamano_kb,
      visible ? 1 : 0,
      destacado ? 1 : 0,
      nextOrden,
      uploaded_by
    ]);

    logger.debug('Imagen añadida a la galería', { imageId: results.insertId, folderId: folder_id });

    return {
      id: results.insertId,
      ...imageData,
      orden: nextOrden
    };
  } catch (error) {
    logger.error('=== ERROR en addImage ===');
    logger.error('Error completo:', error);
    logger.error('Stack:', { stack: error.stack });
    throw error;
  }
}

static async updateImage(id, updateData) {
  try {
    const allowedFields = ['titulo', 'descripcion', 'folder_id', 'orden', 'visible', 'destacado'];

    const fields = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        if (typeof updateData[key] === 'boolean') {
          values.push(updateData[key] ? 1 : 0);
        } else {
          values.push(updateData[key]);
        }
      }
    });

    if (fields.length === 0) {
      throw new Error('No hay campos válidos para actualizar');
    }

    values.push(id);

    const sql = `
      UPDATE gallery_images 
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = ?
    `;

    await query(sql, values);
    return this.findImageById(id);
  } catch (error) {
    logger.error('Error en Gallery.updateImage:', error);
    throw error;
  }
}

  static async deleteImage(id) {
    try {
      const sql = 'DELETE FROM gallery_images WHERE id = ?';
      const results = await query(sql, [id]);
      return results.affectedRows > 0;
    } catch (error) {
      logger.error('Error en Gallery.deleteImage:', error);
      throw error;
    }
  }

  static async reorderImages(folderId, imageIdsArray) {
    try {
      for (let i = 0; i < imageIdsArray.length; i++) {
        const imageId = imageIdsArray[i];
        const newOrder = i + 1;

        const sql = `
          UPDATE gallery_images 
          SET orden = ? 
          WHERE id = ? AND folder_id = ?
        `;

        await query(sql, [newOrder, imageId, folderId]);
      }

      return true;
    } catch (error) {
      logger.error('Error en Gallery.reorderImages:', error);
      throw error;
    }
  }

  // Imágenes de todos los álbumes

  static async getAllImages(filters = {}) {
    try {
      let sql = `
        SELECT 
          gi.*,
          u.nombre as uploaded_by_nombre,
          gf.nombre as folder_nombre,
          gf.slug as folder_slug
        FROM gallery_images gi
        LEFT JOIN users u ON gi.uploaded_by = u.id
        LEFT JOIN gallery_folders gf ON gi.folder_id = gf.id
        WHERE 1=1
      `;
      const params = [];

      if (filters.folder_id) {
        sql += ' AND gi.folder_id = ?';
        params.push(parseInt(filters.folder_id));
      }

      if (filters.visible !== undefined) {
        sql += ' AND gi.visible = ?';
        params.push(filters.visible ? 1 : 0);
      }

      if (filters.destacado !== undefined) {
        sql += ' AND gi.destacado = ?';
        params.push(filters.destacado ? 1 : 0);
      }

      sql += ' ORDER BY gi.created_at DESC';

      if (filters.limit) {
        sql += ' LIMIT ?';
        params.push(parseInt(filters.limit));
      }

      const results = await query(sql, params);
      return results;
    } catch (error) {
      logger.error('Error en Gallery.getAllImages:', error);
      throw error;
    }
  }

  static async moveImageToFolder(imageId, newFolderId) {
    try {
      const sql = `
        UPDATE gallery_images 
        SET folder_id = ?, updated_at = NOW()
        WHERE id = ?
      `;

      await query(sql, [newFolderId, imageId]);
      return this.findImageById(imageId);
    } catch (error) {
      logger.error('Error en Gallery.moveImageToFolder:', error);
      throw error;
    }
  }

  static async getFeaturedImages(limit = 12) {
    try {
      const limitNum = parseInt(limit) || 12;
      
      const sql = `
        SELECT 
          gi.*,
          gf.nombre as folder_nombre,
          gf.slug as folder_slug
        FROM gallery_images gi
        LEFT JOIN gallery_folders gf ON gi.folder_id = gf.id
        WHERE gi.destacado = 1 
          AND gi.visible = 1
          AND gf.visible = 1
        ORDER BY gi.created_at DESC
        LIMIT ${limitNum}
      `;

      const results = await query(sql);
      return results;
    } catch (error) {
      logger.error('Error en Gallery.getFeaturedImages:', error);
      throw error;
    }
  }

  // Artistas de un álbum

  static async getFolderArtists(folderId) {
    try {
      const sql = `
        SELECT 
          a.*
        FROM artists a
        INNER JOIN gallery_folder_artists gfa ON a.id = gfa.artist_id
        WHERE gfa.folder_id = ?
        ORDER BY a.nombre_artistico ASC
      `;

      const results = await query(sql, [folderId]);
      return results.map(artist => ({
        ...artist,
        nombre: artist.nombre_artistico,
        slug: artist.nombre_artistico.toLowerCase().replace(/\s+/g, '-'),
        tipo: 'artista'
      }));
    } catch (error) {
      logger.error('Error en Gallery.getFolderArtists:', error);
      throw error;
    }
  }

  static async addArtistToFolder(folderId, artistId) {
    try {
      const checkSql = 'SELECT id FROM gallery_folder_artists WHERE folder_id = ? AND artist_id = ?';
      const existing = await query(checkSql, [folderId, artistId]);

      if (existing.length > 0) {
        return { alreadyExists: true };
      }

      const sql = 'INSERT INTO gallery_folder_artists (folder_id, artist_id) VALUES (?, ?)';
      await query(sql, [folderId, artistId]);
      
      return { success: true };
    } catch (error) {
      logger.error('Error en Gallery.addArtistToFolder:', error);
      throw error;
    }
  }

  static async updateFolderArtists(folderId, artistIds) {
    try {
      await query('DELETE FROM gallery_folder_artists WHERE folder_id = ?', [folderId]);

      if (artistIds.length > 0) {
        const values = artistIds.map(artistId => [folderId, artistId]);
        const placeholders = artistIds.map(() => '(?, ?)').join(', ');
        const sql = `INSERT INTO gallery_folder_artists (folder_id, artist_id) VALUES ${placeholders}`;
        await query(sql, values.flat());
      }

      return { success: true };
    } catch (error) {
      logger.error('Error en Gallery.updateFolderArtists:', error);
      throw error;
    }
  }

  static async removeArtistFromFolder(folderId, artistId) {
    try {
      const sql = 'DELETE FROM gallery_folder_artists WHERE folder_id = ? AND artist_id = ?';
      const results = await query(sql, [folderId, artistId]);
      return results.affectedRows > 0;
    } catch (error) {
      logger.error('Error en Gallery.removeArtistFromFolder:', error);
      throw error;
    }
  }

  // Artistas de una imagen

  static async getAllImagesWithArtists(filters = {}) {
    try {
      let sql = `
        SELECT 
          gi.*,
          gf.nombre as folder_nombre,
          gf.slug as folder_slug,
          GROUP_CONCAT(DISTINCT a.id) as artist_ids,
          GROUP_CONCAT(DISTINCT a.nombre_artistico) as artist_nombres
        FROM gallery_images gi
        LEFT JOIN gallery_folders gf ON gi.folder_id = gf.id
        LEFT JOIN gallery_image_artists gia ON gi.id = gia.image_id
        LEFT JOIN artists a ON gia.artist_id = a.id
        WHERE 1=1
      `;
      const params = [];

      if (filters.folder_id) {
        sql += ' AND gi.folder_id = ?';
        params.push(parseInt(filters.folder_id));
      }

      if (filters.artist_id) {
        sql += ' AND gia.artist_id = ?';
        params.push(parseInt(filters.artist_id));
      }

      sql += ' GROUP BY gi.id';
      sql += ' ORDER BY gi.created_at DESC';

      if (filters.limit) {
        sql += ' LIMIT ?';
        params.push(parseInt(filters.limit));
      }

      const results = await query(sql, params);
      return results;
    } catch (error) {
      logger.error('Error en Gallery.getAllImagesWithArtists:', error);
      throw error;
    }
  }

  static async getImageArtists(imageId) {
    try {
      const sql = `
        SELECT 
          a.*
        FROM artists a
        INNER JOIN gallery_image_artists gia ON a.id = gia.artist_id
        WHERE gia.image_id = ?
        ORDER BY a.nombre_artistico ASC
      `;

      const results = await query(sql, [imageId]);
      return results.map(artist => ({
        ...artist,
        nombre: artist.nombre_artistico,
        slug: artist.nombre_artistico.toLowerCase().replace(/\s+/g, '-'),
        tipo: 'artista'
      }));
    } catch (error) {
      logger.error('Error en Gallery.getImageArtists:', error);
      throw error;
    }
  }

  static async addArtistToImage(imageId, artistId) {
    try {
      const checkSql = 'SELECT id FROM gallery_image_artists WHERE image_id = ? AND artist_id = ?';
      const existing = await query(checkSql, [imageId, artistId]);

      if (existing.length > 0) {
        return { alreadyExists: true };
      }

      const sql = 'INSERT INTO gallery_image_artists (image_id, artist_id) VALUES (?, ?)';
      await query(sql, [imageId, artistId]);
      
      return { success: true };
    } catch (error) {
      logger.error('Error en Gallery.addArtistToImage:', error);
      throw error;
    }
  }

  static async updateImageArtists(imageId, artistIds) {
    try {
      await query('DELETE FROM gallery_image_artists WHERE image_id = ?', [imageId]);

      if (artistIds.length > 0) {
        const values = artistIds.map(artistId => [imageId, artistId]);
        const placeholders = artistIds.map(() => '(?, ?)').join(', ');
        const sql = `INSERT INTO gallery_image_artists (image_id, artist_id) VALUES ${placeholders}`;
        await query(sql, values.flat());
      }

      return { success: true };
    } catch (error) {
      logger.error('Error en Gallery.updateImageArtists:', error);
      throw error;
    }
  }

  static async removeArtistFromImage(imageId, artistId) {
    try {
      const sql = 'DELETE FROM gallery_image_artists WHERE image_id = ? AND artist_id = ?';
      const results = await query(sql, [imageId, artistId]);
      return results.affectedRows > 0;
    } catch (error) {
      logger.error('Error en Gallery.removeArtistFromImage:', error);
      throw error;
    }
  }

  static async getContentByArtist(artistId) {
    try {
      const foldersSql = `
        SELECT DISTINCT
          gf.*,
          COUNT(DISTINCT gi.id) as total_imagenes
        FROM gallery_folders gf
        INNER JOIN gallery_folder_artists gfa ON gf.id = gfa.folder_id
        LEFT JOIN gallery_images gi ON gf.id = gi.folder_id
        WHERE gfa.artist_id = ? AND gf.visible = 1
        GROUP BY gf.id
        ORDER BY gf.created_at DESC
      `;

      const imagesSql = `
        SELECT DISTINCT
          gi.*,
          gf.nombre as folder_nombre,
          gf.slug as folder_slug
        FROM gallery_images gi
        INNER JOIN gallery_image_artists gia ON gi.id = gia.image_id
        INNER JOIN gallery_folders gf ON gi.folder_id = gf.id
        WHERE gia.artist_id = ? AND gi.visible = 1 AND gf.visible = 1
        ORDER BY gi.created_at DESC
      `;

      const folders = await query(foldersSql, [artistId]);
      const images = await query(imagesSql, [artistId]);

      return {
        folders,
        images
      };
    } catch (error) {
      logger.error('Error en Gallery.getContentByArtist:', error);
      throw error;
    }
  }

  // Estadísticas

  static async getStats() {
    try {
      const sql = `
        SELECT 
          (SELECT COUNT(*) FROM gallery_folders) as total_folders,
          (SELECT COUNT(*) FROM gallery_folders WHERE visible = 1) as folders_visibles,
          (SELECT COUNT(*) FROM gallery_folders WHERE destacado = 1) as folders_destacados,
          (SELECT COUNT(*) FROM gallery_images) as total_imagenes,
          (SELECT COUNT(*) FROM gallery_images WHERE visible = 1) as imagenes_visibles,
          (SELECT ROUND(SUM(tamano_kb) / 1024, 2) FROM gallery_images) as total_size_mb,
          (SELECT COUNT(DISTINCT event_id) FROM gallery_folders WHERE event_id IS NOT NULL) as eventos_con_galeria
      `;

      const results = await query(sql);
      return results[0];
    } catch (error) {
      logger.error('Error en Gallery.getStats:', error);
      throw error;
    }
  }

  static async getFeaturedFolders(limit = 6) {
    try {
      const limitNum = parseInt(limit) || 6;
      
      const sql = `
        SELECT 
          gf.*,
          u.nombre as created_by_nombre,
          COUNT(DISTINCT gi.id) as total_imagenes
        FROM gallery_folders gf
        LEFT JOIN users u ON gf.created_by = u.id
        LEFT JOIN gallery_images gi ON gf.id = gi.folder_id
        WHERE gf.destacado = 1 
          AND gf.visible = 1
        GROUP BY gf.id
        ORDER BY gf.created_at DESC
        LIMIT ${limitNum}
      `;

      const results = await query(sql);
      return results;
    } catch (error) {
      logger.error('Error en Gallery.getFeaturedFolders:', error);
      throw error;
    }
  }
}

export default Gallery;
