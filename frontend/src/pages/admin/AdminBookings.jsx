import { useState, useEffect } from 'react';
import { Ticket, Calendar, User, Search, Filter, X } from 'lucide-react';
import Loader from '../../components/common/Loader';

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, confirmada, cancelada, asistida
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      
      if (result.success) {
        setBookings(result.data.items || result.data || []);
      } else {
        setError(result.message || 'Error al cargar reservas');
        setBookings([]);
      }
    } catch (err) {
      console.error('Error en fetchBookings:', err);
      setError('Error de conexión');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!confirm('¿Estás seguro de cancelar esta reserva?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/bookings/${bookingId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ motivo: 'Cancelada por administrador' })
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Reserva cancelada exitosamente');
        fetchBookings();
      } else {
        alert(result.message || 'Error al cancelar reserva');
      }
    } catch (err) {
      alert('Error de conexión');
    }
  };

  const filteredBookings = Array.isArray(bookings) ? bookings.filter(booking => {
    // Filtro por estado
    if (filter !== 'all' && booking.estado !== filter) return false;
    
    // Búsqueda
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        booking.codigo_reserva?.toLowerCase().includes(searchLower) ||
        booking.nombre?.toLowerCase().includes(searchLower) ||
        booking.apellidos?.toLowerCase().includes(searchLower) ||
        booking.email?.toLowerCase().includes(searchLower) ||
        booking.evento_titulo?.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  }) : [];

  const getEstadoBadge = (estado) => {
    return 'bg-primary-500/20 text-primary-300 border border-primary-500/30';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-8 bg-black min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-gradient mb-2 text-4xl">Gestión de Reservas</h1>
        <p className="text-gray-400 text-lg">
          {Array.isArray(bookings) ? `${bookings.length} reserva${bookings.length !== 1 ? 's' : ''} total${bookings.length !== 1 ? 'es' : ''}` : 'Administra todas las reservas'}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Filtros y Búsqueda */}
      <div className="mb-6 space-y-4">
        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por código, nombre, email o evento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#262626] border border-[#333333] rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Filtros por estado */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-[#262626] text-gray-400 hover:bg-[#333333]'
            }`}
          >
            Todas ({bookings.length})
          </button>
          <button
            onClick={() => setFilter('confirmada')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'confirmada'
                ? 'bg-primary-600 text-white'
                : 'bg-[#262626] text-gray-400 hover:bg-[#333333]'
            }`}
          >
            Confirmadas ({bookings.filter(b => b.estado === 'confirmada').length})
          </button>
          <button
            onClick={() => setFilter('asistida')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'asistida'
                ? 'bg-primary-600 text-white'
                : 'bg-[#262626] text-gray-400 hover:bg-[#333333]'
            }`}
          >
            Asistidas ({bookings.filter(b => b.estado === 'asistida').length})
          </button>
          <button
            onClick={() => setFilter('cancelada')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'cancelada'
                ? 'bg-primary-600 text-white'
                : 'bg-[#262626] text-gray-400 hover:bg-[#333333]'
            }`}
          >
            Canceladas ({bookings.filter(b => b.estado === 'cancelada').length})
          </button>
        </div>
      </div>

      {/* Lista de reservas */}
      {filteredBookings.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-12 text-center">
          <Ticket className="mx-auto mb-4 text-gray-600" size={48} />
          <p className="text-gray-400 text-lg">
            {search ? 'No se encontraron reservas con esos criterios' : 'No hay reservas en esta categoría'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6 hover:border-primary-500/50 transition-all"
            >
              <div className="flex items-start justify-between">
                {/* Info de la reserva */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Ticket className="text-primary-300" size={24} />
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {booking.codigo_reserva || `Reserva #${booking.id}`}
                      </h3>
                      <p className="text-gray-400 text-sm">{booking.evento_titulo || 'Evento desconocido'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Usuario</p>
                      <p className="text-white text-sm">
                        {booking.nombre && booking.apellidos 
                          ? `${booking.nombre} ${booking.apellidos}`
                          : booking.email || 'N/A'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Estado</p>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoBadge(booking.estado)}`}>
                        {booking.estado}
                      </span>
                    </div>
                    
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Entradas</p>
                      <p className="text-white text-sm">{booking.numero_entradas || 1}</p>
                    </div>
                    
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Fecha Reserva</p>
                      <p className="text-white text-sm">{formatDate(booking.created_at)}</p>
                    </div>
                  </div>

                  {booking.fecha_evento && (
                    <div className="flex items-center gap-2 text-gray-300 text-sm">
                      <Calendar size={16} className="text-primary-300" />
                      <span>Evento: {formatDate(booking.fecha_evento)}</span>
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex flex-col gap-2 ml-4">
                  {booking.estado === 'confirmada' && (
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedBooking(booking)}
                    className="px-4 py-2 bg-[#262626] hover:bg-[#333333] text-white rounded-lg text-sm transition-colors"
                  >
                    Ver Detalles
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de detalles */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedBooking(null)}>
          <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-8 max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Detalles de Reserva</h2>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 text-sm mb-1">Código de Reserva</p>
                  <p className="text-white font-mono">{selectedBooking.codigo_reserva || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm mb-1">Estado</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoBadge(selectedBooking.estado)}`}>
                    {selectedBooking.estado}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-gray-500 text-sm mb-1">Evento</p>
                <p className="text-white text-lg font-semibold">{selectedBooking.evento_titulo}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 text-sm mb-1">Usuario</p>
                  <p className="text-white">{selectedBooking.nombre} {selectedBooking.apellidos}</p>
                  <p className="text-gray-400 text-sm">{selectedBooking.email}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm mb-1">Número de Socio</p>
                  <p className="text-white">{selectedBooking.numero_socio || 'No aplica'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 text-sm mb-1">Entradas</p>
                  <p className="text-white">{selectedBooking.numero_entradas || 1}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm mb-1">Fecha de Reserva</p>
                  <p className="text-white">{formatDate(selectedBooking.created_at)}</p>
                </div>
              </div>

              {selectedBooking.fecha_asistencia && (
                <div>
                  <p className="text-gray-500 text-sm mb-1">Fecha de Asistencia</p>
                  <p className="text-white">{formatDate(selectedBooking.fecha_asistencia)}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setSelectedBooking(null)}
                className="flex-1 px-4 py-2 bg-[#262626] hover:bg-[#333333] text-white rounded-lg transition-colors"
              >
                Cerrar
              </button>
              {selectedBooking.estado === 'confirmada' && (
                <button
                  onClick={() => {
                    handleCancelBooking(selectedBooking.id);
                    setSelectedBooking(null);
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Cancelar Reserva
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBookings;