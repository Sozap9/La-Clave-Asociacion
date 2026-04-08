import { X, Calendar, MapPin, Clock } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { createBooking } from "../../api/eventsApi";
import Button from "../common/Button";
import { useState } from "react";

const EventDetail = ({ event, isOpen, onClose }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!isOpen || !event) return null;

  const {
    titulo,
    descripcion,
    fecha_evento,
    hora_evento,
    ubicacion,
    entradas_disponibles,
    imagen_cartel_url,
    precio_socio,
  } = event;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isFull = entradas_disponibles <= 0;
  const canBook = !isFull && isAuthenticated;

  const handleBooking = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const result = await createBooking(event.id, token);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          navigate("/mis-entradas");
        }, 2000);
      } else {
        setError(result.message || "Error al crear la reserva");
      }
    } catch (err) {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/90 z-50 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-[#0a0a0a] border border-[#262626] max-w-5xl w-full h-[88vh] flex flex-col shadow-2xl animate-slide-up overflow-hidden"
        >
          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/80 hover:bg-[#1a1a1a] text-white p-2
                      border border-[#333] transition-colors z-10"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>

          {/* ── CABECERA: título + info grid ── */}
          <div className="bg-[#111111] border-b border-[#262626] px-8 pt-10 pb-8 flex-none">
            <h2 className="text-3xl md:text-4xl font-light text-white uppercase tracking-widest mb-8">
              {titulo}
            </h2>

            {/* Info grid: fecha / hora / ubicación */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <p className="text-primary-400 text-xs uppercase tracking-widest mb-1">
                  Fecha
                </p>
                <p className="text-white text-sm font-light">
                  {formatDate(fecha_evento)}
                </p>
              </div>

              <div>
                <p className="text-primary-400 text-xs uppercase tracking-widest mb-1">
                  Horario
                </p>
                <p className="text-white text-sm font-light">
                  {hora_evento ? hora_evento.slice(0, 5) : "Por confirmar"}
                </p>
              </div>

              <div>
                <p className="text-primary-400 text-xs uppercase tracking-widest mb-1">
                  Ubicación
                </p>
                <p className="text-white text-sm font-light">{ubicacion}</p>
              </div>
            </div>
          </div>

          {/* ── CUERPO: descripción (izq) + cartel (der) ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 flex-1 overflow-hidden">
            {/* Columna izquierda: descripción + precio + botón */}
            <div className="p-8 flex flex-col gap-6 border-r border-[#262626] overflow-hidden">
              {/* Alertas */}
              {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-500/20 border border-green-500 text-green-200 px-4 py-3 text-sm">
                  ¡Reserva confirmada! Redirigiendo a tus entradas...
                </div>
              )}

              {/* Descripción */}
              {descripcion && (
                <p className="text-gray-300 leading-relaxed font-light text-sm whitespace-pre-line">
                  {descripcion}
                </p>
              )}

              {/* Separador */}
              <div className="border-t border-[#262626]" />

              {/* Precio */}
              {precio_socio > 0 && (
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">
                    Precio
                  </p>
                  <p className="text-primary-400 text-2xl font-light">
                    {precio_socio}€
                  </p>
                </div>
              )}

              {/* Botón reserva — empujado al fondo */}
              <div className="mt-auto pt-2">
                {isAuthenticated ? (
                  <Button
                    variant="primary"
                    onClick={handleBooking}
                    disabled={!canBook || loading}
                    className="w-full"
                  >
                    {loading
                      ? "Reservando..."
                      : isFull
                        ? "Aforo Completo"
                        : "Reservar Plaza"}
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    to="/login"
                    className="w-full"
                  >
                    Inicia sesión para reservar
                  </Button>
                )}
              </div>
            </div>

            {/* Columna derecha: cartel */}
            <div className="bg-[#080808] overflow-hidden">
              {imagen_cartel_url ? (
                <img
                  src={`${import.meta.env.VITE_BASE_URL}${imagen_cartel_url}`}
                  alt={titulo}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-gray-600 p-12">
                  <Calendar size={48} strokeWidth={1} />
                  <span className="text-sm font-light uppercase tracking-widest">
                    Sin imagen
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EventDetail;