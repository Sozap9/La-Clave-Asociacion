import { useState, useEffect } from 'react';
import { getAllEvents } from '../api/eventsApi';
import EventCard from '../components/events/EventCard';
import EventFilters from '../components/events/EventFilters';
import EventDetail from '../components/events/EventDetail';
import Loader from '../components/common/Loader';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ 
    status: 'upcoming',
    search: '',
    featured: undefined
  });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [filters]);

  const fetchEvents = async () => {
    setLoading(true);
    setError('');

    try {
      console.log('📥 Fetching events with filters:', filters);
      
      // Build query params based on filters
      const queryParams = {};
      
      if (filters.featured) {
        // Si es featured, solo enviar ese parámetro
        queryParams.featured = 'true';
      } else {
        // Si no, enviar status y search
        if (filters.status) {
          queryParams.status = filters.status;
        }
      }
      
      if (filters.search) {
        queryParams.search = filters.search;
      }
      
      const result = await getAllEvents(queryParams);
      
      console.log('📦 Response:', result);
      
      if (result.success) {
        setEvents(result.data || []);
      } else {
        setError(result.message || 'Error al cargar eventos');
        setEvents([]);
      }
    } catch (err) {
      console.error('❌ Error fetching events:', err);
      setError('Error de conexión. Intenta de nuevo.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (event) => {
    setSelectedEvent(event);
    setIsDetailOpen(true);
  };

  const getEmptyMessage = () => {
    if (filters.featured) {
      return 'No hay eventos destacados disponibles';
    }
    if (filters.status === 'upcoming') {
      return 'No hay eventos próximos disponibles';
    }
    if (filters.status === 'past') {
      return 'No hay eventos pasados';
    }
    if (filters.status === 'all') {
      return 'No hay eventos disponibles';
    }
    return 'No se encontraron eventos';
  };

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="container-custom">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-gradient mb-4">Eventos</h1>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto">
            Descubre los mejores eventos y reserva tu plaza
          </p>
        </div>

        {/* Filtros */}
        <EventFilters filters={filters} onFilterChange={setFilters} />

        {/* Error */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-8 max-w-2xl mx-auto">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && <Loader size="lg" />}

        {/* Grid de eventos */}
        {!loading && events.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onViewDetail={() => handleViewDetail(event)}
              />
            ))}
          </div>
        )}

        {/* Sin resultados */}
        {!loading && events.length === 0 && !error && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">
              {filters.featured ? '⭐' : '📅'}
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No se encontraron eventos</h3>
            <p className="text-gray-400 text-lg">
              {getEmptyMessage()}
            </p>
            {filters.search && (
              <p className="text-gray-500 text-sm mt-2">
                Intenta con otra búsqueda
              </p>
            )}
          </div>
        )}
      </div>

      {/* Modal de detalle */}
      <EventDetail
        event={selectedEvent}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </div>
  );
};

export default Events;
