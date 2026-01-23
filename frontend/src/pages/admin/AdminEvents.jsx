import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  getAllEventsAdmin,
  deleteEvent,
  togglePublishEvent,
  toggleFeatureEvent,
} from "../../api/adminApi";
import {
  Calendar,
  MapPin,
  Users,
  Edit,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  Star,
} from "lucide-react";
import FilterBar from "../../components/UI/FilterBar";
import SearchInput from "../../components/UI/SearchInput";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";

const AdminEvents = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [events, setEvents] = useState([]);
  const [expandedEventId, setExpandedEventId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  // Filters (unified like public `Events.jsx`)
  const [filters, setFilters] = useState({
    status: "all",
    search: "",
    featured: undefined,
  });
  const eventRefs = useRef({});
  // fetch when status or featured change (immediate)
  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.featured]);

  // Debounce search: call fetchEvents when `filters.search` changes after 350ms
  useEffect(() => {
    const t = setTimeout(() => {
      fetchEvents();
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const open = params.get("open");
    if (open) setExpandedEventId(Number(open));
  }, [location.search]);

  // No automatic scrolling to avoid page jumps while interacting with filters/search

  const fetchEvents = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const params = {};
      // Admin-only statuses: send `estado` for draft/cancelled
      if (filters.status === "draft" || filters.status === "cancelled") {
        params.estado = filters.status;
      }

      // If featured UI active, request destacado from backend
      if (filters.featured) {
        params.destacado = "true";
      }

      if (filters.search) params.search = filters.search;

      const result = await getAllEventsAdmin(params);

      if (result.success) {
        // Backend devuelve array directo en result.data
        let eventsArr = Array.isArray(result.data) ? result.data : [];

        // Client-side date filtering to mirror public Events page
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        if (filters.status === "upcoming") {
          eventsArr = eventsArr.filter((e) => {
            if (!e.fecha_evento) return false;
            const d = new Date(e.fecha_evento);
            // only future or today
            return (
              d >= startOfToday &&
              e.estado !== "draft" &&
              e.estado !== "cancelled"
            );
          });
        } else if (filters.status === "past") {
          eventsArr = eventsArr.filter((e) => {
            if (!e.fecha_evento) return false;
            const d = new Date(e.fecha_evento);
            return d < startOfToday && e.estado !== "draft";
          });
        }

        // If featured UI active but backend didn't filter, ensure we only show destacado
        if (filters.featured && params.destacado !== "true") {
          eventsArr = eventsArr.filter(
            (e) => e.destacado === 1 || e.destacado === true
          );
        }

        setEvents(eventsArr);

        // No automatic scroll after fetch to avoid page jumps while interacting
      } else {
        setError(result.message || "Error al cargar eventos");
        setEvents([]);
      }
    } catch (err) {
      console.error("Error en fetchEvents:", err);
      setError("Error de conexión");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchEvents();
  };

  const handleViewAll = async () => {
    setFilters({ status: "all", search: "", featured: undefined });
    setExpandedEventId(null);
    navigate("/eventos", { replace: true });

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const result = await getAllEventsAdmin({});
      if (result.success) {
        setEvents(Array.isArray(result.data) ? result.data : []);
      } else {
        setError(result.message || "Error al cargar eventos");
        setEvents([]);
      }
    } catch (err) {
      console.error("Error en handleViewAll:", err);
      setError("Error de conexión");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Estás seguro de eliminar este evento?")) return;

    setDeletingId(id);
    try {
      const result = await deleteEvent(id);
      if (result.success) {
        setSuccess("Evento eliminado exitosamente");
        setEvents(events.filter((e) => e.id !== id));
      } else {
        setError(result.message || "Error al eliminar evento");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setDeletingId(null);
    }
  };

  const handleTogglePublish = async (id, currentStatus) => {
    try {
      const result = await togglePublishEvent(id);

      if (result.success) {
        setSuccess(result.message);
        fetchEvents(); // Reload to get updated data
      } else {
        setError(result.message || "Error al cambiar estado");
      }
    } catch (err) {
      setError("Error de conexión");
    }
  };

  const handleToggleFeatured = async (id) => {
    try {
      const result = await toggleFeatureEvent(id);

      if (result.success) {
        setSuccess(result.message);
        fetchEvents();
      } else {
        setError(result.message || "Error al cambiar destacado");
      }
    } catch (err) {
      setError("Error de conexión");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getEmptyMessage = () => {
    if (filters.featured) return "No hay eventos destacados disponibles";
    if (filters.status === "upcoming")
      return "No hay eventos próximos disponibles";
    if (filters.status === "past") return "No hay eventos pasados";
    if (filters.status === "all") return "No hay eventos disponibles";
    return "No se encontraron eventos";
  };

  const getStatusBadge = (event) => {
    const isPublished = event.visible_desde !== null;
    const estado = event.estado;

    let color, text;

    if (estado === "draft") {
      color = "bg-gray-500";
      text = "Borrador";
    } else if (estado === "scheduled" && isPublished) {
      color = "bg-green-500";
      text = "Publicado";
    } else if (estado === "scheduled" && !isPublished) {
      color = "bg-blue-500";
      text = "Programado";
    } else if (estado === "active") {
      color = "bg-primary-500";
      text = "En curso";
    } else if (estado === "completed") {
      color = "bg-gray-400";
      text = "Finalizado";
    } else if (estado === "cancelled") {
      color = "bg-red-500";
      text = "Cancelado";
    } else {
      color = "bg-gray-500";
      text = estado || "Desconocido";
    }

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${color}/20 text-${color.replace(
          "bg-",
          ""
        )}`}
      >
        {text}
      </span>
    );
  };

  // Mostrar loader fullScreen sólo en la carga inicial (cuando aún no hay eventos)
  if (loading && events.length === 0) return <Loader fullScreen />;

  return (
    <div className="p-8 bg-black min-h-screen">
      {/* Header  */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-gradient mb-2 text-4xl"> Gestion de eventos </h1>
          <p className="text-gray-400 text-lg">
            Administra todos tus eventos.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="primary"
            onClick={() => navigate("/admin/eventos/nuevo")}
            className="flex items-center gap-2"
          >
            Crear Evento
          </Button>
          <Button
            variant="primary"
            onClick={handleViewAll}
            className="flex items-center gap-2"
          >
            Ver todos
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
          {error}
          <button
            onClick={() => setError("")}
            className="float-right font-bold"
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-500/20 border border-green-500 text-green-200 px-4 py-3 rounded-lg mb-6">
          {success}
          <button
            onClick={() => setSuccess("")}
            className="float-right font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Filtros */}
      <div className="mb-12">
        <div className="flex items-center gap-4 mb-8 flex-wrap">
          <FilterBar
            filters={{ status: filters.status, featured: filters.featured }}
            onFilterChange={(f) => setFilters(f)}
          />

          {/* sólo Admin */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => {
                setFilters({
                  ...filters,
                  status: "draft",
                  featured: undefined,
                });
              }}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                filters.status === "draft" && !filters.featured
                  ? "bg-primary-600 text-white shadow-glow"
                  : "bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a]"
              }`}
            >
              Borrador
            </button>

            <button
              onClick={() => {
                setFilters({
                  ...filters,
                  status: "cancelled",
                  featured: undefined,
                });
              }}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                filters.status === "cancelled" && !filters.featured
                  ? "bg-primary-600 text-white shadow-glow"
                  : "bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a]"
              }`}
            >
              Cancelados
            </button>
          </div>

          <div className="flex-1 max-w-md ml-auto">
            <SearchInput
              value={filters.search}
              onChange={(val) => setFilters({ ...filters, search: val })}
              onClear={() => setFilters({ ...filters, search: "" })}
              placeholder="Buscar eventos por nombre..."
              debounceMs={350}
            />
          </div>
        </div>
      </div>

      {/* Lista de eventos */}
      {events.length === 0 ? (
        <div className="text-center py-20">
          <Calendar className="mx-auto mb-4 text-gray-600" size={48} />
          <h3 className="text-2xl font-bold text-white mb-2">
            No se encontraron eventos
          </h3>
          <p className="text-gray-400 text-lg mb-4">{getEmptyMessage()}</p>
          {filters.search && (
            <p className="text-gray-500 text-sm mt-2">
              Intenta con otra búsqueda
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const isPublished = event.visible_desde !== null;
            const isFeatured = event.destacado === 1;
            const isExpanded = expandedEventId === event.id;

            return (
              <div
                key={event.id}
                ref={(el) => {
                  eventRefs.current[event.id] = el;
                }}
                className={`bg-[#1a1a1a] border border-[#262626] rounded-xl p-6 hover:border-primary-500/50 transition-all ${
                  isExpanded
                    ? "border-primary-500/50 ring-1 ring-primary-500/20"
                    : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  {/* Info del evento */}
                  <div className="flex gap-6 flex-1">

                    {/* Imagen */}
                    {event.imagen_cartel_url && (
                      <img
                        src={`${import.meta.env.VITE_BASE_URL}${
                          event.imagen_cartel_url
                        }`}
                        alt={event.titulo}
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                    )}

                    {/* Detalles */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-bold text-white">
                          {event.titulo}
                        </h3>
                        {isFeatured && (
                          <Star
                            className="text-primary-300"
                            size={20}
                            fill="currentColor"
                          />
                        )}
                      </div>

                      <p
                        className={`text-gray-400 mb-4 ${
                          isExpanded ? "" : "line-clamp-2"
                        }`}
                      >
                        {event.descripcion}
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                        <div className="flex items-center gap-2 text-gray-300">
                          <Calendar size={16} className="text-primary-300" />
                          <span className="text-sm">
                            {formatDate(event.fecha_evento)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-300">
                          <MapPin size={16} className="text-primary-300" />
                          <span className="text-sm">
                            {event.ubicacion || "No especificada"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-300">
                          <Users size={16} className="text-primary-300" />
                          <span className="text-sm">
                            {event.confirmed_bookings || 0}/
                            {event.aforo_maximo || 0}
                          </span>
                        </div>
                      </div>

                      {/* Estado */}
                      {getStatusBadge(event)}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2 ml-4">
                    {/* Toggle Publish */}
                    <button
                      onClick={() =>
                        handleTogglePublish(event.id, event.estado)
                      }
                      className={`p-2 rounded-lg transition-colors ${
                        isPublished
                          ? "text-primary-300 hover:bg-primary-300/20"
                          : "text-primary-300 hover:bg-primary-300/20"
                      }`}
                      title={isPublished ? "Despublicar" : "Publicar"}
                    >
                      {isPublished ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>

                    {/* Toggle Featured */}
                    <button
                      onClick={() => handleToggleFeatured(event.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        isFeatured
                          ? "text-primary-300 hover:bg-primary-300/20"
                          : "text-primary-300 hover:bg-gray-300/20"
                      }`}
                      title={isFeatured ? "Quitar destacado" : "Destacar"}
                    >
                      <Star
                        size={20}
                        fill={isFeatured ? "currentColor" : "none"}
                      />
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() =>
                        navigate(`/admin/eventos/editar/${event.id}`)
                      }
                      className="p-2 text-primary-300 hover:bg-primary-500/20 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit size={20} />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(event.id)}
                      disabled={deletingId === event.id}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                      title="Eliminar"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminEvents;
