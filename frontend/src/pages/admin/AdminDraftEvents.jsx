import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAllEventsAdmin,
  deleteEvent,
  togglePublishEvent,
  toggleFeatureEvent,
} from "../../api/adminApi";
import {
  FileText,
  MapPin,
  Users,
  Edit,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  Star,
  Calendar,
  Clock,
} from "lucide-react";
import SearchInput from "../../components/UI/SearchInput";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";

const AdminDraftEvents = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState("");
  const [featuredFilter, setFeaturedFilter] = useState("all");

  useEffect(() => {
    fetchDraftEvents();
  }, []);

  // Debounce 
  useEffect(() => {
    const t = setTimeout(() => {
      fetchDraftEvents();
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchDraftEvents = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const params = { estado: "draft" };
      if (search) params.search = search;

      const result = await getAllEventsAdmin(params);

      if (result.success) {
        setEvents(Array.isArray(result.data) ? result.data : []);
      } else {
        setError(result.message || "Error al cargar eventos en borrador");
        setEvents([]);
      }
    } catch (err) {
      console.error("Error en fetchDraftEvents:", err);
      setError("Error de conexión");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Estás seguro de eliminar este borrador?")) return;

    setDeletingId(id);
    try {
      const result = await deleteEvent(id);
      if (result.success) {
        setSuccess("Borrador eliminado exitosamente");
        setEvents(events.filter((e) => e.id !== id));
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(result.message || "Error al eliminar borrador");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setDeletingId(null);
    }
  };

  const handlePublish = async (id) => {
    try {
      const result = await togglePublishEvent(id);

      if (result.success) {
        setSuccess("Evento publicado exitosamente");
        fetchDraftEvents(); 
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(result.message || "Error al publicar evento");
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
        fetchDraftEvents();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(result.message || "Error al cambiar destacado");
      }
    } catch (err) {
      setError("Error de conexión");
    }
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
  };

  if (loading && events.length === 0) return <Loader fullScreen />;

  return (
    <div className="space-y-6">
      {/* Header*/}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-gradient mb-2 text-4xl">Eventos en Borrador</h1>
          <p className="text-gray-400 text-lg">
            {events.length} evento{events.length !== 1 ? 's' : ''} en borrador
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate("/admin/eventos/nuevo")}
          className="flex items-center gap-2"
        >
          <Plus size={20} />
          Crear evento
        </Button>
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

      {/* Search */}
      <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6 mb-6">
        <SearchInput
          value={search}
          onChange={(val) => {
            setSearch(val);
          }}
          onClear={() => {
            setSearch("");
          }}
          placeholder="Buscar eventos por nombre..."
          debounceMs={350}
        />
      </div>

      {/* Lista de borradores */}
      {events.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="mx-auto mb-4 text-gray-600" size={48} />
          <h3 className="text-2xl font-bold text-white mb-2">
            No se encontraron eventos
          </h3>
          <p className="text-gray-400 text-lg mb-4">
            {search ? 'No se encontraron eventos con esos criterios' : 'No hay eventos en borrador'}
          </p>
          {!search && (
            <p className="text-gray-500 text-sm mb-6">
              Los borradores son eventos guardados que aún no han sido publicados
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const isFeatured = event.destacado === 1;

            return (
              <div
                key={event.id}
                className={`bg-[#1a1a1a] border border-[#262626] rounded-xl p-4 flex items-center justify-between gap-4 hover:border-primary-500/50 transition-all ${
                  isFeatured ? "ring-1 ring-primary-500/20" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Imagen */}
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
                      <Calendar size={32} className="text-gray-600" />
                    </div>
                  )}

                  {/* Detalles */}
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="text-lg font-semibold text-white">
                        {event.titulo}
                      </div>
                      {isFeatured && (
                        <span className="text-primary-300">destacado</span>
                      )}
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">
                        Borrador
                      </span>
                    </div>
                    <div className="text-sm text-gray-400 line-clamp-2 max-w-xl">
                      {event.descripcion}
                    </div>
                    <div className="flex gap-3 items-center text-sm text-gray-400 mt-2">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-primary-300" />
                        <span>{formatDate(event.fecha_evento)}</span>
                      </div>

                      {event.hora_evento && (
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-primary-300" />
                          <span>{event.hora_evento.substring(0, 5)}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-primary-300" />
                        <span>{event.ubicacion}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-primary-300" />
                        <span>
                          {event.confirmed_bookings || 0}/{event.aforo_maximo}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-2 ml-4">
                  {/* Publicar */}
                  <button
                    onClick={() => handlePublish(event.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      event.visible_desde
                        ? "text-primary-700 hover:bg-primary-700/20"
                        : "text-primary-300 hover:bg-primary-500/20"
                    }`}
                    title={event.visible_desde ? "Despublicar" : "Publicar"}
                  >
                    {event.visible_desde ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>

                  {/* Destacar/Quitar destacado */}
                  <button
                    onClick={() => handleToggleFeatured(event.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      isFeatured
                        ? "text-primary-700 hover:bg-primary-700/20"
                        : "text-gray-400 hover:bg-gray-500/20"
                    }`}
                    title={isFeatured ? "Quitar destacado" : "Destacar"}
                  >
                    <Star
                      size={16}
                      fill={isFeatured ? "currentColor" : "none"}
                    />
                  </button>

                  {/* Editar */}
                  <button
                    onClick={() => navigate(`/admin/eventos/editar/${event.id}`)}
                    className="p-2 text-primary-300 hover:bg-primary-500/20 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit size={16} />
                  </button>

                  {/* Eliminar */}
                  <button
                    onClick={() => handleDelete(event.id)}
                    disabled={deletingId === event.id}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminDraftEvents;