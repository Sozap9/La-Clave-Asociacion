import Venue from '../models/Venue.js';

/**
 * Listar venues
 * GET /api/venues
 */
export const listVenues = async (req, res) => {
  try {
    const { page = 1, limit = 20, activo, tipo_local, ciudad } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit)
    };

    if (activo !== undefined) options.activo = activo === 'true';
    if (tipo_local) options.tipo_local = tipo_local;
    if (ciudad) options.ciudad = ciudad;

    const result = await Venue.list(options);

    return res.status(200).json({
      success: true,
      data: {
        venues: result.venues,
        pagination: {
          total: result.total,
          page: result.page,
          pages: result.pages
        }
      }
    });
  } catch (error) {
    console.error('Error en listVenues:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al listar venues'
    });
  }
};

/**
 * Obtener venue por ID
 * GET /api/venues/:id
 */
export const getVenueById = async (req, res) => {
  try {
    const { id } = req.params;
    const venue = await Venue.findById(id);

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue no encontrado'
      });
    }

    // Obtener estadísticas adicionales
    const stats = await Venue.getStats(id);

    return res.status(200).json({
      success: true,
      data: {
        ...venue,
        stats
      }
    });
  } catch (error) {
    console.error('Error en getVenueById:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener venue'
    });
  }
};

/**
 * Crear venue
 * POST /api/venues
 * ADMIN only
 */
export const createVenue = async (req, res) => {
  try {
    const venueData = req.body;

    if (!venueData.nombre || !venueData.direccion || !venueData.ciudad) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, dirección y ciudad son obligatorios'
      });
    }

    const venue = await Venue.create(venueData);

    return res.status(201).json({
      success: true,
      message: 'Venue creado exitosamente',
      data: venue
    });
  } catch (error) {
    console.error('Error en createVenue:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear venue'
    });
  }
};

/**
 * Actualizar venue
 * PUT /api/venues/:id
 * ADMIN only
 */
export const updateVenue = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const venue = await Venue.findById(id);
    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue no encontrado'
      });
    }

    await Venue.update(id, updateData);
    const updatedVenue = await Venue.findById(id);

    return res.status(200).json({
      success: true,
      message: 'Venue actualizado exitosamente',
      data: updatedVenue
    });
  } catch (error) {
    console.error('Error en updateVenue:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar venue'
    });
  }
};

/**
 * Eliminar venue
 * DELETE /api/venues/:id
 * ADMIN only
 */
export const deleteVenue = async (req, res) => {
  try {
    const { id } = req.params;

    const venue = await Venue.findById(id);
    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue no encontrado'
      });
    }

    await Venue.delete(id);

    return res.status(200).json({
      success: true,
      message: 'Venue eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error en deleteVenue:', error);
    
    if (error.message.includes('eventos asociados')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error al eliminar venue'
    });
  }
};

/**
 * Desactivar venue
 * PATCH /api/venues/:id/deactivate
 * ADMIN only
 */
export const deactivateVenue = async (req, res) => {
  try {
    const { id } = req.params;

    const venue = await Venue.findById(id);
    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue no encontrado'
      });
    }

    await Venue.deactivate(id);

    return res.status(200).json({
      success: true,
      message: 'Venue desactivado exitosamente'
    });
  } catch (error) {
    console.error('Error en deactivateVenue:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al desactivar venue'
    });
  }
};

/**
 * Reactivar un venue desactivado
 * PATCH /api/venues/:id/activate
 */
export const activateVenue = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el venue existe
    const venue = await Venue.findById(id);
    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue no encontrado'
      });
    }

    // Verificar que está desactivado
    if (venue.activo) {
      return res.status(400).json({
        success: false,
        message: 'El venue ya está activo'
      });
    }

    // Reactivar
    await Venue.activate(id);

    return res.status(200).json({
      success: true,
      message: 'Venue reactivado exitosamente'
    });
  } catch (error) {
    console.error('Error en activateVenue:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al reactivar venue'
    });
  }
};

/**
 * Obtener venues activos (para selects)
 * GET /api/venues/active
 */
export const getActiveVenues = async (req, res) => {
  try {
    const venues = await Venue.getActive();

    return res.status(200).json({
      success: true,
      data: venues
    });
  } catch (error) {
    console.error('Error en getActiveVenues:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener venues activos'
    });
  }
};

export default {
  listVenues,
  getVenueById,
  createVenue,
  updateVenue,
  deleteVenue,
  deactivateVenue,
  activateVenue, 
  getActiveVenues
};