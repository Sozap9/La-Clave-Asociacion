import { useState, useEffect } from "react";
import Alert from "../../components/common/Alert";
import DatePickerInput from "../../components/common/DatePickerInput";
import { exportReservas, getEventsForExport } from "../../api/adminApi";
import { Download, Ticket, Calendar, Search } from "lucide-react";

const AdminExportReservas = () => {
  const [loading, setLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [allEvents, setAllEvents] = useState([]);
  const [visibleEvents, setVisibleEvents] = useState([]);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [dateFilter, setDateFilter] = useState(null);

  const [filters, setFilters] = useState({ event_id: "" });

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (!allEvents.length) return;

    if (dateFilter) {
      const selected = new Date(dateFilter);
      selected.setHours(0, 0, 0, 0);

      const matched = allEvents.filter((e) => {
        const evDate = new Date(e.fecha_evento);
        evDate.setHours(0, 0, 0, 0);
        return evDate.getTime() === selected.getTime();
      });

      setVisibleEvents(matched);

      // Con un solo resultado, se selecciona
      if (matched.length === 1) {
        setFilters((prev) => ({ ...prev, event_id: String(matched[0].id) }));
      } else {
        setFilters((prev) => ({ ...prev, event_id: "" }));
      }
    } else {
      // Sin filtro, los 10 más recientes (ya vienen ordenados)
      setVisibleEvents(allEvents.slice(0, 10));
    }
  }, [dateFilter, allEvents]);

  const fetchEvents = async () => {
    setEventsLoading(true);
    try {
      const result = await getEventsForExport();
      if (result.success) {
        const events = result.data || [];
        setAllEvents(events);
        setVisibleEvents(events.slice(0, 10));
      } else {
        console.error("Error al cargar eventos:", result.message);
      }
    } catch (err) {
      console.error("Error cargando eventos:", err);
    } finally {
      setEventsLoading(false);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await exportReservas(filters);
      if (result.success) {
        setSuccess("PDF de reservas descargado correctamente");
      } else {
        setError(result.message || "No se pudo generar el PDF de reservas");
      }
    } catch (err) {
      console.error("Error al exportar reservas:", err);
      setError(
        "Error al descargar el PDF de reservas. Por favor, intenta de nuevo.",
      );
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({ event_id: "" });
    setDateFilter(null);
  };

  const totalEvents = allEvents.length;
  const showingCount = visibleEvents.length;
  const isDateFiltering = dateFilter !== null;

  const selectedEventName =
    filters.event_id
      ? allEvents.find((e) => String(e.id) === filters.event_id)?.titulo || ""
      : "";

  return (
    <div className="p-4 md:p-8 bg-black min-h-screen">
      <div className="mb-8">
        <h1 className="text-gradient mb-2 text-2xl md:text-4xl">Exportar Reservas </h1>
      </div>

      {success && (
        <Alert
          type="success"
          message={success}
          onClose={() => setSuccess("")}
        />
      )}
      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError("")}
          persistent
        />
      )}

      <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6 mb-6 hover:border-primary-500/50 transition-all">
        <div className="flex items-start gap-4 mb-6">
          <div className="bg-primary-500/20 p-3 rounded-lg">
            <Ticket className="w-8 h-8 text-primary-300" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-semibold text-white mb-2">
              Lista de Reservas
            </h3>
            <p className="text-gray-400">
              Exporta reservas con datos de usuario y evento
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="mb-6 space-y-5 bg-[#0d0d0d] p-6 rounded-lg border border-[#1a1a1a]">
          <h4 className="text-white font-semibold text-lg">
            Filtros (opcional)
          </h4>

          {/* 10 más recientes */}
          <div>
            <label className="block text-white font-medium mb-2">
              <Calendar className="w-4 h-4 inline mr-2 text-primary-300" />
              Filtrar por Evento:
            </label>
            {eventsLoading ? (
              <div className="text-gray-400 text-sm py-3">
                Cargando eventos...
              </div>
            ) : (
              <select
                value={filters.event_id}
                onChange={(e) =>
                  setFilters({ ...filters, event_id: e.target.value })
                }
                className="w-full bg-[#262626] border border-[#333333] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition-colors"
              >
                <option value="">Todos los eventos</option>
                {visibleEvents.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.titulo}
                  </option>
                ))}
              </select>
            )}
            {!eventsLoading && (
              <p className="text-gray-500 text-xs mt-1">
                {isDateFiltering
                  ? showingCount === 0
                    ? "No hay eventos en esa fecha."
                    : `${showingCount} evento${showingCount > 1 ? "s" : ""} encontrado${showingCount > 1 ? "s" : ""}.`
                  : `Mostrando los ${showingCount} eventos más recientes de ${totalEvents} total. Usa el calendario para buscar eventos más antiguos.`}
              </p>
            )}
          </div>

          {/* Buscar por fecha */}
          <div className="border-t border-[#262626] pt-5">
            <label className="block text-white font-medium mb-2">
              <Search className="w-4 h-4 inline mr-2 text-primary-300" />
              Buscar evento por fecha:
            </label>
            <DatePickerInput
              selected={dateFilter}
              onChange={(date) => setDateFilter(date || null)}
              dateFormat="dd/MM/yyyy"
              placeholderText="Seleccionar fecha del evento"
            />
            <p className="text-gray-500 text-xs mt-1">
              Filtra el listado de arriba para localizar eventos más antiguos.
            </p>
          </div>

          {(filters.event_id || isDateFiltering) && (
            <button
              onClick={clearFilters}
              className="text-primary-300 text-sm hover:text-primary-400 transition-colors font-medium"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        
        <button
          onClick={handleExport}
          disabled={loading}
          className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-3 text-lg"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              Generando PDF...
            </>
          ) : (
            <>
              <Download className="w-6 h-6" />
              Descargar PDF de Reservas
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AdminExportReservas;