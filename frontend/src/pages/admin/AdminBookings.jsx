import { useState, useEffect } from 'react';
import { Ticket, Calendar, User, ChevronDown, ArrowLeft } from 'lucide-react';
import Loader from '../../components/common/Loader';
import FilterBar from '../../components/UI/FilterBar';
import SearchInput from '../../components/UI/SearchInput';
import Pagination from '../../components/UI/Pagination';
import { usePagination } from '../../hooks/usePagination';

const API_URL = import.meta.env.VITE_API_URL;

const AdminBookings = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [showEventSelector, setShowEventSelector] = useState(false);
  const [eventSearchTerm, setEventSearchTerm] = useState('');
  const [eventStatusFilter, setEventStatusFilter] = useState('all');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Modal de invitación (entrada gratuita para un socio elegido por el admin)
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [socioSearchTerm, setSocioSearchTerm] = useState('');
  const [socioResults, setSocioResults] = useState([]);
  const [loadingSocioSearch, setLoadingSocioSearch] = useState(false);
  const [selectedSocioForInvite, setSelectedSocioForInvite] = useState(null);
  const [inviteNumeroEntradas, setInviteNumeroEntradas] = useState(1);
  const [inviteStatus, setInviteStatus] = useState('idle'); // idle | sending | success | error
  const [inviteMessage, setInviteMessage] = useState('');

  useEffect(() => { fetchEvents(); }, []);
  useEffect(() => { if (selectedEvent) fetchBookings(selectedEvent.id); }, [selectedEvent]);

  // Búsqueda de socio con debounce, reutilizando el mismo endpoint que
  // usa el resto del panel de admin para buscar socios
  useEffect(() => {
    if (!showInviteModal || !socioSearchTerm.trim()) {
      setSocioResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoadingSocioSearch(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/admin/socios?search=${encodeURIComponent(socioSearchTerm)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        if (result.success) {
          setSocioResults(result.data?.socios || []);
        } else {
          setSocioResults([]);
        }
      } catch (err) {
        console.error('Error buscando socios:', err);
        setSocioResults([]);
      } finally {
        setLoadingSocioSearch(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [socioSearchTerm, showInviteModal]);

  const fetchEvents = async () => {
    setLoadingEvents(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/admin/events?limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        const sortedEvents = (result.data || []).sort((a, b) =>
          new Date(b.fecha_evento) - new Date(a.fecha_evento)
        );
        setEvents(sortedEvents);
      } else {
        setError(result.message || 'Error al cargar eventos');
      }
    } catch (err) {
      console.error('Error en fetchEvents:', err);
      setError('Error de conexión al cargar eventos');
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchBookings = async (eventId) => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/admin/bookings/event/${eventId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setBookings(result.data || []);
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
      const response = await fetch(`${API_URL}/admin/bookings/${bookingId}/cancel`, {
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
        fetchBookings(selectedEvent.id);
      } else {
        alert(result.message || 'Error al cancelar reserva');
      }
    } catch (err) {
      alert('Error de conexión');
    }
  };

  // Modal de reenviar entrada (regenera QR + reenvía email)
  const [resendModalBooking, setResendModalBooking] = useState(null);
  const [resendStatus, setResendStatus] = useState('idle'); // idle | sending | success | error
  const [resendMessage, setResendMessage] = useState('');

  const handleResendTicket = async () => {
    if (!resendModalBooking) return;
    setResendStatus('sending');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/admin/bookings/${resendModalBooking.id}/reenviar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      if (result.success) {
        setResendStatus('success');
        setResendMessage(result.message || 'Entrada reenviada');
      } else {
        setResendStatus('error');
        setResendMessage(result.message || 'Error al reenviar la entrada');
      }
    } catch (err) {
      setResendStatus('error');
      setResendMessage('Error de conexión');
    }
  };

  const closeResendModal = () => {
    setResendModalBooking(null);
    setResendStatus('idle');
    setResendMessage('');
  };

  const closeInviteModal = () => {
    setShowInviteModal(false);
    setSocioSearchTerm('');
    setSocioResults([]);
    setSelectedSocioForInvite(null);
    setInviteNumeroEntradas(1);
    setInviteStatus('idle');
    setInviteMessage('');
  };

  const handleSendInvitation = async () => {
    if (!selectedSocioForInvite || !selectedEvent) return;
    setInviteStatus('sending');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/admin/bookings/invitacion`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          socio_id: selectedSocioForInvite.id,
          event_id: selectedEvent.id,
          numero_entradas: inviteNumeroEntradas
        })
      });
      const result = await response.json();
      if (result.success) {
        setInviteStatus('success');
        setInviteMessage(result.message || 'Invitación enviada');
        fetchBookings(selectedEvent.id);
      } else {
        setInviteStatus('error');
        setInviteMessage(result.message || 'Error al enviar la invitación');
      }
    } catch (err) {
      setInviteStatus('error');
      setInviteMessage('Error de conexión');
    }
  };

  const filteredBookings = Array.isArray(bookings) ? bookings.filter(booking => {
    if (filter !== 'all' && booking.estado !== filter) return false;
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        booking.codigo_reserva?.toLowerCase().includes(searchLower) ||
        booking.socio_nombre?.toLowerCase().includes(searchLower) ||
        booking.socio_apellidos?.toLowerCase().includes(searchLower) ||
        booking.socio_email?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  }) : [];

  const {
    pageItems: paginatedBookings,
    page: bookingsPage,
    pages: bookingsPages,
    total: bookingsTotal,
    setPage: setBookingsPage,
  } = usePagination(filteredBookings, 20);

  const getEstadoBadge = (estado) => {
    const styles = {
      confirmada: 'bg-green-500/20 text-green-300 border border-green-500/30',
      cancelada:  'bg-red-500/20 text-red-300 border border-red-500/30',
      asistida:   'bg-blue-500/20 text-blue-300 border border-blue-500/30'
    };
    return styles[estado] || 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const formatEventDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const formatEventDateShort = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const filteredEvents = events.filter(event => {
    const now = new Date();
    const eventDate = new Date(event.fecha_evento);
    if (eventStatusFilter === 'upcoming' && eventDate < now) return false;
    if (eventStatusFilter === 'past' && eventDate >= now) return false;
    if (eventSearchTerm) {
      const searchLower = eventSearchTerm.toLowerCase();
      return (
        event.titulo?.toLowerCase().includes(searchLower) ||
        event.descripcion?.toLowerCase().includes(searchLower) ||
        event.ubicacion?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const {
    pageItems: paginatedEvents,
    page: eventsPage,
    pages: eventsPages,
    total: eventsTotal,
    setPage: setEventsPage,
  } = usePagination(filteredEvents, 12);

  if (loadingEvents) return <Loader fullScreen />;

  if (!selectedEvent) {
    return (
      <div className="p-4 md:p-8 bg-black min-h-screen">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
          <div>
            <h1 className="text-gradient mb-2 text-2xl md:text-4xl">Gestión de Reservas</h1>
            <p className="text-gray-400 text-sm md:text-lg">Selecciona un evento para ver sus reservas</p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <FilterBar
              filters={{ status: eventStatusFilter, featured: undefined }}
              onFilterChange={(f) => setEventStatusFilter(f.status || 'all')}
            />

            <div className="w-full sm:w-80">
              <SearchInput
                value={eventSearchTerm}
                onChange={(val) => setEventSearchTerm(val)}
                onClear={() => setEventSearchTerm('')}
                placeholder="Buscar eventos por nombre..."
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">{error}</div>
        )}

        {filteredEvents.length === 0 ? (
          <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-12 text-center">
            <Calendar className="mx-auto mb-4 text-gray-600" size={48} />
            <p className="text-gray-400 text-lg">
              {eventSearchTerm ? 'No se encontraron eventos con esos criterios' : 'No hay eventos disponibles'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedEvents.map((event) => {
              const isPast = new Date(event.fecha_evento) < new Date();
              return (
                <button
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6 hover:border-primary-500/50 transition-all text-left group"
                >
                  {event.imagen_url && (
                    <div className="mb-4 rounded-lg overflow-hidden">
                      <img src={event.imagen_url} alt={event.titulo} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary-300 transition-colors">{event.titulo}</h3>
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                    <Calendar size={16} className="text-primary-300" />
                    <span>{formatEventDate(event.fecha_evento)}</span>
                  </div>
                  {event.ubicacion && <p className="text-gray-500 text-sm mb-3">{event.ubicacion}</p>}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#262626]">
                    <span className={`text-xs font-medium ${isPast ? 'text-gray-500' : 'text-primary-300'}`}>
                      {isPast ? 'Evento finalizado' : 'Evento próximo'}
                    </span>
                    <ChevronDown className="text-primary-300 transform -rotate-90" size={20} />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <Pagination
          page={eventsPage}
          pages={eventsPages}
          total={eventsTotal}
          onPageChange={setEventsPage}
          itemLabel="eventos"
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-black min-h-screen">
      <div className="mb-8">
        <button
          onClick={() => { setSelectedEvent(null); setBookings([]); setSearch(''); setFilter('all'); }}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span>Volver a eventos</span>
        </button>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-gradient mb-2 text-2xl md:text-4xl">{selectedEvent.titulo}</h1>
            <div className="flex items-center gap-4 text-gray-400">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-primary-300" />
                <span>{formatEventDate(selectedEvent.fecha_evento)}</span>
              </div>
              {selectedEvent.ubicacion && <span className="text-gray-500">• {selectedEvent.ubicacion}</span>}
            </div>
            <p className="text-gray-400 text-lg mt-2">
              {Array.isArray(bookings) ? `${bookings.length} reserva${bookings.length !== 1 ? 's' : ''} total${bookings.length !== 1 ? 'es' : ''}` : 'Cargando reservas...'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <FilterBar
              customFilters={[
                { value: 'all',       label: 'Todas',      count: bookings.length },
                { value: 'confirmada',label: 'Confirmadas',count: bookings.filter(b => b.estado === 'confirmada').length },
                { value: 'asistida',  label: 'Asistidas',  count: bookings.filter(b => b.estado === 'asistida').length },
                { value: 'cancelada', label: 'Canceladas', count: bookings.filter(b => b.estado === 'cancelada').length },
              ]}
              activeFilter={filter}
              onFilterChange={(value) => setFilter(value)}
              showCounts={true}
            />

            <div className="w-full sm:w-80">
              <SearchInput
                value={search}
                onChange={(val) => setSearch(val)}
                onClear={() => setSearch('')}
                placeholder="Buscar por código, nombre o email..."
              />
            </div>

            <button
              onClick={() => setShowInviteModal(true)}
              className="px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <User size={18} />
              Invitar socio
            </button>

            <button
              onClick={() => setShowEventSelector(true)}
              className="px-4 py-3 bg-[#1a1a1a] border border-[#262626] hover:bg-[#262626] text-white rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <Calendar size={18} />
              Cambiar evento
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">{error}</div>
      )}

      {loading ? (
        <Loader fullScreen />
      ) : (
        <>
          {filteredBookings.length === 0 ? (
            <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-12 text-center">
              <Ticket className="mx-auto mb-4 text-gray-600" size={48} />
              <p className="text-gray-400 text-lg">
                {search ? 'No se encontraron reservas con esos criterios' : 'No hay reservas en esta categoría'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedBookings.map((booking) => (
                <div key={booking.id} className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6 hover:border-primary-500/50 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Ticket className="text-primary-300" size={24} />
                        <h3 className="text-xl font-bold text-white">{booking.codigo_reserva || `Reserva #${booking.id}`}</h3>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-gray-500 text-xs mb-1">Usuario</p>
                          <p className="text-white text-sm">
                            {booking.socio_nombre && booking.socio_apellidos
                              ? `${booking.socio_nombre} ${booking.socio_apellidos}`
                              : booking.socio_email || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs mb-1">Estado</p>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoBadge(booking.estado)}`}>{booking.estado}</span>
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
                      {booking.fecha_asistencia && (
                        <div className="flex items-center gap-2 text-gray-300 text-sm">
                          <Calendar size={16} className="text-primary-300" />
                          <span>Asistencia: {formatDate(booking.fecha_asistencia)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      {booking.estado === 'confirmada' && (
                        <>
                          <button
                            onClick={() => setResendModalBooking(booking)}
                            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm transition-colors"
                          >
                            Reenviar
                          </button>
                          <button onClick={() => handleCancelBooking(booking.id)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors">
                            Cancelar
                          </button>
                        </>
                      )}
                      <button onClick={() => setSelectedBooking(booking)} className="px-4 py-2 bg-[#262626] hover:bg-[#333333] text-white rounded-lg text-sm transition-colors">
                        Ver Detalles
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Pagination
            page={bookingsPage}
            pages={bookingsPages}
            total={bookingsTotal}
            onPageChange={setBookingsPage}
            itemLabel="reservas"
          />
        </>
      )}

      {/* Modal selector de eventos */}
      {showEventSelector && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowEventSelector(false)}>
          <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-8 max-w-4xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <h2 className="text-2xl font-bold text-white">Seleccionar Evento</h2>
              <button onClick={() => setShowEventSelector(false)} className="text-gray-400 hover:text-white text-2xl">×</button>
            </div>
            <div className="grid gap-4">
              {events.map((event) => {
                const isPast = new Date(event.fecha_evento) < new Date();
                const isSelected = selectedEvent?.id === event.id;
                return (
                  <button
                    key={event.id}
                    onClick={() => { setSelectedEvent(event); setShowEventSelector(false); }}
                    className={`bg-[#0a0a0a] border rounded-xl p-4 hover:border-primary-500/50 transition-all text-left flex items-start gap-4 ${isSelected ? 'border-primary-500' : 'border-[#262626]'}`}
                  >
                    {event.imagen_url && <img src={event.imagen_url} alt={event.titulo} className="w-24 h-24 object-cover rounded-lg" />}
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-1">{event.titulo}</h3>
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Calendar size={14} className="text-primary-300" />
                        <span>{formatEventDateShort(event.fecha_evento)}</span>
                        {isPast && <span className="text-gray-600">• Finalizado</span>}
                      </div>
                      {event.ubicacion && <p className="text-gray-500 text-sm mt-1">{event.ubicacion}</p>}
                    </div>
                    {isSelected && (
                      <div className="text-primary-300">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal detalles reserva */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedBooking(null)}>
          <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-8 max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <h2 className="text-2xl font-bold text-white">Detalles de Reserva</h2>
              <button onClick={() => setSelectedBooking(null)} className="text-gray-400 hover:text-white text-2xl">×</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 text-sm mb-1">Código de Reserva</p>
                  <p className="text-white font-mono">{selectedBooking.codigo_reserva || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm mb-1">Estado</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoBadge(selectedBooking.estado)}`}>{selectedBooking.estado}</span>
                </div>
              </div>
              <div>
                <p className="text-gray-500 text-sm mb-1">Evento</p>
                <p className="text-white text-lg font-semibold">{selectedEvent.titulo}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 text-sm mb-1">Usuario</p>
                  <p className="text-white">{selectedBooking.socio_nombre} {selectedBooking.socio_apellidos}</p>
                  <p className="text-gray-400 text-sm">{selectedBooking.socio_email}</p>
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
              <button onClick={() => setSelectedBooking(null)} className="flex-1 px-4 py-2 bg-[#262626] hover:bg-[#333333] text-white rounded-lg transition-colors">Cerrar</button>
              {selectedBooking.estado === 'confirmada' && (
                <button
                  onClick={() => { handleCancelBooking(selectedBooking.id); setSelectedBooking(null); }}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Cancelar Reserva
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal reenviar entrada */}
      {resendModalBooking && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => resendStatus !== 'sending' && closeResendModal()}
        >
          <div
            className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {resendStatus === 'idle' && (
              <>
                <h2 className="text-xl font-bold text-white mb-2">Reenviar entrada</h2>
                <p className="text-gray-400 text-sm mb-1">
                  Se va a regenerar el QR y reenviar el email de confirmación a:
                </p>
                <p className="text-white font-semibold mb-1">
                  {resendModalBooking.socio_nombre} {resendModalBooking.socio_apellidos}
                </p>
                <p className="text-gray-500 text-sm mb-6 font-mono">
                  {resendModalBooking.socio_email}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={closeResendModal}
                    className="flex-1 px-4 py-2 bg-[#262626] hover:bg-[#333333] text-white rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleResendTicket}
                    className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                  >
                    Reenviar
                  </button>
                </div>
              </>
            )}

            {resendStatus === 'sending' && (
              <div className="py-6 text-center">
                <Loader size="md" />
                <p className="text-gray-400 text-sm mt-4">Regenerando QR y enviando email...</p>
              </div>
            )}

            {resendStatus === 'success' && (
              <div className="text-center">
                <p className="text-green-400 text-lg font-semibold mb-2">Entrada reenviada</p>
                <p className="text-gray-400 text-sm mb-6">{resendMessage}</p>
                <button
                  onClick={closeResendModal}
                  className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                >
                  Cerrar
                </button>
              </div>
            )}

            {resendStatus === 'error' && (
              <div className="text-center">
                <p className="text-red-400 text-lg font-semibold mb-2">No se pudo reenviar</p>
                <p className="text-gray-400 text-sm mb-6">{resendMessage}</p>
                <div className="flex gap-3">
                  <button
                    onClick={closeResendModal}
                    className="flex-1 px-4 py-2 bg-[#262626] hover:bg-[#333333] text-white rounded-lg transition-colors"
                  >
                    Cerrar
                  </button>
                  <button
                    onClick={handleResendTicket}
                    className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Modal invitar socio (entrada gratuita) */}
      {showInviteModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => inviteStatus !== 'sending' && closeInviteModal()}
        >
          <div
            className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {(inviteStatus === 'idle') && (
              <>
                <h2 className="text-xl font-bold text-white mb-2">Invitar socio</h2>
                <p className="text-gray-400 text-sm mb-6">
                  Envía una entrada gratuita para <span className="text-white font-semibold">{selectedEvent?.titulo}</span>, con QR válido para el check-in, igual que una reserva normal.
                </p>

                {!selectedSocioForInvite ? (
                  <>
                    <label className="text-gray-400 text-sm mb-2 block">Buscar socio</label>
                    <input
                      type="text"
                      value={socioSearchTerm}
                      onChange={(e) => setSocioSearchTerm(e.target.value)}
                      placeholder="Nombre, email o número de socio..."
                      className="input w-full mb-3"
                      autoFocus
                    />
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {loadingSocioSearch && (
                        <p className="text-gray-500 text-sm text-center py-4">Buscando...</p>
                      )}
                      {!loadingSocioSearch && socioSearchTerm.trim() && socioResults.length === 0 && (
                        <p className="text-gray-500 text-sm text-center py-4">Sin resultados</p>
                      )}
                      {socioResults.map((socio) => (
                        <button
                          key={socio.id}
                          onClick={() => setSelectedSocioForInvite(socio)}
                          className="w-full bg-[#0a0a0a] border border-[#262626] hover:border-primary-500/50 rounded-lg p-3 text-left transition-colors"
                        >
                          <p className="text-white text-sm font-semibold">{socio.nombre} {socio.apellidos}</p>
                          <p className="text-gray-500 text-xs">{socio.email} {socio.numero_socio ? `• ${socio.numero_socio}` : ''}</p>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-[#0a0a0a] border border-primary-500/50 rounded-lg p-4 mb-4 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-white font-semibold">{selectedSocioForInvite.nombre} {selectedSocioForInvite.apellidos}</p>
                        <p className="text-gray-500 text-sm">{selectedSocioForInvite.email}</p>
                      </div>
                      <button
                        onClick={() => setSelectedSocioForInvite(null)}
                        className="text-gray-400 hover:text-white text-sm whitespace-nowrap"
                      >
                        Cambiar
                      </button>
                    </div>

                    <label className="text-gray-400 text-sm mb-2 block">Número de entradas</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={inviteNumeroEntradas}
                      onChange={(e) => setInviteNumeroEntradas(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                      className="input w-full mb-6"
                    />

                    <div className="flex gap-3">
                      <button
                        onClick={closeInviteModal}
                        className="flex-1 px-4 py-2 bg-[#262626] hover:bg-[#333333] text-white rounded-lg transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSendInvitation}
                        className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                      >
                        Enviar invitación
                      </button>
                    </div>
                  </>
                )}

                {!selectedSocioForInvite && (
                  <button
                    onClick={closeInviteModal}
                    className="w-full mt-4 px-4 py-2 bg-[#262626] hover:bg-[#333333] text-white rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                )}
              </>
            )}

            {inviteStatus === 'sending' && (
              <div className="py-6 text-center">
                <Loader size="md" />
                <p className="text-gray-400 text-sm mt-4">Creando invitación y enviando email...</p>
              </div>
            )}

            {inviteStatus === 'success' && (
              <div className="text-center">
                <p className="text-green-400 text-lg font-semibold mb-2">Invitación enviada</p>
                <p className="text-gray-400 text-sm mb-6">{inviteMessage}</p>
                <button
                  onClick={closeInviteModal}
                  className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                >
                  Cerrar
                </button>
              </div>
            )}

            {inviteStatus === 'error' && (
              <div className="text-center">
                <p className="text-red-400 text-lg font-semibold mb-2">No se pudo enviar</p>
                <p className="text-gray-400 text-sm mb-6">{inviteMessage}</p>
                <div className="flex gap-3">
                  <button
                    onClick={closeInviteModal}
                    className="flex-1 px-4 py-2 bg-[#262626] hover:bg-[#333333] text-white rounded-lg transition-colors"
                  >
                    Cerrar
                  </button>
                  <button
                    onClick={() => setInviteStatus('idle')}
                    className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                  >
                    Volver a intentar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBookings;