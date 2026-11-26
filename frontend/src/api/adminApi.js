const API_URL = import.meta.env.VITE_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
};

// Dashboard y estadísticas

export const getAdminStats = async () => {
  try {
    const response = await fetch(`${API_URL}/admin/stats`, {
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    throw error;
  }
};

export const getDashboardStats = async () => {
  try {
    const response = await fetch(`${API_URL}/admin/dashboard/stats`, {
      headers: getAuthHeaders(),
    });
    const json = await response.json().catch(() => null);
    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        message: json?.message || `HTTP ${response.status}`,
        raw: json,
      };
    }
    return json;
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw error;
  }
};

// Eventos

export const getAllEventsAdmin = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);
    if (params.search) queryParams.append("search", params.search);
    if (params.estado) queryParams.append("estado", params.estado);
    if (params.destacado !== undefined)
      queryParams.append("destacado", params.destacado);
    const response = await fetch(`${API_URL}/admin/events?${queryParams}`, {
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error("Error fetching events:", error);
    throw error;
  }
};

export const getEventDetailsAdmin = async (id) => {
  try {
    const response = await fetch(`${API_URL}/admin/events/${id}`, {
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error("Error fetching event details:", error);
    throw error;
  }
};

// Forzar una tanda como vigente ya
export const activateEventTier = async (eventId, tierId) => {
  try {
    const response = await fetch(
      `${API_URL}/admin/events/${eventId}/tandas/${tierId}/activar`,
      {
        method: "PATCH",
        headers: getAuthHeaders(),
      },
    );
    return await response.json();
  } catch (error) {
    console.error("Error activando tanda:", error);
    throw error;
  }
};

// Quitar el forzado: las tandas vuelven a ir por fecha
export const deactivateEventTier = async (eventId) => {
  try {
    const response = await fetch(
      `${API_URL}/admin/events/${eventId}/tandas/desactivar`,
      {
        method: "PATCH",
        headers: getAuthHeaders(),
      },
    );
    return await response.json();
  } catch (error) {
    console.error("Error desactivando tanda manual:", error);
    throw error;
  }
};

export const getEventsStats = async () => {
  try {
    const response = await fetch(`${API_URL}/admin/events/stats`, {
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error("Error fetching event stats:", error);
    throw error;
  }
};

export const createEvent = async (formData) => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/admin/events`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    return await response.json();
  } catch (error) {
    console.error("Error creating event:", error);
    throw error;
  }
};

export const updateEvent = async (id, formData) => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/admin/events/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    return await response.json();
  } catch (error) {
    console.error("Error updating event:", error);
    throw error;
  }
};

export const deleteEvent = async (id) => {
  try {
    const response = await fetch(`${API_URL}/admin/events/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error("Error deleting event:", error);
    throw error;
  }
};

export const togglePublishEvent = async (id) => {
  try {
    const response = await fetch(
      `${API_URL}/admin/events/${id}/toggle-publish`,
      { method: "PATCH", headers: getAuthHeaders() },
    );
    return await response.json();
  } catch (error) {
    console.error("Error toggling publish status:", error);
    throw error;
  }
};

export const publishEvent = async (id) => {
  try {
    const response = await fetch(`${API_URL}/admin/events/${id}/publish`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error("Error publishing event:", error);
    throw error;
  }
};

export const unpublishEvent = async (id) => {
  try {
    const response = await fetch(`${API_URL}/admin/events/${id}/unpublish`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error("Error unpublishing event:", error);
    throw error;
  }
};

export const toggleFeatureEvent = async (id) => {
  try {
    const response = await fetch(
      `${API_URL}/admin/events/${id}/toggle-feature`,
      { method: "PATCH", headers: getAuthHeaders() },
    );
    return await response.json();
  } catch (error) {
    console.error("Error toggling feature status:", error);
    throw error;
  }
};

export const featureEvent = async (id) => {
  try {
    const response = await fetch(`${API_URL}/admin/events/${id}/feature`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error("Error featuring event:", error);
    throw error;
  }
};

export const unfeatureEvent = async (id) => {
  try {
    const response = await fetch(`${API_URL}/admin/events/${id}/unfeature`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error("Error unfeaturing event:", error);
    throw error;
  }
};

export const cancelEvent = async (id, motivo) => {
  try {
    const response = await fetch(`${API_URL}/admin/events/${id}/cancel`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ motivo }),
    });
    return await response.json();
  } catch (error) {
    console.error("Error cancelling event:", error);
    throw error;
  }
};

// Usuarios

export const getUserDetails = async (id) => {
  try {
    const response = await fetch(`${API_URL}/admin/users/${id}`, {
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error("Error fetching user details:", error);
    throw error;
  }
};

export const updateUserRole = async (userId, newRole) => {
  try {
    const response = await fetch(`${API_URL}/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ role: newRole }),
    });
    return await response.json();
  } catch (error) {
    console.error("Error updating user role:", error);
    throw error;
  }
};

// Socios

export const getAllSocios = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);
    if (params.search) queryParams.append("search", params.search);
    if (params.estado) queryParams.append("estado", params.estado);
    if (params.filtro) queryParams.append("filtro", params.filtro);
    const response = await fetch(`${API_URL}/admin/socios?${queryParams}`, {
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error("Error fetching socios:", error);
    throw error;
  }
};

export const getSocioDetails = async (id) => {
  try {
    const response = await fetch(`${API_URL}/admin/socios/${id}`, {
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error("Error fetching socio details:", error);
    throw error;
  }
};

export const updateSocio = async (id, data) => {
  try {
    const response = await fetch(`${API_URL}/admin/socios/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    console.error("Error updating socio:", error);
    throw error;
  }
};

// Corregir datos verificados (nombre, DNI, foto del DNI...). Va como FormData:
// sin Content-Type, el navegador pone el de multipart
export const actualizarDatosSocio = async (id, formData) => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/admin/socios/${id}/datos`, {
      method: "PUT",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    return await response.json();
  } catch (error) {
    console.error("Error updating socio data:", error);
    throw error;
  }
};

export const deactivateSocio = async (id, motivo = "Baja administrativa") => {
  try {
    const response = await fetch(`${API_URL}/admin/socios/${id}/deactivate`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ motivo }),
    });
    return await response.json();
  } catch (error) {
    console.error("Error deactivating socio:", error);
    throw error;
  }
};

export const deleteSocio = async (id, motivo) => {
  try {
    const response = await fetch(`${API_URL}/admin/socios/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
      body: JSON.stringify({ motivo }),
    });
    return await response.json();
  } catch (error) {
    console.error("Error deleting socio:", error);
    throw error;
  }
};

export const deleteSocioPermanent = async (id) => {
  try {
    const response = await fetch(`${API_URL}/admin/socios/${id}/permanent`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error("Error permanently deleting socio:", error);
    throw error;
  }
};

export const reactivateSocio = async (id) => {
  try {
    const response = await fetch(`${API_URL}/admin/socios/${id}/reactivate`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error("Error reactivating socio:", error);
    throw error;
  }
};

export const getSociosMorosos = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append("search", params.search);
    if (params.severidad) queryParams.append("severidad", params.severidad);
    const queryString = queryParams.toString();
    const response = await fetch(
      `${API_URL}/admin/socios/morosos${queryString ? "?" + queryString : ""}`,
      { headers: getAuthHeaders() },
    );
    return await response.json();
  } catch (error) {
    console.error("Error fetching socios morosos:", error);
    throw error;
  }
};

export const sendReminderSocio = async (id) => {
  try {
    const response = await fetch(
      `${API_URL}/admin/socios/${id}/send-reminder`,
      { method: "POST", headers: getAuthHeaders() },
    );
    return await response.json();
  } catch (error) {
    console.error("Error sending reminder:", error);
    throw error;
  }
};

export const suspendSocio = async (id) => {
  try {
    const response = await fetch(`${API_URL}/admin/socios/${id}/suspend`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error("Error suspending socio:", error);
    throw error;
  }
};

// Reservas

export const getAllBookings = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);
    if (params.search) queryParams.append("search", params.search);
    if (params.estado) queryParams.append("estado", params.estado);
    if (params.event_id) queryParams.append("event_id", params.event_id);
    const response = await fetch(`${API_URL}/admin/bookings?${queryParams}`, {
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error("Error fetching bookings:", error);
    throw error;
  }
};

export const getBookingDetails = async (id) => {
  try {
    const response = await fetch(`${API_URL}/admin/bookings/${id}`, {
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error("Error fetching booking details:", error);
    throw error;
  }
};

export const getBookingsStats = async () => {
  try {
    const response = await fetch(`${API_URL}/admin/bookings/stats`, {
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error("Error fetching bookings stats:", error);
    throw error;
  }
};

export const cancelBookingAdmin = async (id, motivo) => {
  try {
    const response = await fetch(`${API_URL}/admin/bookings/${id}/cancel`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ motivo }),
    });
    return await response.json();
  } catch (error) {
    console.error("Error cancelling booking:", error);
    throw error;
  }
};

export const verifyQR = async (codigo_reserva) => {
  try {
    const response = await fetch(`${API_URL}/admin/bookings/verify-qr`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ codigo_reserva }),
    });
    return await response.json();
  } catch (error) {
    console.error("Error verifying QR:", error);
    throw error;
  }
};

