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
  Eye,
  EyeOff,
  Star,
} from "lucide-react";
import FilterBar from "../../components/UI/FilterBar";
import SearchInput from "../../components/UI/SearchInput";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import AdminCard from "../../components/admin/AdminCard.jsx";

const AdminEvents = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [events, setEvents] = useState([]);
  const [expandedEventId, setExpandedEventId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const [filters, setFilters] = useState({
    status: "all",
    search: "",
    featured: undefined,
  });

  const eventRefs = useRef({});

  useEffect(() => {
    fetchEvents();
  }, [filters.status, filters.featured]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchEvents();
    }, 350);
    return () => clearTimeout(t);
  }, [filters.search]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const open = params.get("open");
    if (open) setExpandedEventId(Number(open));
  }, [location.search]);

  const fetchEvents = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const params = {};
      if (filters.status === "draft" || filters.status === "cancelled") {
        params.estado = filters.status;
      }

      if (filters.featured) {
        params.destacado = "true";
      }

      if (filters.search) params.search = filters.search;

      const result = await getAllEventsAdmin(params);

      if (result.success) {
        let eventsArr = Array.isArray(result.data) ? result.data : [];

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        if (filters.status === "upcoming") {
          eventsArr = eventsArr.filter((e) => {
            if (!e.fecha_evento) return false;
            const d = new Date(e.fecha_evento);
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

        if (filters.featured && params.destacado !== "true") {
          eventsArr = eventsArr.filter(
            (e) => e.destacado === 1 || e.destacado === true
          );
        }

        setEvents(eventsArr);
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

  const handleViewAll = async () => {
    setFilters({ status: "all", search: "", featured: undefined });
    setExpandedEventId(null);
    navigate("/admin/eventos", { replace: true });

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

  const handleTogglePublish = async (id) => {
    try {
      const result = await togglePublishEvent(id);
      if (result.success) {
        setSuccess(result.message);
        fetchEvents();
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

    if (estado === "draft") {
      return { text: "Borrador", color: "gray" };
    } else if (estado === "scheduled" && isPublished) {
      return { text: "Publicado", color: "green" };
    } else if (estado === "scheduled" && !isPublished) {
      return { text: "Programado", color: "blue" };
    } else if (estado === "active") {
      return { text: "En curso", color: "primary" };
    } else if (estado === "completed") {
      return { text: "Finalizado", color: "gray" };
    } else if (estado === "cancelled") {
      return { text: "Cancelado", color: "red" };
    }
    return { text: estado || "Desconocido", color: "gray" };
  };

  if (loading && events.length === 0) return <Loader fullScreen />;

  return (
    <div className="p-4 md:p-8 bg-black min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
        <div>
          <h1 className="text-gradient mb-2 text-2xl md:text-4xl">Gestión de eventos</h1>
          <p className="text-gray-400 text-sm md:text-lg">
            Administra todos tus eventos.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="primary"
            onClick={() => navigate("/admin/eventos/nuevo")}
          >
            Crear Evento
          </Button>
          <Button variant="primary" onClick={handleViewAll}>
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
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-8">
          <FilterBar
            filters={{ status: filters.status, featured: filters.featured }}
            onFilterChange={(f) => setFilters(f)}
          />

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

          <div className="w-full sm:flex-1 sm:max-w-md sm:ml-auto">
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
            const statusBadge = getStatusBadge(event);

            return (
              <AdminCard
                key={event.id}
                image={
                  event.imagen_cartel_url
                    ? `${import.meta.env.VITE_BASE_URL}${event.imagen_cartel_url}`
                    : null
                }
                imageAlt={event.titulo}
                imageSize="md"
                title={event.titulo}
                subtitle={
                  <span className={isExpanded ? "" : "line-clamp-2"}>
                    {event.descripcion}
                  </span>
                }
                badges={[
                  statusBadge,
                  ...(isFeatured
                    ? [
                        {
                          text: "Destacado",
                          color: "primary",
                          icon: <Star size={14} fill="currentColor" />,
                        },
                      ]
                    : []),
                ]}
                actions={[
                  {
                    icon: isPublished ? <EyeOff size={20} /> : <Eye size={20} />,
                    onClick: () => handleTogglePublish(event.id),
                    color: "primary",
                    title: isPublished ? "Despublicar" : "Publicar",
                  },
                  {
                    icon: (
                      <Star
                        size={20}
                        fill={isFeatured ? "currentColor" : "none"}
                      />
                    ),
                    onClick: () => handleToggleFeatured(event.id),
                    color: isFeatured ? "primary" : "gray",
                    title: isFeatured ? "Quitar destacado" : "Destacar",
                  },
                  {
                    icon: <Edit size={20} />,
                    onClick: () =>
                      navigate(`/admin/eventos/editar/${event.id}`),
                    color: "primary",
                    title: "Editar",
                  },
                  {
                    icon: <Trash2 size={20} />,
                    onClick: () => handleDelete(event.id),
                    color: "red",
                    title: "Eliminar",
                    disabled: deletingId === event.id,
                  },
                ]}
                fields={[
                  {
                    icon: <Calendar size={14} className="text-primary-300" />,
                    label: "Fecha",
                    value: formatDate(event.fecha_evento),
                  },
                  {
                    icon: <MapPin size={14} className="text-primary-300" />,
                    label: "Ubicación",
                    value: event.ubicacion || "No especificada",
                  },
                  {
                    icon: <Users size={14} className="text-primary-300" />,
                    label: "Asistencia",
                    value: `${event.confirmed_bookings || 0}/${
                      event.aforo_maximo || 0
                    }`,
                  },
                ]}
                columns={3}
                highlight={isExpanded}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminEvents;