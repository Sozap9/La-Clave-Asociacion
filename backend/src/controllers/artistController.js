import Artist from '../models/Artist.js';
import logger from '../config/logger.js';

/**
 * Listar artistas con filtros
 * GET /api/artists
 */
export const listArtists = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search,
      genero,
      sello,
      ciudad,
      pais_origen,
      activo, 
      verificado, 
      destacado 
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit)
    };

    if (search) options.search = search;
    if (genero) options.genero = genero;
    if (sello) options.sello = sello;
    if (ciudad) options.ciudad = ciudad;
    if (pais_origen) options.pais_origen = pais_origen;
    if (activo !== undefined) options.activo = activo === 'true';
    if (verificado !== undefined) options.verificado = verificado === 'true';
    if (destacado !== undefined) options.destacado = destacado === 'true';

    const result = await Artist.list(options);

    return res.status(200).json({
      success: true,
      data: {
        artists: result.artists,
        pagination: {
          total: result.total,
          page: result.page,
          pages: result.pages
        },
        filters: result.filters
      }
    });
  } catch (error) {
    logger.error('Error en listArtists:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al listar artistas'
    });
  }
};

/**
 * Detalle de un artista
 * GET /api/artists/:id
 */
export const getArtistById = async (req, res) => {
  try {
    const { id } = req.params;
    const artist = await Artist.findById(id);

    if (!artist) {
      return res.status(404).json({
        success: false,
        message: 'Artista no encontrado'
      });
    }

    const stats = await Artist.getStats(id);

    return res.status(200).json({
      success: true,
      data: {
        ...artist,
        stats
      }
    });
  } catch (error) {
    logger.error('Error en getArtistById:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener artista'
    });
  }
};

/**
 * Crear artista (admin)
 * POST /api/artists
 */
export const createArtist = async (req, res) => {
  try {
    const artistData = req.body;

    if (!artistData.nombre_artistico) {
      return res.status(400).json({
        success: false,
        message: 'El nombre artístico es obligatorio'
      });
    }

    const artist = await Artist.create(artistData);

    return res.status(201).json({
      success: true,
      message: 'Artista creado exitosamente',
      data: artist
    });
  } catch (error) {
    logger.error('Error en createArtist:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear artista'
    });
  }
};

/**
 * Editar artista (admin)
 * PUT /api/artists/:id
 */
export const updateArtist = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const artist = await Artist.findById(id);
    if (!artist) {
      return res.status(404).json({
        success: false,
        message: 'Artista no encontrado'
      });
    }

    await Artist.update(id, updateData);
    const updatedArtist = await Artist.findById(id);

    return res.status(200).json({
      success: true,
      message: 'Artista actualizado exitosamente',
      data: updatedArtist
    });
  } catch (error) {
    logger.error('Error en updateArtist:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar artista'
    });
  }
};

/**
 * Borrar artista (admin)
 * DELETE /api/artists/:id
 */
export const deleteArtist = async (req, res) => {
  try {
    const { id } = req.params;

    const artist = await Artist.findById(id);
    if (!artist) {
      return res.status(404).json({
        success: false,
        message: 'Artista no encontrado'
      });
    }

    await Artist.delete(id);

    return res.status(200).json({
      success: true,
      message: 'Artista eliminado exitosamente'
    });
  } catch (error) {
    logger.error('Error en deleteArtist:', error);
    
    if (error.message.includes('eventos asociados')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error al eliminar artista'
    });
  }
};

/**
 * Desactivar artista (admin)
 * PATCH /api/artists/:id/deactivate
 */
export const deactivateArtist = async (req, res) => {
  try {
    const { id } = req.params;

    const artist = await Artist.findById(id);
    if (!artist) {
      return res.status(404).json({
        success: false,
        message: 'Artista no encontrado'
      });
    }

    await Artist.deactivate(id);

    return res.status(200).json({
      success: true,
      message: 'Artista desactivado exitosamente'
    });
  } catch (error) {
    logger.error('Error en deactivateArtist:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al desactivar artista'
    });
  }
};

/**
 * Marcar o quitar destacado (admin)
 * PATCH /api/artists/:id/featured
 */
export const toggleFeatured = async (req, res) => {
  try {
    const { id } = req.params;
    
    // featured llega en el body o en la query; por defecto true
    let featured = true;
    
    if (req.body && req.body.featured !== undefined) {
      if (typeof req.body.featured === 'boolean') {
        featured = req.body.featured;
      } else if (typeof req.body.featured === 'string') {
        featured = req.body.featured === 'true';
      } else if (typeof req.body.featured === 'number') {
        featured = req.body.featured === 1;
      }
    } 
    else if (req.query && req.query.featured !== undefined) {
      featured = req.query.featured === 'true';
    }

    const artist = await Artist.findById(id);
    if (!artist) {
      return res.status(404).json({
        success: false,
        message: 'Artista no encontrado'
      });
    }

    await Artist.setFeatured(id, featured);

    return res.status(200).json({
      success: true,
      message: `Artista ${featured ? 'marcado' : 'desmarcado'} como destacado`,
      data: {
        id: parseInt(id),
        destacado: featured
      }
    });
  } catch (error) {
    logger.error('Error en toggleFeatured:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar estado destacado'
    });
  }
};

/**
 * Artistas activos, para los selects
 * GET /api/artists/active
 */
export const getActiveArtists = async (req, res) => {
  try {
    const artists = await Artist.getActive();

    return res.status(200).json({
      success: true,
      data: artists
    });
  } catch (error) {
    logger.error('Error en getActiveArtists:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener artistas activos'
    });
  }
};

/**
 * Artistas destacados
 * GET /api/artists/featured
 */
export const getFeaturedArtists = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const artists = await Artist.getFeatured(limit);

    return res.status(200).json({
      success: true,
      data: artists
    });
  } catch (error) {
    logger.error('Error en getFeaturedArtists:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener artistas destacados'
    });
  }
};

/**
 * Buscar artistas
 * GET /api/artists/search
 */
export const searchArtists = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'El término de búsqueda debe tener al menos 2 caracteres'
      });
    }

    const artists = await Artist.search(q);

    return res.status(200).json({
      success: true,
      data: artists
    });
  } catch (error) {
    logger.error('Error en searchArtists:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al buscar artistas'
    });
  }
};

/**
 * Eventos de un artista
 * GET /api/artists/:id/eventos
 */
export const getArtistEventos = async (req, res) => {
  try {
    const { id } = req.params;
    const { proximos = 'false' } = req.query;

    const artist = await Artist.findById(id);
    if (!artist) {
      return res.status(404).json({
        success: false,
        message: 'Artista no encontrado'
      });
    }

    const eventos = await Artist.getEventos(id, proximos === 'true');

    return res.status(200).json({
      success: true,
      data: eventos
    });
  } catch (error) {
    logger.error('Error en getArtistEventos:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener eventos del artista'
    });
  }
};

/**
 * Reactivar un artista desactivado
 * PATCH /api/artists/:id/activate
 */
export const activateArtist = async (req, res) => {
  try {
    const { id } = req.params;

    const artist = await Artist.findById(id);
    if (!artist) {
      return res.status(404).json({
        success: false,
        message: 'Artista no encontrado'
      });
    }

    if (artist.activo) {
      return res.status(400).json({
        success: false,
        message: 'El artista ya está activo'
      });
    }

    await Artist.activate(id);

    return res.status(200).json({
      success: true,
      message: 'Artista reactivado exitosamente'
    });
  } catch (error) {
    logger.error('Error en activateArtist:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al reactivar artista'
    });
  }
};

export default {
  listArtists,
  getArtistById,
  createArtist,
  updateArtist,
  deleteArtist,
  deactivateArtist,
  activateArtist,
  toggleFeatured,
  getActiveArtists,
  getFeaturedArtists,
  searchArtists,
  getArtistEventos
};
