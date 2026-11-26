import { X, Calendar, MapPin, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { createBooking, getMyBookings, retryBookingPayment } from "../../api/eventsApi";
import Button from "../common/Button";
import { useState, useEffect, useRef } from "react";

const EventDetail = ({ event, isOpen, onClose }) => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const errorRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [avisoListaEspera, setAvisoListaEspera] = useState("");

  // Token caducado: fetch no pasa por el interceptor de axios
  function expireSession(message) {
    sessionStorage.setItem(
      "authMessage",
      message || "Tu sesión ha expirado. Vuelve a iniciar sesión para continuar."
    );
    logout();
    onClose();
    navigate("/login");
  }

  // Reserva que ya tenga el socio para este evento
  const [existingBooking, setExistingBooking] = useState(null);
  const [checkingBooking, setCheckingBooking] = useState(false);
  const [bookingCheck, setBookingCheck] = useState(0);

  // Al volver de Stripe con "atrás" el navegador restaura la página tal cual
  useEffect(() => {
    const onPageShow = (e) => {
      if (e.persisted) setBookingCheck((n) => n + 1);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

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

        if (result.status === 401) {
          expireSession(result.message);
          return;
        }

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
  }, [isOpen, event?.id, isAuthenticated, bookingCheck]);

  // En móvil el aviso puede quedar fuera de pantalla
  useEffect(() => {
    if (error) {
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [error]);

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
  // Con el aforo completo el botón apunta a la lista de espera
  const canBook = isAuthenticated && !existingBooking;

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

      if (result.status === 401) {
        expireSession(result.message);
        return;
      }

      if (result.success) {
        // De pago: a Stripe. La reserva se confirma con el webhook, no al volver
        if (result.data?.checkout_url) {
          window.location.href = result.data.checkout_url;
          return;
        }

        // Aforo completo: queda en la lista de espera, sin entrada
        if (result.data?.waiting_list) {
          setAvisoListaEspera(result.message);
          return;
        }

        // Gratis: ya viene confirmada
        setSuccess(true);
        setTimeout(() => {
          onClose();
          navigate("/mis-entradas");
        }, 2000);
      } else if (result.status === 409 && result.data?.position) {
        // Ya estaba en la lista de espera
        setAvisoListaEspera(result.message);
      } else {
        setError(result.message || "Error al crear la reserva");
        // Ya hay reserva (p. ej. pago a medias): refrescar para ofrecer "Completar pago"
        if (result.status === 409) setBookingCheck((n) => n + 1);
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // Pago pendiente: nueva sesión de Stripe para la misma reserva
  const handleResumePayment = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const result = await retryBookingPayment(existingBooking.id, token);

      if (result.status === 401) {
        expireSession(result.message);
        return;
      }

      if (result.success && result.data?.checkout_url) {
        window.location.href = result.data.checkout_url;
        return;
      }

      setError(result.message || "No se pudo abrir el pago. Intenta de nuevo.");
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Fondo */}
      <div
        className="fixed inset-0 bg-black/90 z-50 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-[#0a0a0a] border border-[#262626] max-w-5xl w-full max-h-[92vh] md:max-h-[85vh] flex flex-col shadow-2xl animate-slide-up overflow-hidden"
        >
          {/* Cerrar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/80 hover:bg-[#1a1a1a] text-white p-2
                      border border-[#333] transition-colors z-10"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>

          {/* Cabecera */}
          <div className="bg-[#111111] border-b border-[#262626] px-4 sm:px-8 pt-6 sm:pt-10 pb-4 sm:pb-8 flex-none">
            <h2 className="text-xl sm:text-3xl md:text-4xl font-light text-white uppercase tracking-widest mb-4 sm:mb-8 pr-10">
              {titulo}
            </h2>

            {/* Fecha, hora y lugar */}
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

          {/* Una columna en móvil, dos en escritorio */}
          <div className="flex flex-col md:grid md:grid-cols-2 gap-0 flex-1 min-h-0 overflow-y-auto md:overflow-hidden">

            {/* Columna izquierda */}
            <div className="p-4 sm:p-8 flex flex-col gap-5 border-r border-[#262626] md:overflow-y-auto min-h-0">

              {/* Avisos */}
              {success && (
                <div className="bg-green-500/20 border border-green-500 text-green-200 px-4 py-3 text-sm">
                  ¡Reserva confirmada! Redirigiendo a tus entradas...
                </div>
              )}

              {avisoListaEspera && (
                <div className="bg-amber-500/20 border border-amber-500 text-amber-200 px-4 py-3 text-sm">
                  {avisoListaEspera}
                </div>
              )}

              {/* Descripción */}
              {descripcion && (
                <p className="text-gray-300 leading-relaxed font-light text-sm whitespace-pre-line">
                  {descripcion}
                </p>
              )}

              {/* Imagen, solo en móvil */}
              {imagen_cartel_url && (
                <div className="md:hidden w-full flex-shrink-0 rounded-lg overflow-hidden">
                  <img
                    src={`${import.meta.env.VITE_BASE_URL}${imagen_cartel_url}`}
                    alt={titulo}
                    className="w-full h-auto object-contain"
                  />
                </div>
              )}

              <div className="border-t border-[#262626]" />

              {/* Precio o donación */}
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

              {/* Reservar */}
              <div className="md:mt-auto pt-2 flex flex-col gap-3">
                {error && (
                  <div
                    ref={errorRef}
                    role="alert"
                    className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 text-sm"
                  >
                    {error}
                  </div>
                )}
                {isAuthenticated ? (
                  existingBooking?.estado === "confirmada" ? (
                    <Button
                      variant="primary"
                      onClick={() => {
                        onClose();
                        navigate(`/mis-entradas?ver=${existingBooking.id}`);
                      }}
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={18} />
                      Ya tienes reserva
                    </Button>
                  ) : existingBooking ? (
                    <Button
                      variant="primary"
                      onClick={handleResumePayment}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <AlertCircle size={18} />
                      {loading ? "Procesando..." : "Completar pago"}
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
                            ? "Aforo completo: apuntarme a la lista de espera"
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

            {/* Cartel, solo en escritorio */}
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