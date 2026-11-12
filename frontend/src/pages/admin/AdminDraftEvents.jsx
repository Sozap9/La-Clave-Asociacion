import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import SearchInput from "../../components/UI/SearchInput";
import Pagination from "../../components/UI/Pagination";
import { usePagination } from "../../hooks/usePagination";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import AdminCard from "../../components/admin/AdminCard.jsx";

const AdminDraftEvents = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const { pageItems: paginatedEvents, page, pages, total, setPage } =
    usePagination(events, 10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchDraftEvents();
  }, []);

  // Búsqueda con debounce
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
      const params = { estado: "draft", limit: 100 };
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
        setSuccess(result.message || "Evento publicado");
        fetchDraftEvents();
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
      } else {
        setError(result.message || "Error al cambiar destacado");
      }
    } catch (err) {
      setError("Error de conexión");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No definida";
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Pasado = fecha_evento antes de hoy (como en AdminEvents.jsx)
  const isEventPast = (event) => {
    if (!event.fecha_evento) return false;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return new Date(event.fecha_evento) < startOfToday;
  };

  if (loading && events.length === 0) return <Loader fullScreen />;

  return (
    <div className="p-4 md:p-8 bg-black min-h-screen">
      {/* Cabecera */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
        <div>
          <h1 className="text-gradient mb-2 text-2xl md:text-4xl">Eventos en borrador</h1>
          <p className="text-gray-400 text-sm md:text-lg">
            {events.length} evento{events.length !== 1 ? "s" : ""} en borrador
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="w-full sm:w-80">
            <SearchInput
              value={search}
              onChange={setSearch}
              onClear={() => setSearch("")}
              placeholder="Buscar eventos por nombre..."
              debounceMs={350}
            />
          </div>

          <Button
            variant="primary"
            onClick={() => navigate("/admin/eventos/nuevo")}
            className="whitespace-nowrap"
          >
            Crear evento
          </Button>
        </div>
      </div>

      {/* Avisos */}
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

      {/* Lista */}
      {events.length === 0 ? (
        <div className="text-center py-20">
          <Calendar className="mx-auto mb-4 text-gray-600" size={48} />
          <h3 className="text-2xl font-bold text-white mb-2">
            No se encontraron eventos
          </h3>
          <p className="text-gray-400 text-lg">
            {search
              ? "No se encontraron eventos con esos criterios"
              : "No hay eventos en borrador"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedEvents.map((event) => {
            const isFeatured = event.destacado === 1;
            const isPublished = event.visible_desde !== null;
            const isPast = isEventPast(event);

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
                  <span className="line-clamp-2">{event.descripcion}</span>
                }
                badges={[
                  { text: "Borrador", color: "gray" },
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
                    icon: isPublished ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    ),
                    onClick: () => handlePublish(event.id),
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
                    // Futuro: confirmadas. Pasado: asistentes (check-in por QR).
                    value: `${
                      (isPast ? event.entradas_asistidas : event.confirmed_bookings) || 0
                    }/${event.aforo_maximo || 0}`,
                  },
                ]}
                columns={3}
              />
            );
          })}

          <Pagination
            page={page}
            pages={pages}
            total={total}
            onPageChange={setPage}
            itemLabel="borradores"
          />
        </div>
      )}
    </div>
  );
};

export default AdminDraftEvents;