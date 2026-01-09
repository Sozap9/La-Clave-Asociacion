import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyBookings, cancelBooking } from '../api/eventsApi';
import { 
  Calendar, MapPin, Clock, Ticket, QrCode, X, 
  AlertCircle, CheckCircle, XCircle
} from 'lucide-react';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import EventDetail from '../components/events/EventDetail';

const MisEntradas = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('upcoming');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal Evento
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  
  // Modal QR
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  
  // Modal Cancelar
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filter, bookings, searchTerm]);

  const fetchBookings = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const result = await getMyBookings(token);
      
      if (result.success) {
        const activeBookings = (result.data || []).filter(b => b.estado !== 'cancelada');
        
        console.log('📦 Bookings recibidas:', activeBookings);
        console.log('📊 Datos de la primera booking:', activeBookings[0]);
        activeBookings.forEach(b => {
          console.log(`Booking #${b.id}:`, {
            qr_code_url: b.qr_code_url,
            aforo_maximo: b.aforo_maximo,
            entradas_disponibles: b.entradas_disponibles
          });
        });
        
        setBookings(activeBookings);
      } else {
        setError(result.message || 'Error al cargar tus entradas');
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...bookings];
    const now = new Date();

    // Filtro de búsqueda por nombre
    if (searchTerm.trim()) {
      filtered = filtered.filter(b => 
        b.evento_titulo.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por estado/fecha
    switch (filter) {
      case 'upcoming':
        filtered = filtered.filter(b => 
          b.estado === 'confirmada' && new Date(b.fecha_evento) >= now
        );
        break;
      case 'past':
        filtered = filtered.filter(b => 
          b.estado === 'asistida' || 
          (b.estado === 'confirmada' && new Date(b.fecha_evento) < now)
        );
        break;
      case 'all':
        break;
      default:
        break;
    }

    filtered.sort((a, b) => new Date(b.fecha_evento) - new Date(a.fecha_evento));
    
    setFilteredBookings(filtered);
  };

  const handleViewEvent = (booking) => {
    console.log('🔍 Abriendo evento:', booking);
    
    const eventData = {
      id: booking.event_id,
      titulo: booking.evento_titulo,
      descripcion: booking.descripcion || '',
      descripcion_corta: booking.descripcion_corta || '',
      fecha_evento: booking.fecha_evento,
      hora_evento: booking.hora_evento,
      ubicacion: booking.ubicacion,
      direccion: booking.direccion || '',
      imagen_cartel_url: booking.imagen_cartel_url,
      aforo_maximo: booking.aforo_maximo || 0,
      entradas_disponibles: booking.entradas_disponibles || 0,
      precio_socio: booking.precio_socio || 0,
      precio_invitado: booking.precio_invitado || 0,
      permite_invitados: booking.permite_invitados || false,
      destacado: booking.destacado || false,
      edad_minima: booking.edad_minima || 18,
      tags: booking.tags,
      artistas: booking.artistas
    };
    
    console.log('📋 Event data construido:', eventData);
    
    setSelectedEvent(eventData);
    setShowEventModal(true);
  };

  const handleViewQR = (booking, e) => {
    e.stopPropagation();
    console.log('🔍 Abriendo QR para booking:', booking.id);
    console.log('📍 QR URL:', booking.qr_code_url);
    console.log('📍 Código reserva:', booking.codigo_reserva);
    setSelectedBooking(booking);
    setShowQRModal(true);
  };

  const handleCancelClick = (booking, e) => {
    e.stopPropagation();
    setSelectedBooking(booking);
    setShowCancelModal(true);
    setCancelReason('');
    setCancelSuccess(false);
  };

  const handleCancelBooking = async () => {
    setCancelling(true);

    try {
      const token = localStorage.getItem('token');
      const result = await cancelBooking(selectedBooking.id, token, cancelReason);

      if (result.success) {
        setCancelSuccess(true);
        setTimeout(() => {
          setShowCancelModal(false);
          fetchBookings();
        }, 1500);
      } else {
        alert(result.message || 'Error al cancelar la reserva');
      }
    } catch (err) {
      alert('Error al cancelar la reserva. Intenta de nuevo.');
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.substring(0, 5);
  };

  const getStatusBadge = (estado) => {
    const badges = {
      confirmada: { 
        text: 'Confirmada', 
        icon: CheckCircle, 
        className: 'bg-gray-800 text-gray-300 border-gray-700' 
      },
      asistida: { 
        text: 'Asistida', 
        icon: CheckCircle, 
        className: 'bg-gray-800 text-gray-300 border-gray-700' 
      },
      no_asistida: { 
        text: 'No Asistida', 
        icon: AlertCircle, 
        className: 'bg-gray-800 text-gray-400 border-gray-700' 
      }
    };

    const badge = badges[estado] || badges.confirmada;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs 
                        font-medium border ${badge.className}`}>
        <Icon size={12} />
        {badge.text}
      </span>
    );
  };

  const canCancel = (booking) => {
    const isFuture = new Date(booking.fecha_evento) > new Date();
    return booking.estado === 'confirmada' && isFuture;
  };

  // ✅ ACTUALIZADO: Colores iguales a Events (bg-primary-600)
  const FilterButton = ({ value, label, count }) => (
    <button
      onClick={() => setFilter(value)}
      className={`px-6 py-3 rounded-lg font-medium transition-all ${
        filter === value
          ? 'bg-primary-600 text-white shadow-glow'
          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
      }`}
    >
      {label} {count !== undefined && `(${count})`}
    </button>
  );

  const counts = {
    all: bookings.length,
    upcoming: bookings.filter(b => 
      b.estado === 'confirmada' && new Date(b.fecha_evento) >= new Date()
    ).length,
    past: bookings.filter(b => 
      b.estado === 'asistida' || 
      (b.estado === 'confirmada' && new Date(b.fecha_evento) < new Date())
    ).length
  };

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="container-custom max-w-6xl">
        
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-gradient mb-2 text-4xl">Mis Entradas</h1>
          <p className="text-gray-400 text-lg">
            Gestiona tus reservas y entradas
          </p>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="flex items-center gap-4 mb-8 flex-wrap">
          {/* Filtros */}
          <div className="flex gap-3">
            <FilterButton value="upcoming" label="Próximos" count={counts.upcoming} />
            <FilterButton value="past" label="Pasados" count={counts.past} />
            <FilterButton value="all" label="Todos" count={counts.all} />
          </div>

          {/* Barra de búsqueda */}
          <div className="flex-1 max-w-md ml-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por evento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 bg-slate-900/60 border border-purple-500/30 rounded-lg 
                           text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 
                           focus:ring-2 focus:ring-purple-500/20 backdrop-blur-sm transition-all"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-8">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && <Loader size="lg" />}

        {/* Lista de entradas */}
        {!loading && filteredBookings.length > 0 && (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div 
                key={booking.id} 
                onClick={() => handleViewEvent(booking)}
                className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden 
                          hover:border-purple-500/50 transition-all group cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row">
                  
                  {/* IMAGEN */}
                  <div className="relative sm:w-40 sm:h-40 h-48 flex-shrink-0 bg-gray-800">
                    {booking.imagen_cartel_url ? (
                      <img
                        src={`${import.meta.env.VITE_BASE_URL}${booking.imagen_cartel_url}`}
                        alt={booking.evento_titulo}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Ticket className="text-gray-600" size={32} />
                      </div>
                    )}
                  </div>

                  {/* Información */}
                  <div className="flex-1 p-5 flex flex-col justify-between">
                    
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <h3 className="text-xl font-light text-white mb-2 uppercase tracking-wide 
                                      group-hover:text-purple-400 transition-colors">
                          {booking.evento_titulo}
                        </h3>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={14} />
                            <span>{formatDate(booking.fecha_evento)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock size={14} />
                            <span>{formatTime(booking.hora_evento)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin size={14} />
                            <span>{booking.ubicacion}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-shrink-0">
                        {getStatusBadge(booking.estado)}
                      </div>
                    </div>

                    <div className="mb-3">
                      <span className="text-xs text-gray-500">Código: </span>
                      <span className="font-mono text-sm text-purple-400">
                        {booking.codigo_reserva}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      {booking.estado === 'confirmada' && (
                        <button
                          onClick={(e) => handleViewQR(booking, e)}
                          className="btn btn-primary text-sm px-4 py-2 flex items-center gap-2"
                        >
                          <QrCode size={16} />
                          Ver QR
                        </button>
                      )}
                      
                      {canCancel(booking) && (
                        <button
                          onClick={(e) => handleCancelClick(booking, e)}
                          className="btn btn-outline text-sm px-4 py-2 flex items-center gap-2"
                        >
                          <XCircle size={16} />
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sin resultados */}
        {!loading && filteredBookings.length === 0 && !error && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎫</div>
            <h3 className="text-2xl font-bold text-white mb-2">
              {searchTerm ? 'No se encontraron eventos' : (
                <>
                  {filter === 'all' && 'No tienes eventos'}
                  {filter === 'upcoming' && 'No tienes eventos próximos'}
                  {filter === 'past' && 'No tienes eventos pasados'}
                </>
              )}
            </h3>
            <p className="text-gray-400 text-lg mb-6">
              {searchTerm ? `No hay resultados para "${searchTerm}"` : (
                <>
                  {filter === 'all' && 'Reserva tu primera entrada para un evento'}
                  {filter !== 'all' && 'Intenta con otro filtro'}
                </>
              )}
            </p>
            {filter === 'all' && !searchTerm && (
              <Button variant="primary" to="/eventos">
                Ver Eventos Disponibles
              </Button>
            )}
          </div>
        )}

      </div>

      {/* Modal del Evento */}
      <EventDetail
        event={selectedEvent}
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
      />

      {/* Modal QR Code */}
      {showQRModal && selectedBooking && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-90 z-50"
            onClick={() => setShowQRModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 max-w-md w-full rounded-xl border border-gray-800 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-light text-white uppercase">Tu Entrada</h3>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="text-center space-y-6">
                <div>
                  <p className="text-gray-400 mb-2">Evento</p>
                  <p className="text-white text-xl font-medium">{selectedBooking.evento_titulo}</p>
                </div>

                <div className="bg-white p-6 rounded-lg">
                  {selectedBooking.qr_code_url ? (
                    <>
                      <img
                        src={`${import.meta.env.VITE_BASE_URL}${selectedBooking.qr_code_url}`}
                        alt="QR Code"
                        className="w-full h-auto"
                        onError={(e) => {
                          console.error('❌ Error cargando QR:', e);
                          console.error('📍 URL completa:', e.target.src);
                          console.error('📍 QR path en BD:', selectedBooking.qr_code_url);
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'block';
                        }}
                      />
                      <div style={{ display: 'none' }} className="py-12 text-gray-400 text-sm">
                        <p className="mb-2">Error al cargar QR</p>
                        <p className="text-xs text-red-400 mb-2">
                          Ruta: {selectedBooking.qr_code_url}
                        </p>
                        <p className="text-xs text-gray-500">
                          Verifica la consola del navegador (F12) para más detalles
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="py-12 text-gray-400">
                      <p className="mb-2">QR no disponible</p>
                      <p className="text-xs text-gray-500">
                        El código QR no se generó correctamente para esta reserva.
                        Contacta con el administrador.
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Código de Reserva</p>
                  <p className="text-purple-400 font-mono text-lg font-bold">
                    {selectedBooking.codigo_reserva}
                  </p>
                </div>

                <p className="text-gray-500 text-sm">
                  Muestra este código QR en la entrada del evento
                </p>

                <Button
                  variant="outline"
                  onClick={() => setShowQRModal(false)}
                  className="w-full"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal Cancelar Reserva */}
      {showCancelModal && selectedBooking && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-90 z-50"
            onClick={() => !cancelling && setShowCancelModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 max-w-md w-full rounded-xl border border-gray-800 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-light text-white uppercase">Cancelar Reserva</h3>
                <button
                  onClick={() => !cancelling && setShowCancelModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                  disabled={cancelling}
                >
                  <X size={24} />
                </button>
              </div>

              {!cancelSuccess ? (
                <>
                  <div className="mb-6">
                    <p className="text-gray-400 mb-2">Evento</p>
                    <p className="text-white text-lg font-medium">{selectedBooking.evento_titulo}</p>
                    <p className="text-gray-500 text-sm mt-1">
                      {formatDate(selectedBooking.fecha_evento)} - {formatTime(selectedBooking.hora_evento)}
                    </p>
                  </div>

                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
                    <p className="text-gray-300 text-sm">
                      Esta acción no se puede deshacer. Tu plaza quedará disponible para otros socios.
                    </p>
                  </div>

                  <div className="mb-6">
                    <label className="block text-gray-400 text-sm mb-2">
                      Motivo de cancelación (opcional)
                    </label>
                    <textarea
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="input w-full h-24 resize-none"
                      placeholder="Ej: Conflicto de horario, cambio de planes..."
                      disabled={cancelling}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowCancelModal(false)}
                      disabled={cancelling}
                      className="flex-1"
                    >
                      Mantener Reserva
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleCancelBooking}
                      disabled={cancelling}
                      className="flex-1 bg-red-600 hover:bg-red-700"
                    >
                      {cancelling ? 'Cancelando...' : 'Confirmar Cancelación'}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="text-green-500 w-16 h-16 mx-auto mb-4" />
                  <h4 className="text-xl text-white font-medium mb-2">
                    Reserva Cancelada
                  </h4>
                  <p className="text-gray-400">
                    Tu reserva ha sido cancelada exitosamente
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MisEntradas;