const API_URL = import.meta.env.VITE_API_URL;

/**
 * Obtener todos los eventos (públicos)
 */
export const getAllEvents = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.featured) queryParams.append('featured', filters.featured);
    
    const response = await fetch(`${API_URL}/events?${queryParams}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al obtener eventos:', error);
    throw error;
  }
};

/**
 * Obtener eventos destacados (hasta 6)
 */
export const getFeaturedEvents = async () => {
  try {
    const response = await fetch(`${API_URL}/events/featured`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al obtener eventos destacados:', error);
    throw error;
  }
};

/**
 * Obtener detalle de un evento por ID
 */
export const getEventById = async (id) => {
  try {
    const response = await fetch(`${API_URL}/events/${id}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al obtener evento:', error);
    throw error;
  }
};

/**
 * Crear una reserva (requiere autenticación)
 */
export const createBooking = async (eventId, token) => {
  try {
    const response = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ event_id: eventId })  // ✅ CORREGIDO: event_id en lugar de evento_id
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al crear reserva:', error);
    throw error;
  }
};

/**
 * ✅ NUEVO: Obtener mis reservas
 * @param {string} token - Token de autenticación
 * @param {string} estado - Filtro opcional por estado (confirmada, cancelada, asistida)
 * @returns {Promise<Object>} Resultado con las reservas
 */
export const getMyBookings = async (token, estado = null) => {
  try {
    const queryParams = new URLSearchParams();
    if (estado) queryParams.append('estado', estado);
    
    const response = await fetch(`${API_URL}/bookings/me?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al obtener mis reservas:', error);
    throw error;
  }
};

/**
 * ✅ NUEVO: Obtener detalle de una reserva
 * @param {number} bookingId - ID de la reserva
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} Detalle de la reserva
 */
export const getBookingById = async (bookingId, token) => {
  try {
    const response = await fetch(`${API_URL}/bookings/${bookingId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al obtener reserva:', error);
    throw error;
  }
};

/**
 * ✅ NUEVO: Cancelar una reserva
 * @param {number} bookingId - ID de la reserva
 * @param {string} token - Token de autenticación
 * @param {string} motivo - Motivo de cancelación (opcional)
 * @returns {Promise<Object>} Resultado de la cancelación
 */
export const cancelBooking = async (bookingId, token, motivo = '') => {
  try {
    const response = await fetch(`${API_URL}/bookings/${bookingId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ motivo })
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al cancelar reserva:', error);
    throw error;
  }
};