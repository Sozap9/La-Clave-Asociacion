import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getMyBookings, cancelBooking, retryBookingPayment } from "../api/eventsApi";
import {
  Calendar,
  MapPin,
  Clock,
  Ticket,
  QrCode,
  X,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Button from "../components/common/Button";
import Loader from "../components/common/Loader";
import EventDetail from "../components/events/EventDetail";
import FilterBar from "../components/UI/FilterBar";
import SearchInput from "../components/UI/SearchInput";
import Pagination from "../components/UI/Pagination";
import { usePagination } from "../hooks/usePagination";
import EmptyState from "../components/common/EmptyState";

/**
 * Un evento no se considera "pasado" solo por su fecha — la venta/vigencia
 * de una entrada sigue hasta hora_fin (mismo criterio que usa el backend en
 * createBooking/sendBookingInvitation). Si hora_fin es anterior a
 * hora_evento, el evento cruza la medianoche y termina al día siguiente.
 */
const esEventoFinalizado = (booking) => {
  if (!booking?.fecha_evento) return false;
  const fechaEvento = new Date(booking.fecha_evento);
  const [horaInicioH, horaInicioM] = (booking.hora_evento || "00:00:00")
    .split(":")
    .map(Number);
  const [horaFinH, horaFinM] = (booking.hora_fin || "23:59:59")
    .split(":")
    .map(Number);
  const cruzaMedianoche =
    horaFinH * 60 + horaFinM < horaInicioH * 60 + horaInicioM;
  const finEvento = new Date(
    fechaEvento.getFullYear(),
    fechaEvento.getMonth(),
    fechaEvento.getDate() + (cruzaMedianoche ? 1 : 0),
    horaFinH || 0,
    horaFinM || 0,
    0
  );
  return finEvento <= new Date();
};

const MisEntradas = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("upcoming");
  const [searchTerm, setSearchTerm] = useState("");

  // Guardamos si veníamos de un pago exitoso ANTES de limpiar la URL,
  // para poder seguir reintentando la carga en segundo plano sin
  // mostrar ningún aviso al socio.
  const [cameFromSuccessfulPayment] = useState(
    () => searchParams.get("pago") === "exitoso"
  );

  // Si venimos de un enlace del email ("Ver mi entrada online"), trae
  // ?ver={booking.id} — guardamos el id para abrir directamente el QR
  // de ESA reserva en cuanto lleguen las reservas, en vez de dejar que
  // el socio tenga que buscarla a mano en la lista.
  const [verBookingId] = useState(() => searchParams.get("ver"));

  // Modal Evento
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);

  // Modal QR
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);

  // Modal Cancelar
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  // Reanudar pago de una reserva "esperando_pago"
  const [payingBookingId, setPayingBookingId] = useState(null);
  const [payError, setPayError] = useState("");

  // Si el usuario le da "atrás" después de pulsar "Pagar ahora" (antes de
  // que llegue a cargar Stripe), el navegador a veces restaura esta página
  // desde el caché (bfcache) en vez de recargarla. Como nunca volvíamos a
  // poner payingBookingId a null (dábamos por hecho que la página se iba),
  // el botón se quedaba congelado en "Redirigiendo..." sin poder volver a
  // pulsarlo. El evento 'pageshow' con persisted=true detecta justo ese
  // caso y libera el botón. También refrescamos las reservas por si el
  // estado cambió mientras tanto.
  useEffect(() => {
    const handlePageShow = (event) => {
      if (event.persisted) {
        setPayingBookingId(null);
        fetchBookings();
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
    // eslint-disable-next-line
  }, []);

  // Limpiamos los parámetros ?pago=... / ?ver=... de la URL en cuanto
  // entramos, para que no queden visibles en la barra de direcciones.
  useEffect(() => {
    if (searchParams.get("pago") || searchParams.get("ver")) {
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    fetchBookings();
  }, []);

  // Si volvemos de un pago exitoso, el webhook de Stripe puede tardar
  // unos segundos en confirmar la reserva — reintentamos la carga en
  // segundo plano un par de veces, sin mostrar nada al socio, para que
  // la reserva aparezca como "Confirmada" sin que tenga que recargar.
  useEffect(() => {
    if (!cameFromSuccessfulPayment) return;

    const retries = [3000, 6000, 10000];
    const timers = retries.map((ms) => setTimeout(() => fetchBookings(), ms));

    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line
  }, [cameFromSuccessfulPayment]);

  useEffect(() => {
    applyFilters();
  }, [filter, bookings, searchTerm]);

  // Si llegamos desde el enlace "Ver mi entrada online" del email
  // (?ver={booking.id}), abrimos directamente el modal del QR de esa
  // reserva en cuanto tengamos las reservas cargadas, en vez de dejar
  // que el socio tenga que encontrarla a mano en la lista.
  useEffect(() => {
    if (!verBookingId || bookings.length === 0) return;

    const booking = bookings.find((b) => String(b.id) === String(verBookingId));
    if (booking) {
      setSelectedBooking(booking);
      setShowQRModal(true);
    }
    // eslint-disable-next-line
  }, [verBookingId, bookings]);

  const fetchBookings = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const result = await getMyBookings(token);

      if (result.success) {
        const activeBookings = (result.data || []).filter(
          (b) => b.estado !== "cancelada"
        );

        setBookings(activeBookings);
      } else {
        setError(result.message || "Error al cargar tus entradas");
      }
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...bookings];

    if (searchTerm.trim()) {
      filtered = filtered.filter((b) =>
        b.evento_titulo.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    switch (filter) {
      case "upcoming":
        filtered = filtered.filter(
          (b) =>
            (b.estado === "confirmada" || b.estado === "esperando_pago") &&
            !esEventoFinalizado(b)
        );
        break;
      case "past":
        filtered = filtered.filter(
          (b) =>
            b.estado === "asistida" ||
            (b.estado === "confirmada" && esEventoFinalizado(b))
        );
        break;
      case "all":
        break;
      default:
        break;
    }

    filtered.sort(
      (a, b) => new Date(b.fecha_evento) - new Date(a.fecha_evento)
    );

    setFilteredBookings(filtered);
  };

  const handleViewEvent = (booking) => {
    const eventData = {
      id: booking.event_id,
      titulo: booking.evento_titulo,
      descripcion: booking.descripcion || "",
      descripcion_corta: booking.descripcion_corta || "",
      fecha_evento: booking.fecha_evento,
      hora_evento: booking.hora_evento,
      ubicacion: booking.ubicacion,
      direccion: booking.direccion || "",
      imagen_cartel_url: booking.imagen_cartel_url,
      aforo_maximo: booking.aforo_maximo || 0,
      entradas_disponibles: booking.entradas_disponibles || 0,
      precio_socio: booking.precio_socio || 0,
      precio_invitado: booking.precio_invitado || 0,
      permite_invitados: booking.permite_invitados || false,
      destacado: booking.destacado || false,
      edad_minima: booking.edad_minima || 18,
      tags: booking.tags,
      artistas: booking.artistas,
    };

    setSelectedEvent(eventData);
    setShowEventModal(true);
  };

  const handleViewQR = (booking, e) => {
    e.stopPropagation();
    setSelectedBooking(booking);
    setShowQRModal(true);
  };

  const handleCancelClick = (booking, e) => {
    e.stopPropagation();
    setSelectedBooking(booking);
    setShowCancelModal(true);
    setCancelReason("");
    setCancelSuccess(false);
  };

  const handleCancelBooking = async () => {
    setCancelling(true);

    try {
      const token = localStorage.getItem("token");
      const result = await cancelBooking(
        selectedBooking.id,
        token,
        cancelReason
      );

      if (result.success) {
        setCancelSuccess(true);
        setTimeout(() => {
          setShowCancelModal(false);
          fetchBookings();
        }, 1500);
      } else {
        alert(result.message || "Error al cancelar la reserva");
      }
    } catch (err) {
      alert("Error al cancelar la reserva. Intenta de nuevo.");
    } finally {
      setCancelling(false);
    }
  };

  const handlePayNow = async (booking, e) => {
    e.stopPropagation();
    setPayError("");
    setPayingBookingId(booking.id);

    // Salvaguarda: si por lo que sea la redirección no llega a completarse
    // (red lenta, la pestaña sigue viva más de la cuenta, etc.), liberamos
    // el botón a los 10s en vez de dejarlo bloqueado indefinidamente.
    const safetyTimeout = setTimeout(() => {
      setPayingBookingId((current) => (current === booking.id ? null : current));
    }, 10000);

    try {
      const token = localStorage.getItem("token");
      const result = await retryBookingPayment(booking.id, token);

      if (result.success && result.data?.checkout_url) {
        // Redirigimos a la nueva sesión de pago de Stripe, igual que
        // en la primera compra
        window.location.href = result.data.checkout_url;
      } else {
        clearTimeout(safetyTimeout);
        setPayError(result.message || "No se pudo iniciar el pago");
        setPayingBookingId(null);
      }
    } catch (err) {
      clearTimeout(safetyTimeout);
      setPayError("Error de conexión. Intenta de nuevo.");
      setPayingBookingId(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    return timeString.substring(0, 5);
  };

  const getStatusBadge = (estado) => {
    const badges = {
      confirmada: {
        text: "Confirmada",
        icon: CheckCircle,
        className: "bg-[#1a1a1a] text-gray-300 border-[#333333]",
      },
      esperando_pago: {
        text: "Pago Pendiente",
        icon: Clock,
        className: "bg-amber-500/10 text-amber-300 border-amber-500/40",
      },
      asistida: {
        text: "Asistida",
        icon: CheckCircle,
        className: "bg-[#1a1a1a] text-gray-300 border-[#333333]",
      },
      no_asistida: {
        text: "No Asistida",
        icon: AlertCircle,
        className: "bg-[#1a1a1a] text-gray-400 border-[#333333]",
      },
    };

    const badge = badges[estado] || badges.confirmada;
    const Icon = badge.icon;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs 
                        font-medium border ${badge.className}`}
      >
        <Icon size={12} />
        {badge.text}
      </span>
    );
  };

  const canCancel = (booking) => {
    const isFuture = !esEventoFinalizado(booking);
    // Una reserva pendiente de pago se puede cancelar siempre (no depende
    // de si el evento ya pasó — nunca llegó a confirmarse ni a cobrarse)
    if (booking.estado === "esperando_pago") return true;
    return booking.estado === "confirmada" && isFuture;
  };

  const counts = {
    all: bookings.length,
    upcoming: bookings.filter(
      (b) =>
        (b.estado === "confirmada" || b.estado === "esperando_pago") &&
        !esEventoFinalizado(b)
    ).length,
    past: bookings.filter(
      (b) =>
        b.estado === "asistida" ||
        (b.estado === "confirmada" && esEventoFinalizado(b))
    ).length,
  };

  // Filtros con contadores para FilterBar
  const entradaFilters = [
    { value: "upcoming", label: "Próximos", count: counts.upcoming },
    { value: "past",     label: "Pasados",  count: counts.past     },
    { value: "all",      label: "Todos",    count: counts.all      },
  ];

  // Mensaje del estado vacío según filtro activo
  const emptyTitle = searchTerm
    ? "No se encontraron eventos"
    : filter === "upcoming"
      ? "No tienes eventos próximos"
      : filter === "past"
        ? "No tienes eventos pasados"
        : "No tienes entradas";

  const emptySubtitle = searchTerm
    ? `No hay resultados para "${searchTerm}"`
    : filter !== "all"
      ? "Intenta con otro filtro"
      : "Reserva tu primera entrada para un evento";

  const { pageItems: paginatedBookings, page, pages, total, setPage } =
    usePagination(filteredBookings, 10);

  return (
    <div className="min-h-screen py-20 px-4 bg-black">
      <div className="container-custom max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div>
            <h1 className="text-gradient mb-2 text-2xl md:text-4xl">Mis Entradas</h1>
            <p className="text-gray-400 text-sm md:text-lg">
              Gestiona tus reservas y entradas
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 lg:pt-1">
            <FilterBar
              customFilters={entradaFilters}
              activeFilter={filter}
              onFilterChange={setFilter}
              showCounts={true}
            />

            <div className="w-full sm:w-80">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                onClear={() => setSearchTerm("")}
                placeholder="Buscar por evento..."
                debounceMs={300}
              />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-8">
            {error}
          </div>
        )}

        {payError && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-8">
            {payError}
          </div>
        )}

        {/* Loading */}
        {loading && <Loader size="lg" />}

        {/* Lista de entradas */}
        {!loading && filteredBookings.length > 0 && (
          <div className="space-y-4">
            {paginatedBookings.map((booking) => (
              <div
                key={booking.id}
                onClick={() => handleViewEvent(booking)}
                className="bg-[#0a0a0a] border border-[#262626] rounded-xl overflow-hidden 
                          hover:border-primary-500/50 transition-all group cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row sm:items-stretch">
                  {/* Imagen */}
                  <div className="relative sm:w-40 h-48 sm:h-auto flex-shrink-0 bg-[#1a1a1a] self-stretch">
                    {booking.imagen_cartel_url ? (
                      <img
                        src={`${import.meta.env.VITE_BASE_URL}${booking.imagen_cartel_url}`}
                        alt={booking.evento_titulo}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Ticket className="text-gray-600" size={32} />
                      </div>
                    )}
                  </div>

                  {/* Información */}
                  <div className="flex-1 p-5 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <h3
                          className="text-xl font-light text-white mb-2 uppercase tracking-wide 
                                      group-hover:text-primary-300 transition-colors"
                        >
                          {booking.evento_titulo}
                        </h3>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="text-primary-300" size={14} />
                            <span>{formatDate(booking.fecha_evento)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="text-primary-300" size={14} />
                            <span>{formatTime(booking.hora_evento)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="text-primary-300" size={14} />
                            <span>{booking.ubicacion}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        {getStatusBadge(booking.estado)}
                      </div>
                    </div>

                    <div className="mb-3">
                      <span className="text-xs text-gray-500">Código: </span>
                      <span className="font-mono text-sm text-primary-300">
                        {booking.codigo_reserva}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      {booking.estado === "confirmada" && (
                        <button
                          onClick={(e) => handleViewQR(booking, e)}
                          className="btn btn-primary text-sm px-4 py-2 flex items-center gap-2"
                        >
                          <QrCode size={16} />
                          Ver QR
                        </button>
                      )}

                      {booking.estado === "esperando_pago" && (
                        <button
                          onClick={(e) => handlePayNow(booking, e)}
                          disabled={payingBookingId === booking.id}
                          className="btn btn-primary text-sm px-4 py-2 flex items-center gap-2 disabled:opacity-60"
                        >
                          <Clock size={16} />
                          {payingBookingId === booking.id
                            ? "Redirigiendo..."
                            : "Pagar ahora"}
                        </button>
                      )}

                      {canCancel(booking) && (
                        <button
                          onClick={(e) => handleCancelClick(booking, e)}
                          className="btn btn-outline text-sm px-4 py-2 flex items-center gap-2"
                        >
                          <XCircle size={16} />
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Pagination
          page={page}
          pages={pages}
          total={total}
          onPageChange={setPage}
          itemLabel="entradas"
        />

        {/* Sin resultados */}
        {!loading && filteredBookings.length === 0 && !error && (
          <EmptyState
            icon={Ticket}
            title={emptyTitle}
            subtitle={emptySubtitle}
            action={
              filter === "all" && !searchTerm ? (
                <Button variant="primary" to="/eventos">
                  Ver Eventos Disponibles
                </Button>
              ) : null
            }
          />
        )}
      </div>

      {/* Modal del Evento */}
      <EventDetail
        event={selectedEvent}
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
      />

      {/* Modal QR Code */}
      {showQRModal && selectedBooking && (
        <>
          <div
            className="fixed inset-0 bg-black/90 z-50"
            onClick={() => setShowQRModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-[#0a0a0a] max-w-md w-full border border-[#262626] p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-light text-white uppercase tracking-wide">
                  Tu Entrada
                </h3>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="text-center space-y-6">
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">
                    Evento
                  </p>
                  <p className="text-white text-lg font-light uppercase tracking-wide">
                    {selectedBooking.evento_titulo}
                  </p>
                </div>

                <div className="bg-white p-6">
                  {selectedBooking.qr_code_url ? (
                    <>
                      <img
                        src={
                          selectedBooking.qr_code_url.startsWith("data:")
                            ? selectedBooking.qr_code_url
                            : `${import.meta.env.VITE_BASE_URL}${selectedBooking.qr_code_url}`
                        }
                        alt="QR Code"
                        className="w-full h-auto"
                        onError={(e) => {
                          console.error("❌ Error cargando QR:", e);
                          console.error("📍 URL completa:", e.target.src);
                          console.error(
                            "📍 QR path en BD:",
                            selectedBooking.qr_code_url
                          );
                          e.target.style.display = "none";
                          e.target.nextElementSibling.style.display = "block";
                        }}
                      />
                      <div
                        style={{ display: "none" }}
                        className="py-12 text-gray-400 text-sm"
                      >
                        <p className="mb-2">Error al cargar QR</p>
                        <p className="text-xs text-red-400 mb-2">
                          Ruta: {selectedBooking.qr_code_url}
                        </p>
                        <p className="text-xs text-gray-500">
                          Verifica la consola del navegador (F12) para más
                          detalles
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="py-12 text-gray-400">
                      <p className="mb-2">QR no disponible</p>
                      <p className="text-xs text-gray-500">
                        El código QR no se generó correctamente para esta
                        reserva. Contacta con el administrador.
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-[#1a1a1a] border border-[#262626] p-4">
                  <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">
                    Código de Reserva
                  </p>
                  <p className="text-primary-300 font-mono text-lg font-bold">
                    {selectedBooking.codigo_reserva}
                  </p>
                </div>

                <p className="text-gray-500 text-sm">
                  Muestra este código QR en la entrada del evento
                </p>

                <Button
                  variant="outline"
                  onClick={() => setShowQRModal(false)}
                  className="w-full"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal Cancelar Reserva */}
      {showCancelModal && selectedBooking && (
        <>
          <div
            className="fixed inset-0 bg-black/90 z-50"
            onClick={() => !cancelling && setShowCancelModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-[#0a0a0a] max-w-md w-full border border-[#262626] p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-light text-white uppercase tracking-wide">
                  Cancelar Reserva
                </h3>
                <button
                  onClick={() => !cancelling && setShowCancelModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                  disabled={cancelling}
                >
                  <X size={24} />
                </button>
              </div>

              {!cancelSuccess ? (
                <>
                  <div className="mb-6">
                    <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">
                      Evento
                    </p>
                    <p className="text-white text-lg font-light uppercase tracking-wide">
                      {selectedBooking.evento_titulo}
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      {formatDate(selectedBooking.fecha_evento)} —{" "}
                      {formatTime(selectedBooking.hora_evento)}
                    </p>
                  </div>

                  <div className="bg-[#1a1a1a] border border-[#262626] p-4 mb-6">
                    <p className="text-gray-400 text-sm">
                      Esta acción no se puede deshacer. Tu plaza quedará
                      disponible para otros socios.
                    </p>
                  </div>

                  <div className="mb-6">
                    <label className="block text-gray-500 text-xs uppercase tracking-widest mb-2">
                      Motivo de cancelación (opcional)
                    </label>
                    <textarea
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="input w-full h-24 resize-none"
                      placeholder="Ej: Conflicto de horario, cambio de planes..."
                      disabled={cancelling}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowCancelModal(false)}
                      disabled={cancelling}
                      className="flex-1"
                    >
                      Mantener Reserva
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleCancelBooking}
                      disabled={cancelling}
                      className="flex-1 bg-red-600 hover:bg-red-700"
                    >
                      {cancelling ? "Cancelando..." : "Confirmar Cancelación"}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="text-primary-300 w-16 h-16 mx-auto mb-4" />
                  <h4 className="text-xl font-light text-white uppercase tracking-wide mb-2">
                    Reserva Cancelada
                  </h4>
                  <p className="text-gray-400">
                    Tu reserva ha sido cancelada exitosamente
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MisEntradas;