import { Calendar, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EventCard = ({ event, onViewDetail }) => {
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleClick = () => {
    if (onViewDetail) {
      onViewDetail(event);
    } else {
      navigate('/eventos');
    }
  };

  // ✅ Usar VITE_BASE_URL para imágenes (sin /api)
  const imageUrl = event.imagen_cartel_url 
    ? `${import.meta.env.VITE_BASE_URL}${event.imagen_cartel_url}`
    : null;

  return (
    <div 
      onClick={handleClick}
      className="group cursor-pointer bg-[#1a1a1a] overflow-hidden border border-[#262626]
                 hover:border-purple-600 transition-all duration-300"
    >
      {/* Imagen del evento */}
      <div className="relative aspect-[4/3] overflow-hidden bg-[#0a0a0a]">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={event.titulo}
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 
                      transition-all duration-700 group-hover:scale-105"
            onError={(e) => {
              console.error('Error loading image:', imageUrl);
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = `
                <div class="w-full h-full flex items-center justify-center bg-[#0a0a0a]">
                  <span class="text-gray-600 text-sm">Sin imagen</span>
                </div>
              `;
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#0a0a0a]">
            <span className="text-gray-600 text-sm">Sin imagen</span>
          </div>
        )}
        {/* Overlay en hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300" />
      </div>

      {/* Contenido */}
      <div className="p-4 space-y-3">
        {/* Título */}
        <h3 className="text-white text-lg font-light uppercase tracking-wide line-clamp-2 
                      group-hover:text-purple-400 transition-colors">
          {event.titulo}
        </h3>

        {/* Detalles */}
        <div className="space-y-2 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="flex-shrink-0" />
            <span className="font-light">{formatDate(event.fecha_evento)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={16} className="flex-shrink-0" />
            <span className="font-light line-clamp-1">{event.ubicacion}</span>
          </div>
        </div>
        

        {/* Precio (si existe) */}
        {event.precio_socio && (
          <div className="pt-2 border-t border-[#262626]">
            <span className="text-purple-400 text-sm font-medium">
              {event.precio_socio}€
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventCard;