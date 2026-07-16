import { X, Calendar, MapPin, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { createBooking, getMyBookings } from "../../api/eventsApi";
import Button from "../common/Button";
import { useState, useEffect } from "react";

const EventDetail = ({ event, isOpen, onClose }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Reserva ya existente del socio para este evento (si la hay)
  const [existingBooking, setExistingBooking] = useState(null);
  const [checkingBooking, setCheckingBooking] = useState(false);

  useEffect(() => {
    if (!isOpen || !event || !isAuthenticated) {
      setExistingBooking(null);
      return;
    }

    let cancelled = false;

    const checkExistingBooking = async () => {
      setCheckingBooking(true);
      try {
        const token = localStorage.getItem("token");
        const result = await getMyBookings(token);
        if (cancelled) return;

        if (result.success) {
          const found = (result.data || []).find(
            (b) =>
              b.event_id === event.id &&
              ["confirmada", "esperando_pago"].includes(b.estado)
          );
          setExistingBooking(found || null);
        }
      } catch (err) {
        console.error("Error comprobando reserva existente:", err);
      } finally {
        if (!cancelled) setCheckingBooking(false);
      }
    };

    checkExistingBooking();

    return () => {
      cancelled = true;
    };
  }, [isOpen, event?.id, isAuthenticated]);

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
  const canBook = !isFull && isAuthenticated && !existingBooking;

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
        // Evento de pago: el backend ya creó la reserva (esperando_pago)
        // y una Stripe Checkout Session real — redirigimos ahí a pagar.
        // La reserva no queda confirmada hasta que Stripe confirme el
        // pago (webhook), no al volver de esta redirección.
        if (result.data?.checkout_url) {
          window.location.href = result.data.checkout_url;
          return;
        }

        // Evento gratuito o entrada en lista de espera: ya viene resuelto
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
          className="bg-[#0a0a0a] border border-[#262626] max-w-5xl w-full max-h-[92vh] md:max-h-[85vh] flex flex-col shadow-2xl animate-slide-up overflow-hidden"
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
          <div className="bg-[#111111] border-b border-[#262626] px-4 sm:px-8 pt-6 sm:pt-10 pb-4 sm:pb-8 flex-none">
            <h2 className="text-xl sm:text-3xl md:text-4xl font-light text-white uppercase tracking-widest mb-4 sm:mb-8 pr-10">
              {titulo}
            </h2>

            {/* Info grid: fecha / hora / ubicación */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
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

          {/* ── CUERPO: mobile = columna, desktop = dos columnas ── */}
          <div className="flex flex-col md:grid md:grid-cols-2 gap-0 flex-1 min-h-0 overflow-y-auto md:overflow-hidden">

            {/* Columna izquierda (desktop) / scroll único (mobile) */}
            <div className="p-4 sm:p-8 flex flex-col gap-5 border-r border-[#262626] md:overflow-y-auto min-h-0">

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

              {/* Imagen — solo mobile, entre descripción y reserva */}
              {imagen_cartel_url && (
                <div className="md:hidden w-full flex-shrink-0 rounded-lg overflow-hidden">
                  <img
                    src={`${import.meta.env.VITE_BASE_URL}${imagen_cartel_url}`}
                    alt={titulo}
                    className="w-full h-auto object-contain"
                  />
                </div>
              )}

              {/* Separador */}
              <div className="border-t border-[#262626]" />

              {/* Precio / Donación */}
              {precio_socio > 0 && (
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">
                    Donación
                  </p>
                  <p className="text-primary-400 text-2xl font-light">
                    {precio_socio}€
                  </p>
                </div>
              )}

              {/* Botón reserva */}
              <div className="md:mt-auto pt-2">
                {isAuthenticated ? (
                  existingBooking ? (
                    <Button
                      variant="primary"
                      onClick={() => {
                        onClose();
                        if (existingBooking.estado === "confirmada") {
                          navigate(`/mis-entradas?ver=${existingBooking.id}`);
                        } else {
                          navigate("/mis-entradas");
                        }
                      }}
                      className="w-full flex items-center justify-center gap-2"
                    >
                      {existingBooking.estado === "confirmada" ? (
                        <CheckCircle size={18} />
                      ) : (
                        <AlertCircle size={18} />
                      )}
                      {existingBooking.estado === "confirmada"
                        ? "Ya tienes reserva"
                        : "Pago pendiente — Ver detalles"}
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={handleBooking}
                      disabled={!canBook || loading || checkingBooking}
                      className="w-full"
                    >
                      {loading
                        ? "Procesando..."
                        : checkingBooking
                          ? "Comprobando..."
                          : isFull
                            ? "Aforo Completo"
                            : precio_socio > 0
                              ? "Reservar y Donar"
                              : "Reservar Plaza"}
                    </Button>
                  )
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

            {/* Columna derecha: cartel — solo desktop */}
            <div className="bg-[#080808] overflow-hidden hidden md:flex md:items-center md:justify-center">
              {imagen_cartel_url ? (
                <img
                  src={`${import.meta.env.VITE_BASE_URL}${imagen_cartel_url}`}
                  alt={titulo}
                  className="w-full h-full object-contain"
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