// Pagos

export const getAllPayments = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);
    if (params.search) queryParams.append("search", params.search);
    if (params.estado) queryParams.append("estado", params.estado);
    if (params.tipo_pago) queryParams.append("tipo_pago", params.tipo_pago);
    const response = await fetch(`${API_URL}/admin/payments?${queryParams}`, {
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error("Error fetching payments:", error);
    throw error;
  }
};

export const getPaymentsStats = async () => {
  try {
    const response = await fetch(`${API_URL}/admin/payments/stats`, {
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error("Error fetching payments stats:", error);
    throw error;
  }
};

export const getMonthlyRevenue = async (year) => {
  try {
    const queryParams = year ? `?year=${year}` : "";
    const response = await fetch(
      `${API_URL}/admin/payments/monthly${queryParams}`,
      { headers: getAuthHeaders() },
    );
    return await response.json();
  } catch (error) {
    console.error("Error fetching monthly revenue:", error);
    throw error;
  }
};

// Gallery

export const getGalleryStats = async () => {
  try {
    const response = await fetch(`${API_URL}/admin/gallery/stats`, {
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error("Error fetching gallery stats:", error);
    throw error;
  }
};

// Actividad

export const getRecentActivity = async (limit = 50) => {
  try {
    const response = await fetch(`${API_URL}/admin/activity?limit=${limit}`, {
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error("Error fetching activity:", error);
    throw error;
  }
};

// Solicitudes de socio

export const getSolicitudesPendientesCount = async () => {
  try {
    const response = await fetch(
      `${API_URL}/admin/solicitudes/pendientes/count`,
      {
        headers: getAuthHeaders(),
      },
    );
    return await response.json();
  } catch (error) {
    console.error("Error fetching solicitudes count:", error);
    throw error;
  }
};

export const getSolicitudes = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.estado) queryParams.append("estado", params.estado);
    if (params.search) queryParams.append("search", params.search);
    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);
    const response = await fetch(
      `${API_URL}/admin/solicitudes?${queryParams}`,
      {
        headers: getAuthHeaders(),
      },
    );
    return await response.json();
  } catch (error) {
    console.error("Error fetching solicitudes:", error);
    throw error;
  }
};

export const getSolicitudDetails = async (id) => {
  try {
    const response = await fetch(`${API_URL}/admin/solicitudes/${id}`, {
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error("Error fetching solicitud details:", error);
    throw error;
  }
};

export const aprobarSolicitud = async (id) => {
  try {
    const response = await fetch(`${API_URL}/admin/solicitudes/${id}/aprobar`, {
      method: "PUT",
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error("Error aprobar solicitud:", error);
    throw error;
  }
};

export const rechazarSolicitud = async (id, motivo_rechazo) => {
  try {
    const response = await fetch(
      `${API_URL}/admin/solicitudes/${id}/rechazar`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ motivo_rechazo }),
      },
    );
    return await response.json();
  } catch (error) {
    console.error("Error rechazar solicitud:", error);
    throw error;
  }
};

export const eliminarSolicitud = async (id) => {
  try {
    const response = await fetch(`${API_URL}/admin/solicitudes/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error("Error eliminar solicitud:", error);
    throw error;
  }
};

// Eventos para el selector de la exportación de reservas, sin paginar
export const getEventsForExport = async () => {
  try {
    const response = await fetch(`${API_URL}/admin/export/events-selector`, {
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error("Error fetching events for export:", error);
    throw error;
  }
};

// Exportaciones PDF

const downloadPDF = async (url, filename) => {
  const token = localStorage.getItem("token");
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "No se pudo generar el PDF");
  }
  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(objectUrl);
  document.body.removeChild(a);
  return { success: true };
};

export const exportSocios = () =>
  downloadPDF(
    `${API_URL}/admin/export/socios`,
    `socios_${new Date().toISOString().split("T")[0]}.pdf`,
  );

export const exportEventos = () =>
  downloadPDF(
    `${API_URL}/admin/export/eventos`,
    `eventos_${new Date().toISOString().split("T")[0]}.pdf`,
  );

export const exportReservas = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.event_id) queryParams.append("event_id", params.event_id);
  const qs = queryParams.toString();
  return downloadPDF(
    `${API_URL}/admin/export/reservas${qs ? "?" + qs : ""}`,
    `reservas_${new Date().toISOString().split("T")[0]}.pdf`,
  );
};

export const exportIngresosMensuales = (year, month) =>
  downloadPDF(
    `${API_URL}/admin/export/ingresos-mensuales?year=${year}&month=${month}`,
    `ingresos_${year}_${String(month).padStart(2, '0')}.pdf`,
  );