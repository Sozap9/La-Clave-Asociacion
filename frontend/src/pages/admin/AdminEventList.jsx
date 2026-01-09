import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Users,
  Eye,
  EyeOff,
  Star,
  Edit,
  Trash2,
} from "lucide-react";
import FilterBar from "../../components/UI/FilterBar";
import SearchInput from "../../components/UI/SearchInput";
import {
  getAllEventsAdmin,
  deleteEvent,
  togglePublishEvent,
  toggleFeatureEvent,
} from "../../api/adminApi";
import Alert from "../../components/common/Alert";
import Loader from "../../components/common/Loader";

const AdminEventList = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [featuredFilter, setFeaturedFilter] = useState("all");

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const debounceRef = useRef(null);

  useEffect(() => {
    // fetch when page/status/featured change
    fetchEvents();
  }, [pagination.page, statusFilter, featuredFilter]);

  // live search w/ debounce
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      // reset to first page and fetch
      fetchEvents({ page: 1 });
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [searchTerm]);

  const fetchEvents = async (opts = {}) => {
    try {
      setLoading(true);
      setError("");

      const page = opts.page ?? pagination.page;
      const params = {
        page,
        limit: pagination.limit,
        search: searchTerm,
      };

      if (statusFilter !== "all") {
        params.estado = statusFilter;
      }

      if (featuredFilter !== "all") {
        params.destacado = featuredFilter === "featured";
      }

      const response = await getAllEventsAdmin(params);

      if (response.success) {
        setEvents(response.data);
        // ensure pagination keeps page we requested (API may return pagination)
        setPagination((prev) => ({
          ...prev,
          ...(response.pagination || {}),
          page,
        }));
      } else {
        setError(response.message || "Error loading events");
      }
    } catch (err) {
      console.error("Error fetching events:", err);
      setError("Error loading events. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // immediate search trigger
    fetchEvents({ page: 1 });
  };

  const clearSearch = () => {
    setSearchTerm("");
    fetchEvents({ page: 1 });
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      const response = await deleteEvent(id);

      if (response.success) {
        setSuccess("Event deleted successfully");
        fetchEvents();
      } else {
        setError(response.message || "Error deleting event");
      }
    } catch (err) {
      console.error("Error deleting event:", err);
      setError("Error deleting event. Please try again.");
    }
  };

  const handleTogglePublish = async (id, currentStatus) => {
    try {
      const response = await togglePublishEvent(id);

      if (response.success) {
        setSuccess(response.message);
        fetchEvents();
      } else {
        setError(response.message || "Error changing publish status");
      }
    } catch (err) {
      console.error("Error toggling publish:", err);
      setError("Error changing status. Please try again.");
    }
  };

  const handleToggleFeatured = async (id) => {
    try {
      const response = await toggleFeatureEvent(id);

      if (response.success) {
        setSuccess(response.message);
        fetchEvents();
      } else {
        setError(response.message || "Error changing featured status");
      }
    } catch (err) {
      console.error("Error toggling featured:", err);
      setError("Error changing status. Please try again.");
    }
  };

  const getStatusBadge = (status, visibleSince) => {
    const isPublished = visibleSince !== null;

    const badges = {
      draft: { text: "Draft", color: "bg-gray-500" },
      scheduled: {
        text: isPublished ? "Published" : "Scheduled",
        color: isPublished ? "bg-green-500" : "bg-blue-500",
      },
      active: { text: "Active", color: "bg-primary-500" },
      completed: { text: "Completed", color: "bg-gray-400" },
      cancelled: { text: "Cancelled", color: "bg-red-500" },
    };

    const badge = badges[status] || { text: status, color: "bg-gray-500" };

    return (
      <span
        className={`px-2 py-1 text-xs rounded-full text-white ${badge.color}`}
      >
        {badge.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getEmptyMessage = () => {
    if (featuredFilter === "featured")
      return "No hay eventos destacados disponibles";
    if (statusFilter === "upcoming")
      return "No hay eventos próximos disponibles";
    if (statusFilter === "past") return "No hay eventos pasados";
    if (statusFilter === "all") return "No hay eventos disponibles";
    return "No se encontraron eventos";
  };

  return (
    <div className="space-y-6">
      {/* Header (match Events.jsx style) */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-gradient mb-2 text-4xl">Eventos</h1>
          <p className="text-gray-400 text-lg">
            Descubre los mejores eventos y reserva tu plaza
          </p>
        </div>
        <Link
          to="/admin/events/create"
          className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Crear evento
        </Link>
      </div>

      {/* Alerts */}
      {error && (
        <Alert type="error" message={error} onClose={() => setError("")} />
      )}
      {success && (
        <Alert
          type="success"
          message={success}
          onClose={() => setSuccess("")}
        />
      )}

      {/* Filters - use unified FilterBar + SearchInput */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-6 flex-wrap bg-transparent">
          <FilterBar
            filters={{
              status: statusFilter === "upcoming" ? "upcoming" : statusFilter,
              featured: featuredFilter === "featured" ? true : undefined,
            }}
            onFilterChange={(f) => {
              setStatusFilter(f.status || "all");
              setFeaturedFilter(f.featured ? "featured" : "all");
              setPagination({ ...pagination, page: 1 });
              fetchEvents({ page: 1 });
            }}
          />

          <div className="flex-1 max-w-md ml-auto">
            <SearchInput
              value={searchTerm}
              onChange={(val) => setSearchTerm(val)}
              onDebounced={(val) => {
                setSearchTerm(val);
                setPagination({ ...pagination, page: 1 });
                fetchEvents({ page: 1 });
              }}
              onClear={() => {
                setSearchTerm("");
                setPagination({ ...pagination, page: 1 });
                fetchEvents({ page: 1 });
              }}
              placeholder="Buscar eventos por nombre..."
              debounceMs={350}
            />
          </div>
        </div>
      </div>

      {/* Events Table */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20">
          <h3 className="text-2xl font-bold text-white mb-2">
            No se encontraron eventos
          </h3>
          <p className="text-gray-400 text-lg">{getEmptyMessage()}</p>
          {searchTerm && (
            <p className="text-gray-500 text-sm mt-2">
              Intenta con otra búsqueda
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                className={`bg-[#1a1a1a] border border-[#262626] rounded-xl p-4 flex items-center justify-between gap-4 hover:border-primary-500/50 transition-all ${
                  event.destacado === 1 ? "ring-1 ring-primary-500/20" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  {event.imagen_cartel_url ? (
                    <img
                      src={`${import.meta.env.VITE_BASE_URL}${
                        event.imagen_cartel_url
                      }`}
                      alt={event.titulo}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center">
                      📅
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-3">
                      <div className="text-lg font-semibold text-white">
                        {event.titulo}
                      </div>
                      {event.destacado === 1 && (
                        <span className="text-primary-300">⭐</span>
                      )}
                      <div className="ml-2">{getStatusBadge(event)}</div>
                    </div>
                    <div className="text-sm text-gray-400 line-clamp-2 max-w-xl">
                      {event.descripcion}
                    </div>
                    <div className="flex gap-3 items-center text-sm text-gray-400 mt-2">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-primary-300" />
                        <span>{formatDate(event.fecha_evento)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-primary-300" />
                        <span>{event.ubicacion}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-primary-300" />
                        <span>
                          {event.confirmed_bookings || 0}/
                          {event.aforo_maximo || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTogglePublish(event.id, event.estado)}
                    className={`p-2 rounded-lg transition-colors ${
                      event.visible_desde
                        ? "text-primary-700 hover:bg-primary-700/20"
                        : "text-primary-300 hover:bg-primary-500/20"
                    }`}
                    title={event.visible_desde ? "Unpublish" : "Publish"}
                  >
                    {event.visible_desde ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>

                  <button
                    onClick={() => handleToggleFeatured(event.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      event.destacado === 1
                        ? "text-primary-700 hover:bg-primary-700/20"
                        : "text-gray-400 hover:bg-gray-500/20"
                    }`}
                    title={event.destacado === 1 ? "Unfeature" : "Feature"}
                  >
                    <Star
                      size={16}
                      fill={event.destacado === 1 ? "currentColor" : "none"}
                    />
                  </button>

                  <Link
                    to={`/admin/events/edit/${event.id}`}
                    className="p-2 text-primary-300 hover:bg-primary-500/20 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit size={16} />
                  </Link>

                  <button
                    onClick={() => handleDelete(event.id, event.titulo)}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                    title="Borrar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <button
                onClick={() =>
                  setPagination({ ...pagination, page: pagination.page - 1 })
                }
                disabled={pagination.page === 1}
                className="px-4 py-2 bg-black text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-900 transition-colors"
              >
                ← Anterior
              </button>

              <span className="text-gray-400">
                Página {pagination.page} de {pagination.totalPages}
              </span>

              <button
                onClick={() =>
                  setPagination({ ...pagination, page: pagination.page + 1 })
                }
                disabled={pagination.page >= pagination.totalPages}
                className="px-4 py-2 bg-black text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-900 transition-colors"
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminEventList;
