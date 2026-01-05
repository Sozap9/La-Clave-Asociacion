import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFeaturedEvents } from '../../api/eventsApi';
import { ChevronLeft, ChevronRight, Calendar, MapPin, Star } from 'lucide-react';

const FeaturedEventsCarousel = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
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

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % events.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + events.length) % events.length);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleViewEvent = (eventId) => {
    navigate('/eventos');
  };

  // Don't render if no events or error
  if (error || events.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <section className="py-20 px-4 bg-gray-900/50">
        <div className="container-custom">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-4 bg-gray-900/50">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Star className="text-yellow-400" size={32} fill="currentColor" />
            <h2 className="text-4xl font-bold text-white">Eventos Destacados</h2>
            <Star className="text-yellow-400" size={32} fill="currentColor" />
          </div>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Descubre nuestra selección especial de eventos imperdibles
          </p>
        </div>

        {/* Carousel */}
        <div className="relative max-w-5xl mx-auto">
          {/* Main Image */}
          <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl mb-6">
            <img
              src={`${import.meta.env.VITE_API_URL}${events[currentIndex].imagen_cartel_url}`}
              alt={events[currentIndex].titulo}
              className="w-full h-full object-cover"
            />
            
            {/* Overlay with event info */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="text-yellow-400" size={20} fill="currentColor" />
                  <span className="text-yellow-400 text-sm font-semibold uppercase tracking-wide">
                    Destacado
                  </span>
                </div>
                
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  {events[currentIndex].titulo}
                </h3>
                
                <div className="flex flex-wrap gap-4 mb-6 text-gray-200">
                  <div className="flex items-center gap-2">
                    <Calendar size={18} />
                    <span>{formatDate(events[currentIndex].fecha_evento)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={18} />
                    <span>{events[currentIndex].ubicacion}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleViewEvent(events[currentIndex].id)}
                  className="btn-primary"
                >
                  Ver Detalles
                </button>
              </div>
            </div>

            {/* Navigation Arrows */}
            {events.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all backdrop-blur-sm"
                  aria-label="Anterior"
                >
                  <ChevronLeft size={24} />
                </button>
                
                <button
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all backdrop-blur-sm"
                  aria-label="Siguiente"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails / Dots */}
          {events.length > 1 && (
            <div className="flex justify-center gap-2 flex-wrap">
              {events.map((event, index) => (
                <button
                  key={event.id}
                  onClick={() => goToSlide(index)}
                  className={`transition-all ${
                    index === currentIndex
                      ? 'w-12 h-3 bg-primary-500'
                      : 'w-3 h-3 bg-gray-600 hover:bg-gray-500'
                  } rounded-full`}
                  aria-label={`Ir a evento ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Call to action */}
        <div className="text-center mt-12">
          <button
            onClick={() => navigate('/eventos')}
            className="btn-secondary"
          >
            Ver Todos los Eventos
          </button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedEventsCarousel;
