import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import Button from '../common/Button';

const EventCard = ({ event, onViewDetail }) => {
  const {
    id,
    nombre,
    descripcion,
    fecha,
    hora_inicio,
    ubicacion,
    aforo_maximo,
    aforo_actual,
    imagen_url,
    estado
  } = event;

  // Formatear fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Calcular porcentaje de aforo
  const aforoPercentage = (aforo_actual / aforo_maximo) * 100;
  const aforoColor = aforoPercentage >= 90 ? 'text-red-400' : 'text-primary-400';

  // Determinar si está lleno
  const isFull = aforo_actual >= aforo_maximo;
  const isPast = estado === 'pasado';

  return (
    <div className="card card-glow group cursor-pointer" onClick={onViewDetail}>
      {/* Imagen */}
      <div className="relative overflow-hidden rounded-t-lg h-56">
        <img
          src={imagen_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80'}
          alt={nombre}
          className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-500"
        />
        
        {/* Badge de estado */}
        {isPast && (
          <div className="absolute top-4 right-4 bg-gray-800/90 text-gray-300 px-3 py-1 rounded-full text-sm">
            Finalizado
          </div>
        )}
        {isFull && !isPast && (
          <div className="absolute top-4 right-4 bg-red-500/90 text-white px-3 py-1 rounded-full text-sm font-semibold">
            Completo
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="p-6 space-y-4">
        {/* Título */}
        <h3 className="text-2xl font-bold text-white group-hover:text-primary-400 transition-colors">
          {nombre}
        </h3>

        {/* Descripción */}
        <p className="text-gray-400 line-clamp-2">
          {descripcion}
        </p>

        {/* Info del evento */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-300">
            <Calendar size={18} className="text-primary-400" />
            <span className="text-sm">{formatDate(fecha)}</span>
          </div>

          <div className="flex items-center gap-2 text-gray-300">
            <Clock size={18} className="text-primary-400" />
            <span className="text-sm">{hora_inicio}</span>
          </div>

          <div className="flex items-center gap-2 text-gray-300">
            <MapPin size={18} className="text-primary-400" />
            <span className="text-sm">{ubicacion}</span>
          </div>

          <div className="flex items-center gap-2">
            <Users size={18} className={aforoColor} />
            <span className={`text-sm ${aforoColor} font-medium`}>
              {aforo_actual} / {aforo_maximo} personas
            </span>
          </div>
        </div>

        {/* Botón */}
        <Button
          variant={isFull || isPast ? 'outline' : 'primary'}
          disabled={isFull || isPast}
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetail();
          }}
        >
          {isPast ? 'Evento Finalizado' : isFull ? 'Aforo Completo' : 'Ver Detalles'}
        </Button>
      </div>
    </div>
  );
};

export default EventCard;