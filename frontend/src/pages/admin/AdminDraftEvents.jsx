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

  useEffect(() => {
    fetchDraftEvents();
  }, []);

  // Debounce search: call fetchDraftEvents when `search` changes after 350ms
  useEffect(() => {
    const t = setTimeout(() => {
      fetchDraftEvents();
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const fetchDraftEvents = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Filtrar solo eventos en estado 'draft'
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

  // Search handled by SearchInput (debounced)

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
        fetchDraftEvents(); // Recargar para actualizar la lista
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
    if (!dateString) return "Sin fecha";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Mostrar loader fullScreen sólo en la carga inicial (cuando aún no hay borradores)
  if (loading && events.length === 0) return <Loader fullScreen />;

  return (
    <div className="p-8 bg-black min-h-screen">
      {/* Header*/}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <FileText className="text-gray-400" size={32} />
            <h1 className="text-gradient mb-2 text-4xl">Eventos</h1>
          </div>
          <p className="text-gray-400 text-lg">
            Descubre los mejores eventos y reserva tu plaza
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate("/admin/eventos/nuevo")}
          className="flex items-center gap-2"
        >
          <Plus size={20} />
          Crear Evento
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
            No hay eventos en borrador
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Los borradores son eventos guardados que aún no han sido publicados
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const isFeatured = event.destacado === 1;

            return (
              <div
                key={event.id}
                className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6 hover:border-primary-500/50 transition-all"
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
                            size={16}
                            fill="currentColor"
                          />
                        )}
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400">
                          Borrador
                        </span>
                      </div>

                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                        {event.descripcion}
                      </p>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-primary-400" />
                          <span>{formatDate(event.fecha_evento)}</span>
                        </div>

                        {event.hora_evento && (
                          <div className="flex items-center gap-2">
                            <Clock size={16} className="text-primary-400" />
                            <span>{event.hora_evento}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-primary-400" />
                          <span>{event.ubicacion}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-primary-400" />
                          <span>
                            {event.confirmed_bookings || 0}/{event.aforo_maximo}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 ml-4">
                    {/* Publicar */}
                    <button
                      onClick={() => handlePublish(event.id)}
                      className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors"
                      title="Publicar evento"
                    >
                      <Eye size={20} />
                    </button>

                    {/* Destacar/Quitar destacado */}
                    <button
                      onClick={() => handleToggleFeatured(event.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        isFeatured
                          ? "text-primary-300 hover:bg-primary-500/20"
                          : "text-gray-400 hover:bg-gray-500/20"
                      }`}
                      title={isFeatured ? "Quitar destacado" : "Destacar"}
                    >
                      <Star
                        size={20}
                        fill={isFeatured ? "currentColor" : "none"}
                      />
                    </button>

                    {/* Editar */}
                    <button
                      onClick={() =>
                        navigate(`/admin/eventos/editar/${event.id}`)
                      }
                      className="p-2 text-primary-300 hover:bg-primary-500/20 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit size={20} />
                    </button>

                    {/* Eliminar */}
                    <button
                      onClick={() => handleDelete(event.id)}
                      disabled={deletingId === event.id}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

export default AdminDraftEvents;
