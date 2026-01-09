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

  //  CAMPOS CORRECTOS DE LA API
  const {
    titulo,
    descripcion,
    fecha_evento,
    hora_evento,
    ubicacion,
    aforo_maximo,
    entradas_disponibles,
    imagen_cartel_url,
    precio_socio,
    precio_invitado,
    permite_invitados
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

  // ✅ CORREGIDO: Usar campo correcto del backend que excluye canceladas y admin
  const entradas_reservadas = event.entradas_reservadas_real || 0;
  const isFull = entradas_disponibles <= 0;
  const canBook = !isFull && isAuthenticated;

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
          navigate('/mis-entradas');
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
        className="fixed inset-0 bg-black bg-opacity-90 z-50 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl 
                        border border-gray-800 animate-slide-up">
          
          {/* Header con imagen */}
          <div className="relative h-80">
            {imagen_cartel_url ? (
              <img
                src={`${import.meta.env.VITE_BASE_URL}${imagen_cartel_url}`}
                alt={titulo}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <span className="text-gray-600">Sin imagen</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
            
            {/* Botón cerrar */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-gray-900/80 hover:bg-gray-800 text-white p-3 
                        rounded-full transition-colors border border-gray-700"
              aria-label="Cerrar"
            >
              <X size={24} />
            </button>

            {/* Título sobre la imagen */}
            <div className="absolute bottom-6 left-6 right-6">
              <h2 className="text-4xl font-light text-white uppercase tracking-wide">
                {titulo}
              </h2>
            </div>
          </div>

          {/* Contenido */}
          <div className="p-8 space-y-6 bg-gray-900">
            
            {/* Alertas */}
            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-500/20 border border-green-500 text-green-200 px-4 py-3 rounded-lg">
                ¡Reserva confirmada! Redirigiendo a tus entradas...
              </div>
            )}

            {/* Info Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="text-purple-400 mt-1" size={20} />
                  <div>
                    <p className="text-gray-400 text-sm font-light">Fecha</p>
                    <p className="text-white font-medium">{formatDate(fecha_evento)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="text-purple-400 mt-1" size={20} />
                  <div>
                    <p className="text-gray-400 text-sm font-light">Horario</p>
                    {/*Hora sin segundos (HH:MM) */}
                    <p className="text-white font-medium">
                      {hora_evento ? hora_evento.slice(0, 5) : 'Por confirmar'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="text-purple-400 mt-1" size={20} />
                  <div>
                    <p className="text-gray-400 text-sm font-light">Ubicación</p>
                    <p className="text-white font-medium">{ubicacion}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="text-purple-400 mt-1" size={20} />
                  <div>
                    <p className="text-gray-400 text-sm font-light">Aforo</p>
                    {/*Usar campo correcto del backend */}
                    <p className="text-white font-medium">
                      {event.entradas_reservadas_real || 0} / {aforo_maximo} personas
                    </p>
                    {isFull && <span className="text-red-400 text-sm">¡Completo!</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Descripción */}
            {descripcion && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Info className="text-purple-400" size={20} />
                  <h3 className="text-xl font-light text-white uppercase tracking-wide">Descripción</h3>
                </div>
                <p className="text-gray-300 leading-relaxed font-light">
                  {descripcion}
                </p>
              </div>
            )}

            {/* Precios */}
            {(precio_socio || precio_invitado) && (
              <div className="bg-gray-800/50 border border-gray-800 rounded-lg p-4">
                <p className="text-gray-400 text-sm font-light mb-2">Precio</p>
                <div className="space-y-1">
                  {precio_socio > 0 && (
                    <p className="text-white font-medium">
                      <span className="text-purple-400">{precio_socio}€</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex gap-4 pt-4">
              {isAuthenticated ? (
                <Button
                  variant="primary"
                  onClick={handleBooking}
                  disabled={!canBook || loading}
                  className="flex-1 rounded-full"
                >
                  {loading ? 'Reservando...' : isFull ? 'Aforo Completo' : 'Reservar Plaza'}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  to="/login"
                  className="flex-1 rounded-full"
                >
                  Inicia sesión para reservar
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 rounded-full"
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