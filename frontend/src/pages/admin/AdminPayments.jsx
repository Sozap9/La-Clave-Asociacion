import { useState, useEffect, useRef } from "react";
import {
  CreditCard,
  Eye,
  X,
  Calendar,
  User,
  AlertCircle,
  Mail,
  Phone,
  Download,
  ChevronDown,
} from "lucide-react";
import Loader from "../../components/common/Loader";
import SearchInput from "../../components/UI/SearchInput";
import FilterBar from "../../components/UI/FilterBar";
import Button from "../../components/common/Button";
import AdminCard from "../../components/admin/AdminCard";
import DatePickerInput from "../../components/common/DatePickerInput";
import { exportReservas } from "../../api/adminApi";

const API_URL = import.meta.env.VITE_API_URL;

// ─── Filtros: solo los estados reales de booking que nos interesan ─────────────
const estadoFilters = [
  { value: "all",        label: "Todos" },
  { value: "confirmada", label: "Confirmadas" },
  { value: "cancelada",  label: "Canceladas" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getEstadoBadgeColor = (estado) => {
  const map = {
    confirmada:      "green",
    esperando_pago:  "yellow",
    cancelada:       "red",
    en_lista_espera: "blue",
  };
  return map[estado?.toLowerCase()] || "gray";
};

const getEstadoLabel = (estado) => {
  const labels = {
    confirmada:      "Confirmada",
    esperando_pago:  "Pendiente",
    cancelada:       "Cancelada",
    en_lista_espera: "Lista espera",
  };
  return (
    labels[estado?.toLowerCase()] ||
    (estado ? estado.charAt(0).toUpperCase() + estado.slice(1) : "Sin estado")
  );
};

const formatDate = (d) => {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("es-ES", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

const formatDateTime = (d) => {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("es-ES", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return "0,00€";
  return new Intl.NumberFormat("es-ES", {
    style: "currency", currency: "EUR",
  }).format(amount);
};

const getEventName = (event) => event.titulo || event.nombre || "Sin nombre";

// ─── Ordenar eventos: más próximo al día de hoy primero ──────────────────────
const sortEventsByProximity = (events) => {
  const now = new Date();
  return [...events].sort((a, b) => {
    const da = new Date(a.fecha_evento);
    const db = new Date(b.fecha_evento);
    const diffA = Math.abs(da - now);
    const diffB = Math.abs(db - now);
    return diffA - diffB;
  });
};

// ─────────────────────────────────────────────────────────────────────────────

const AdminPayments = () => {
  const [events, setEvents]               = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [entries, setEntries]             = useState([]);
  const [eventStats, setEventStats]       = useState(null);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [loadingExport, setLoadingExport] = useState(false);
  const [error, setError]                 = useState("");
  const [search, setSearch]               = useState("");
  const [estadoFilter, setEstadoFilter]   = useState("all");
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [page, setPage]                   = useState(1);

  // Sidebar: filtro por fecha y control del DatePicker
  const [dateFilter, setDateFilter]           = useState(null);
  const [showDatePicker, setShowDatePicker]   = useState(false);
  const datePickerRef                         = useRef(null);

  // Cerrar el datepicker si se hace click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target)) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cargar eventos al iniciar
  useEffect(() => { fetchEvents(); }, []);

  // Cargar entradas cuando cambia el evento, filtro, búsqueda o página
  useEffect(() => {
    if (selectedEvent) {
      fetchEventPayments();
    } else {
      setEntries([]);
      setEventStats(null);
    }
    // eslint-disable-next-line
  }, [selectedEvent, estadoFilter, search, page]);

  // ── API calls ───────────────────────────────────────────────────────────────

  const fetchEvents = async () => {
    setLoadingEvents(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/admin/events?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) {
        const list = result.data?.items || result.data || [];
        setEvents(Array.isArray(list) ? list : []);
      } else {
        setError(result.message || "Error al cargar eventos");
      }
    } catch {
      setError("Error de conexión al cargar eventos");
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchEventPayments = async () => {
    if (!selectedEvent) return;
    setLoadingEntries(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (estadoFilter && estadoFilter !== "all")
        params.append("estado", estadoFilter);
      if (search.trim()) params.append("search", search.trim());
      params.append("page", page);
      params.append("limit", 50);

      const res = await fetch(
        `${API_URL}/admin/events/${selectedEvent.id}/payments?${params}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const result = await res.json();
      if (result.success) {
        setEntries(result.data?.entries || []);
        setEventStats(result.data?.stats || null);
      } else {
        setError(result.message || "Error al cargar pagos del evento");
        setEntries([]);
      }
    } catch {
      setError("Error de conexión");
      setEntries([]);
    } finally {
      setLoadingEntries(false);
    }
  };

  // ── Export: usa exportReservas de adminApi (igual que Gestión de Exportaciones) ─
  const handleExport = async () => {
    if (!selectedEvent) return;
    setLoadingExport(true);
    try {
      await exportReservas({ event_id: selectedEvent.id });
    } catch {
      setError("Error al descargar el PDF de entradas");
    } finally {
      setLoadingExport(false);
    }
  };

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleFilterChange = (value) => { setEstadoFilter(value); setPage(1); };
  const handleSearchChange = (value) => { setSearch(value); setPage(1); };

  const handleSendReminder = async (entryId) => {
    if (!window.confirm("¿Enviar recordatorio de pago?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/admin/bookings/${entryId}/reminder`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const result = await res.json();
      alert(result.success ? "Recordatorio enviado" : result.message || "Error al enviar recordatorio");
    } catch {
      alert("Error de conexión");
    }
  };

  // ── Eventos filtrados para el sidebar ───────────────────────────────────────
  // Ordena por proximidad a hoy, filtra por mes si hay dateFilter, máx 10
  const visibleEvents = (() => {
    let list = sortEventsByProximity(events);
    if (dateFilter) {
      list = list.filter((e) => {
        const d = new Date(e.fecha_evento);
        return (
          d.getMonth()     === dateFilter.getMonth() &&
          d.getFullYear()  === dateFilter.getFullYear()
        );
      });
    }
    return list.slice(0, 10);
  })();

  if (loadingEvents) return <Loader fullScreen />;

  return (
    <div className="p-4 md:p-8 bg-black min-h-screen">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-gradient mb-2 text-2xl md:text-4xl">
          Gestión de Pagos por Evento
        </h1>
        <p className="text-gray-200 text-sm md:text-lg">
          Visualiza pagos e ingresos organizados por evento
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6 flex items-center gap-3">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-4 sm:p-6 lg:sticky lg:top-8">

            {/* Título + botón calendario */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Calendar size={20} className="text-primary-300" />
                Eventos
              </h2>

              {/* Filtro por mes con DatePicker */}
              <div className="relative" ref={datePickerRef}>
                <button
                  onClick={() => setShowDatePicker((v) => !v)}
                  title="Filtrar por mes"
                  className={`p-1.5 rounded-lg transition-colors ${
                    dateFilter
                      ? "bg-primary-500/30 text-primary-300 border border-primary-500/50"
                      : "text-gray-500 hover:text-primary-300 hover:bg-[#262626]"
                  }`}
                >
                  <ChevronDown size={16} className={`transition-transform ${showDatePicker ? "rotate-180" : ""}`} />
                </button>

                {showDatePicker && (
                  <div className="absolute right-0 top-9 z-50 bg-[#1a1a1a] border border-[#262626] rounded-xl shadow-2xl p-3 min-w-[260px]">
                    <DatePickerInput
                      selected={dateFilter}
                      onChange={(date) => {
                        setDateFilter(date);
                        setShowDatePicker(false);
                      }}
                      placeholderText="Seleccionar mes..."
                      dateFormat="MMMM yyyy"
                    />
                    {dateFilter && (
                      <button
                        onClick={() => { setDateFilter(null); setShowDatePicker(false); }}
                        className="mt-2 w-full text-xs text-gray-400 hover:text-red-400 transition-colors py-1"
                      >
                        Quitar filtro
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Indicador del mes activo */}
            {dateFilter && (
              <div className="mb-3 px-2 py-1.5 bg-primary-500/10 border border-primary-500/20 rounded-lg flex items-center justify-between">
                <span className="text-primary-300 text-xs font-medium">
                  {dateFilter.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
                </span>
                <button
                  onClick={() => setDateFilter(null)}
                  className="text-gray-500 hover:text-red-400 transition-colors"
                >
                  <X size={13} />
                </button>
              </div>
            )}

            {visibleEvents.length === 0 ? (
              <p className="text-gray-400 text-sm">
                {dateFilter ? "Sin eventos en ese mes" : "No hay eventos disponibles"}
              </p>
            ) : (
              <div className="space-y-2">
                {visibleEvents.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => {
                      setSelectedEvent(event);
                      setPage(1);
                      setSearch("");
                      setEstadoFilter("all");
                    }}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      selectedEvent?.id === event.id
                        ? "bg-primary-500/20 border border-primary-500 text-primary-300"
                        : "bg-[#0a0a0a] border border-[#262626] text-gray-300 hover:border-[#404040]"
                    }`}
                  >
                    <div className="font-medium text-sm line-clamp-2">
                      {getEventName(event)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDate(event.fecha_evento)}
                    </div>
                  </button>
                ))}

                {/* Indicador si hay más de 10 */}
                {!dateFilter && events.length > 10 && (
                  <p className="text-center text-xs text-gray-600 pt-1">
                    Mostrando 10 de {events.length} eventos
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Contenido principal ─────────────────────────────────────────── */}
        <div className="lg:col-span-3">
          {!selectedEvent ? (
            <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-12 text-center">
              <Calendar className="mx-auto mb-4 text-gray-600" size={48} />
              <p className="text-gray-400 text-lg mb-2">
                Selecciona un evento para ver sus pagos
              </p>
              <p className="text-gray-500 text-sm">
                Haz clic en cualquier evento de la lista para visualizar las
                entradas y pagos asociados
              </p>
            </div>
          ) : (
            <>
              {/* ── Header del evento ──────────────────────────────────────── */}
              <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6 mb-6">

                {/* Título + botón export */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-1">
                  <h3 className="text-2xl font-bold text-white">
                    {getEventName(selectedEvent)}
                  </h3>

                  <button
                    onClick={handleExport}
                    disabled={loadingExport}
                    className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <Download size={15} />
                    {loadingExport ? "Generando..." : "Exportar"}
                  </button>
                </div>

                <p className="text-gray-400 text-sm mb-4">
                  {formatDate(selectedEvent.fecha_evento)}
                  {selectedEvent.capacidad
                    ? ` • Capacidad: ${selectedEvent.capacidad} personas`
                    : ""}
                </p>

                {/* Stats: solo Total + Confirmadas */}
                {eventStats && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-[#0a0a0a] rounded-lg p-4">
                      <p className="text-gray-500 text-sm">Total Entradas</p>
                      <p className="text-primary-300 text-2xl font-bold mt-1">
                        {eventStats.total_entradas || 0}
                      </p>
                    </div>
                    <div className="bg-[#0a0a0a] rounded-lg p-4">
                      <p className="text-gray-500 text-sm">Confirmadas</p>
                      <p className="text-green-400 text-2xl font-bold mt-1">
                        {eventStats.pagos_exitosos || 0}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Filtros ────────────────────────────────────────────────── */}
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 sm:gap-4">
                <FilterBar
                  customFilters={estadoFilters}
                  activeFilter={estadoFilter}
                  onFilterChange={handleFilterChange}
                />
                <div className="w-full sm:w-80">
                  <SearchInput
                    value={search}
                    onChange={handleSearchChange}
                    onClear={() => handleSearchChange("")}
                    placeholder="Buscar por socio, email..."
                    debounceMs={350}
                  />
                </div>
              </div>

              {/* ── Loading ────────────────────────────────────────────────── */}
              {loadingEntries && (
                <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4" />
                  <p className="text-gray-400">Cargando entradas...</p>
                </div>
              )}

              {/* ── Lista de entradas ──────────────────────────────────────── */}
              {!loadingEntries && entries.length === 0 ? (
                <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-12 text-center">
                  <CreditCard className="mx-auto mb-4 text-gray-600" size={48} />
                  <p className="text-gray-400 text-sm md:text-lg">
                    {search || estadoFilter !== "all"
                      ? "No se encontraron entradas"
                      : "No hay entradas en este evento"}
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {entries.map((entry) => (
                      <AdminCard
                        key={entry.booking_id}
                        avatar={
                          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center">
                            <CreditCard className="text-white" size={24} />
                          </div>
                        }
                        title={
                          [entry.socio_nombre, entry.socio_apellidos]
                            .filter(Boolean)
                            .join(" ") || "Socio desconocido"
                        }
                        subtitle={
                          <span className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400 mt-1">
                            {entry.socio_email && (
                              <span className="flex items-center gap-1">
                                <Mail size={13} className="text-gray-500" />
                                {entry.socio_email}
                              </span>
                            )}
                            {entry.socio_telefono && (
                              <span className="flex items-center gap-1">
                                <Phone size={13} className="text-gray-500" />
                                {entry.socio_telefono}
                              </span>
                            )}
                            {!entry.socio_email && !entry.socio_telefono && (
                              <span className="text-gray-500">Sin contacto</span>
                            )}
                          </span>
                        }
                        badges={[
                          entry.numero_socio && {
                            text: entry.numero_socio,
                            color: "primary",
                          },
                          {
                            text: getEstadoLabel(entry.payment_estado),
                            color: getEstadoBadgeColor(entry.payment_estado),
                          },
                        ].filter(Boolean)}
                        actions={[
                          {
                            icon: <Eye size={20} />,
                            onClick: () => setSelectedEntry(entry),
                            color: "primary",
                            title: "Ver detalles",
                          },
                          entry.payment_estado?.toLowerCase() === "esperando_pago" && {
                            icon: <AlertCircle size={20} />,
                            onClick: () => handleSendReminder(entry.booking_id),
                            color: "yellow",
                            title: "Enviar recordatorio",
                          },
                        ].filter(Boolean)}
                      />
                    ))}
                  </div>

                  {/* Paginación */}
                  {entries.length > 0 && (
                    <div className="mt-6 flex justify-center gap-2">
                      <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 rounded-lg border border-[#262626] text-gray-300 hover:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Anterior
                      </button>
                      <span className="px-4 py-2 text-gray-400">Página {page}</span>
                      <button
                        onClick={() => setPage(page + 1)}
                        disabled={entries.length < 50}
                        className="px-4 py-2 rounded-lg border border-[#262626] text-gray-300 hover:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Siguiente
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Modal de detalles ───────────────────────────────────────────────── */}
      {selectedEntry && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedEntry(null)}
        >
          <div
            className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Detalles de la Entrada</h2>
              <button onClick={() => setSelectedEntry(null)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-5">
              {/* Socio */}
              <div className="border-b border-[#262626] pb-5">
                <h3 className="text-lg font-semibold text-white mb-3">Socio</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User size={18} className="text-gray-500 flex-shrink-0" />
                    <div>
                      <p className="text-gray-500 text-xs">Nombre completo</p>
                      <p className="text-white font-semibold">
                        {[selectedEntry.socio_nombre, selectedEntry.socio_apellidos]
                          .filter(Boolean).join(" ") || "N/A"}
                      </p>
                    </div>
                  </div>
                  {selectedEntry.numero_socio && (
                    <div className="flex items-center gap-3">
                      <CreditCard size={18} className="text-gray-500 flex-shrink-0" />
                      <div>
                        <p className="text-gray-500 text-xs">Número de socio</p>
                        <p className="text-primary-300 font-mono font-semibold">
                          {selectedEntry.numero_socio}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedEntry.socio_email && (
                    <div className="flex items-center gap-3">
                      <Mail size={18} className="text-gray-500 flex-shrink-0" />
                      <div>
                        <p className="text-gray-500 text-xs">Email</p>
                        <p className="text-white">{selectedEntry.socio_email}</p>
                      </div>
                    </div>
                  )}
                  {selectedEntry.socio_telefono && (
                    <div className="flex items-center gap-3">
                      <Phone size={18} className="text-gray-500 flex-shrink-0" />
                      <div>
                        <p className="text-gray-500 text-xs">Teléfono</p>
                        <p className="text-white">{selectedEntry.socio_telefono}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Entrada */}
              <div className="border-b border-[#262626] pb-5">
                <h3 className="text-lg font-semibold text-white mb-3">Entrada</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-gray-500 text-sm">Entradas</p>
                    <p className="text-primary-300 text-2xl font-bold mt-1">
                      {selectedEntry.numero_entradas || 1}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Pago</p>
                    <p className="text-primary-300 text-2xl font-bold mt-1">
                      {formatCurrency(selectedEntry.precio_pagado)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Estado */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Estado</h3>
                <span
                  className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                    {
                      confirmada:      "bg-green-500/20 text-green-400",
                      esperando_pago:  "bg-yellow-500/20 text-yellow-400",
                      cancelada:       "bg-red-500/20 text-red-400",
                      en_lista_espera: "bg-blue-500/20 text-blue-400",
                    }[selectedEntry.payment_estado?.toLowerCase()] ||
                    "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {getEstadoLabel(selectedEntry.payment_estado)}
                </span>

                {selectedEntry.fecha_pago && (
                  <div className="mt-3">
                    <p className="text-gray-500 text-sm">Fecha</p>
                    <p className="text-white mt-1">{formatDateTime(selectedEntry.fecha_pago)}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              {selectedEntry.payment_estado?.toLowerCase() === "esperando_pago" && (
                <Button
                  variant="primary"
                  onClick={() => {
                    handleSendReminder(selectedEntry.booking_id);
                    setSelectedEntry(null);
                  }}
                >
                  Enviar Recordatorio
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayments;