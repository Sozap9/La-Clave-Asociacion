const API_URL = import.meta.env.VITE_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

/**
 * ========================================
 * DASHBOARD & STATISTICS
 * ========================================
 */

export const getAdminStats = async () => {
  try {
    const response = await fetch(`${API_URL}/admin/stats`, {
      headers: getAuthHeaders()
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    throw error;
  }
};

export const getDashboardStats = async () => {
  try {
    const response = await fetch(`${API_URL}/admin/dashboard/stats`, {
      headers: getAuthHeaders()
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

/**
 * ========================================
 * EVENT MANAGEMENT
 * ========================================
 */

export const getAllEventsAdmin = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.estado) queryParams.append('estado', params.estado);
    if (params.destacado !== undefined) queryParams.append('destacado', params.destacado);

    const response = await fetch(`${API_URL}/admin/events?${queryParams}`, {
      headers: getAuthHeaders()
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};

export const getEventDetailsAdmin = async (id) => {
  try {
    const response = await fetch(`${API_URL}/admin/events/${id}`, {
      headers: getAuthHeaders()
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching event details:', error);
    throw error;
  }
};

export const getEventsStats = async () => {
  try {
    const response = await fetch(`${API_URL}/admin/events/stats`, {
      headers: getAuthHeaders()
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching event stats:', error);
    throw error;
  }
};

export const createEvent = async (formData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/admin/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    return await response.json();
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};

export const updateEvent = async (id, formData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/admin/events/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    return await response.json();
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
};

export const deleteEvent = async (id) => {
  try {
    const response = await fetch(`${API_URL}/admin/events/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return await response.json();
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
};

/**
 * Publish/Unpublish event
 */
export const togglePublishEvent = async (id) => {
  try {
    const response = await fetch(`${API_URL}/admin/events/${id}/toggle-publish`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
    return await response.json();
  } catch (error) {
    console.error('Error toggling publish status:', error);
    throw error;
  }
};

export const publishEvent = async (id) => {
  try {
    const response = await fetch(`${API_URL}/admin/events/${id}/publish`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
    return await response.json();
  } catch (error) {
    console.error('Error publishing event:', error);
    throw error;
  }
};

export const unpublishEvent = async (id) => {
  try {
    const response = await fetch(`${API_URL}/admin/events/${id}/unpublish`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
    return await response.json();
  } catch (error) {
    console.error('Error unpublishing event:', error);
    throw error;
  }
};

/**
 * Feature/Unfeature event
 */
export const toggleFeatureEvent = async (id) => {
  try {
    const response = await fetch(`${API_URL}/admin/events/${id}/toggle-feature`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
    return await response.json();
  } catch (error) {
    console.error('Error toggling feature status:', error);
    throw error;
  }
};

export const featureEvent = async (id) => {
  try {
    const response = await fetch(`${API_URL}/admin/events/${id}/feature`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
    return await response.json();
  } catch (error) {
    console.error('Error featuring event:', error);
    throw error;
  }
};

export const unfeatureEvent = async (id) => {
  try {
    const response = await fetch(`${API_URL}/admin/events/${id}/unfeature`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
    return await response.json();
  } catch (error) {
    console.error('Error unfeaturing event:', error);
    throw error;
  }
};

/**
 * Cancel event
 */
export const cancelEvent = async (id, motivo) => {
  try {
    const response = await fetch(`${API_URL}/admin/events/${id}/cancel`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ motivo })
    });
    return await response.json();
  } catch (error) {
    console.error('Error cancelling event:', error);
    throw error;
  }
};

/**
 * ========================================
 * USER MANAGEMENT
 * ========================================
 */

export const getAllUsers = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.role) queryParams.append('role', params.role);
    if (params.activo !== undefined) queryParams.append('activo', params.activo);

    const response = await fetch(`${API_URL}/admin/users?${queryParams}`, {
      headers: getAuthHeaders()
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const getUserDetails = async (id) => {
  try {
    const response = await fetch(`${API_URL}/admin/users/${id}`, {
      headers: getAuthHeaders()
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
};

export const toggleUserActive = async (id) => {
  try {
    const response = await fetch(`${API_URL}/admin/users/${id}/toggle-active`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
    return await response.json();
  } catch (error) {
    console.error('Error toggling user active status:', error);
    throw error;
  }
};

/**
 * Legacy user management functions
 * These are kept for backward compatibility with existing components
 */
export const updateUserRole = async (userId, newRole) => {
  try {
    const response = await fetch(`${API_URL}/admin/users/${userId}/role`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ role: newRole })
    });
    return await response.json();
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

export const approveUser = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/admin/users/${userId}/approve`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
    return await response.json();
  } catch (error) {
    console.error('Error approving user:', error);
    throw error;
  }
};

export const rejectUser = async (userId, reason) => {
  try {
    const response = await fetch(`${API_URL}/admin/users/${userId}/reject`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason })
    });
    return await response.json();
  } catch (error) {
    console.error('Error rejecting user:', error);
    throw error;
  }
};

/**
 * ========================================
 * MEMBER (SOCIOS) MANAGEMENT
 * ========================================
 */

export const getAllSocios = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.estado) queryParams.append('estado', params.estado);

    const response = await fetch(`${API_URL}/admin/socios?${queryParams}`, {
      headers: getAuthHeaders()
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching socios:', error);
    throw error;
  }
};

export const getSocioDetails = async (id) => {
  try {
    const response = await fetch(`${API_URL}/admin/socios/${id}`, {
      headers: getAuthHeaders()
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching socio details:', error);
    throw error;
  }
};

export const createSocio = async (data) => {
  try {
    const response = await fetch(`${API_URL}/admin/socios`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return await response.json();
  } catch (error) {
    console.error('Error creating socio:', error);
    throw error;
  }
};

export const updateSocio = async (id, data) => {
  try {
    const response = await fetch(`${API_URL}/admin/socios/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return await response.json();
  } catch (error) {
    console.error('Error updating socio:', error);
    throw error;
  }
};

export const deleteSocio = async (id, motivo) => {
  try {
    const response = await fetch(`${API_URL}/admin/socios/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify({ motivo })
    });
    return await response.json();
  } catch (error) {
    console.error('Error deleting socio:', error);
    throw error;
  }
};

export const getSociosMorosos = async () => {
  try {
    const response = await fetch(`${API_URL}/admin/socios/morosos`, {
      headers: getAuthHeaders()
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching socios morosos:', error);
    throw error;
  }
};

export const sendReminderSocio = async (id) => {
  try {
    const response = await fetch(`${API_URL}/admin/socios/${id}/send-reminder`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await response.json();
  } catch (error) {
    console.error('Error sending reminder:', error);
    throw error;
  }
};

export const suspendSocio = async (id) => {
  try {
    const response = await fetch(`${API_URL}/admin/socios/${id}/suspend`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
    return await response.json();
  } catch (error) {
    console.error('Error suspending socio:', error);
    throw error;
  }
};

/**
 * ========================================
 * BOOKING MANAGEMENT
 * ========================================
 */

export const getAllBookings = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.estado) queryParams.append('estado', params.estado);
    if (params.event_id) queryParams.append('event_id', params.event_id);

    const response = await fetch(`${API_URL}/admin/bookings?${queryParams}`, {
      headers: getAuthHeaders()
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching bookings:', error);
    throw error;
  }
};

export const getBookingDetails = async (id) => {
  try {
    const response = await fetch(`${API_URL}/admin/bookings/${id}`, {
      headers: getAuthHeaders()
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching booking details:', error);
    throw error;
  }
};

export const getBookingsStats = async () => {
  try {
    const response = await fetch(`${API_URL}/admin/bookings/stats`, {
      headers: getAuthHeaders()
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching bookings stats:', error);
    throw error;
  }
};

export const cancelBookingAdmin = async (id, motivo) => {
  try {
    const response = await fetch(`${API_URL}/admin/bookings/${id}/cancel`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ motivo })
    });
    return await response.json();
  } catch (error) {
    console.error('Error cancelling booking:', error);
    throw error;
  }
};

export const verifyQR = async (codigo_reserva) => {
  try {
    const response = await fetch(`${API_URL}/admin/bookings/verify-qr`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ codigo_reserva })
    });
    return await response.json();
  } catch (error) {
    console.error('Error verifying QR:', error);
    throw error;
  }
};

/**
 * ========================================
 * PAYMENT MANAGEMENT
 * ========================================
 */

export const getAllPayments = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.estado) queryParams.append('estado', params.estado);
    if (params.tipo_pago) queryParams.append('tipo_pago', params.tipo_pago);

    const response = await fetch(`${API_URL}/admin/payments?${queryParams}`, {
      headers: getAuthHeaders()
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching payments:', error);
    throw error;
  }
};

export const getPaymentsStats = async () => {
  try {
    const response = await fetch(`${API_URL}/admin/payments/stats`, {
      headers: getAuthHeaders()
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching payments stats:', error);
    throw error;
  }
};

export const getMonthlyRevenue = async (year) => {
  try {
    const queryParams = year ? `?year=${year}` : '';
    const response = await fetch(`${API_URL}/admin/payments/monthly${queryParams}`, {
      headers: getAuthHeaders()
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching monthly revenue:', error);
    throw error;
  }
};

/**
 * ========================================
 * GALLERY
 * ========================================
 */

export const getGalleryStats = async () => {
  try {
    const response = await fetch(`${API_URL}/admin/gallery/stats`, {
      headers: getAuthHeaders()
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching gallery stats:', error);
    throw error;
  }
};

/**
 * ========================================
 * ACTIVITY
 * ========================================
 */

export const getRecentActivity = async (limit = 50) => {
  try {
    const response = await fetch(`${API_URL}/admin/activity?limit=${limit}`, {
      headers: getAuthHeaders()
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching activity:', error);
    throw error;
  }
};

/**
 * ========================================
 * 📤 EXPORTAR SOCIOS - PDF
 * ========================================
 */
export const exportSocios = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/admin/export/socios`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'No se pudo generar el PDF de socios');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `socios_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    return { success: true, message: 'PDF de socios descargado correctamente' };
  } catch (error) {
    console.error('Error al exportar socios:', error);
    throw error;
  }
};

/**
 * ========================================
 * 📤 EXPORTAR USUARIOS - PDF
 * ========================================
 */
export const exportUsuarios = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/admin/export/usuarios`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'No se pudo generar el PDF de usuarios');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usuarios_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    return { success: true, message: 'PDF de usuarios descargado correctamente' };
  } catch (error) {
    console.error('Error al exportar usuarios:', error);
    throw error;
  }
};

/**
 * ========================================
 * 📤 EXPORTAR RESERVAS - PDF
 * ========================================
 */
export const exportReservas = async (params = {}) => {
  try {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams();
    
    // Agregar filtros opcionales
    if (params.fecha_desde) queryParams.append('fecha_desde', params.fecha_desde);
    if (params.fecha_hasta) queryParams.append('fecha_hasta', params.fecha_hasta);
    if (params.event_id) queryParams.append('event_id', params.event_id);

    const url = queryParams.toString() 
      ? `${API_URL}/admin/export/reservas?${queryParams}`
      : `${API_URL}/admin/export/reservas`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'No se pudo generar el PDF de reservas');
    }

    const blob = await response.blob();
    const url2 = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url2;
    a.download = `reservas_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url2);
    document.body.removeChild(a);
    
    return { success: true, message: 'PDF de reservas descargado correctamente' };
  } catch (error) {
    console.error('Error al exportar reservas:', error);
    throw error;
  }
};

/**
 * ========================================
 * 📤 EXPORTAR EVENTOS - PDF (OPCIONAL)
 * ========================================
 * Solo si tienes esta función en tu adminApi.js
 */
export const exportEventos = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/admin/export/eventos`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'No se pudo generar el PDF de eventos');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eventos_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    return { success: true, message: 'PDF de eventos descargado correctamente' };
  } catch (error) {
    console.error('Error al exportar eventos:', error);
    throw error;
  }
};
