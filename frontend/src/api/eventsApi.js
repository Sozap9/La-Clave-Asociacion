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
      body: JSON.stringify({ evento_id: eventId })
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al crear reserva:', error);
    throw error;
  }
};
