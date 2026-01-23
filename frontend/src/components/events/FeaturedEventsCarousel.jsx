import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFeaturedEvents } from '../../api/eventsApi';
import EventCard from './EventCard';

const FeaturedEventsCarousel = () => {
  const navigate = useNavigate();
  const handleClick = (event) => {
    navigate(`/eventos/${event.id}`);  //  Va al detalle del evento específico
  };
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFeaturedEvents();
  }, []);

  const fetchFeaturedEvents = async () => {
    try {
      const result = await getFeaturedEvents();
      
      if (result.success) {
        setEvents(result.data || []);
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error('Error fetching featured events:', err);
      setError('Error al cargar eventos destacados');
    } finally {
      setLoading(false);
    }
  };

  // No se ve si no hay eventos destacados o hay un error
  if (error || events.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <section className="py-24 bg-[#0a0a0a]">
        <div className="container-custom">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 bg-[#0a0a0a] border-t border-[#262626]">
      <div className="container-custom px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-light text-white mb-4 uppercase tracking-wider">
            Eventos Destacados
          </h2>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent mx-auto mb-6" />
          <p className="text-gray-400 text-base md:text-lg font-light max-w-2xl mx-auto">
            Disfruta de la mejor selección de nuestros eventos.
          </p>
        </div>

        {/* Grid de eventos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedEventsCarousel;