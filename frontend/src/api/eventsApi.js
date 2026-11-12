const API_URL = import.meta.env.VITE_API_URL;

// Eventos públicos
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

// Destacados (hasta 6)
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

// Detalle de un evento
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

// Reservar (con sesión)
export const createBooking = async (eventId, token) => {
  try {
    const response = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ event_id: eventId })
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al crear reserva:', error);
    throw error;
  }
};

// Mis reservas
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

// Detalle de una reserva
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
 * Reanudar el pago de una reserva esperando_pago
 * @returns {Promise<Object>} { success, data: { checkout_url } }
 */
export const retryBookingPayment = async (bookingId, token) => {
  try {
    const response = await fetch(`${API_URL}/bookings/${bookingId}/pagar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al reanudar el pago:', error);
    throw error;
  }
};

// Cancelar reserva
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