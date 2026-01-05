import { X, Calendar, MapPin, Users, Clock, Info } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { createBooking } from '../../api/eventsApi';
import Button from '../common/Button';
import { useState } from 'react';

const EventDetail = ({ event, isOpen, onClose }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen || !event) return null;

  const {
    nombre,
    descripcion,
    fecha,
    hora_inicio,
    hora_fin,
    ubicacion,
    aforo_maximo,
    aforo_actual,
    imagen_url,
    estado,
    precio
  } = event;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const isFull = aforo_actual >= aforo_maximo;
  const isPast = estado === 'pasado';
  const canBook = !isFull && !isPast && isAuthenticated;

  const handleBooking = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const result = await createBooking(event.id, token);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          navigate('/panel');
        }, 2000);
      } else {
        setError(result.message || 'Error al crear la reserva');
      }
    } catch (err) {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-80 z-50 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-800 animate-slide-up">
          
          {/* Header con imagen */}
          <div className="relative h-80">
            <img
              src={imagen_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=80'}
              alt={nombre}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
            
            {/* Botón cerrar */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-gray-900/80 hover:bg-gray-800 text-white p-2 rounded-full transition-colors"
            >
              <X size={24} />
            </button>

            {/* Título sobre la imagen */}
            <div className="absolute bottom-6 left-6 right-6">
              <h2 className="text-4xl font-bold text-white mb-2">{nombre}</h2>
            </div>
          </div>

          {/* Contenido */}
          <div className="p-8 space-y-6">
            
            {/* Alertas */}
            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-500/20 border border-green-500 text-green-200 px-4 py-3 rounded-lg">
                ¡Reserva confirmada! Redirigiendo a tu panel...
              </div>
            )}

            {/* Info Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="text-primary-400 mt-1" size={20} />
                  <div>
                    <p className="text-gray-400 text-sm">Fecha</p>
                    <p className="text-white font-medium">{formatDate(fecha)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="text-primary-400 mt-1" size={20} />
                  <div>
                    <p className="text-gray-400 text-sm">Horario</p>
                    <p className="text-white font-medium">{hora_inicio} - {hora_fin}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="text-primary-400 mt-1" size={20} />
                  <div>
                    <p className="text-gray-400 text-sm">Ubicación</p>
                    <p className="text-white font-medium">{ubicacion}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="text-primary-400 mt-1" size={20} />
                  <div>
                    <p className="text-gray-400 text-sm">Aforo</p>
                    <p className="text-white font-medium">
                      {aforo_actual} / {aforo_maximo} personas
                    </p>
                    {isFull && <span className="text-red-400 text-sm">¡Completo!</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Descripción */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Info className="text-primary-400" size={20} />
                <h3 className="text-xl font-semibold text-white">Descripción</h3>
              </div>
              <p className="text-gray-300 leading-relaxed">
                {descripcion}
              </p>
            </div>

            {/* Precio */}
            {precio && (
              <div className="bg-gray-800/50 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Precio</p>
                <p className="text-2xl font-bold text-primary-400">{precio}€</p>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex gap-4 pt-4">
              {isAuthenticated ? (
                <Button
                  variant="primary"
                  onClick={handleBooking}
                  disabled={!canBook || loading}
                  className="flex-1"
                >
                  {loading ? 'Reservando...' : isPast ? 'Evento Finalizado' : isFull ? 'Aforo Completo' : 'Reservar Plaza'}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  to="/login"
                  className="flex-1"
                >
                  Inicia sesión para reservar
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EventDetail;