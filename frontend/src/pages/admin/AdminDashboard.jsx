import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAdminStats,
  getAllEventsAdmin,
  togglePublishEvent,
  toggleFeatureEvent,
} from "../../api/adminApi";
import AdminStats from "../../components/admin/AdminStats";
import QuickActionCard from "../../components/admin/QuickActionCard";
import Loader from "../../components/common/Loader";
import AdminCard from "../../components/admin/AdminCard";
import {
  AlertCircle,
  Plus,
  UserPlus,
  Users,
  Ticket,
  QrCode,
  Calendar,
  Eye,
  EyeOff,
  Star,
  Edit,
  MapPin,
} from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError("");

    try {
      // Fetch stats and recent events in parallel
      const [statsResult, eventsResult] = await Promise.all([
        getAdminStats(),
        getAllEventsAdmin({ limit: 5 }),
      ]);

      if (statsResult.success) {
        setStats(statsResult.data);
      } else {
        setStats({
          totalEventos: 0,
          totalUsuarios: 1,
          totalReservas: 0,
          sociosActivos: 0,
        });
      }

      if (eventsResult.success) {
        setRecentEvents(
          Array.isArray(eventsResult.data) ? eventsResult.data : []
        );
      } else {
        setRecentEvents([]);
      }
    } catch (err) {
      console.error("Error en fetchData:", err);
      setError("No se pudieron cargar los datos del sistema");
      setStats({
        totalEventos: 0,
        totalUsuarios: 1,
        totalReservas: 0,
        sociosActivos: 0,
      });
      setRecentEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (eventId) => {
    try {
      const result = await togglePublishEvent(eventId);

      if (result.success) {
        setSuccess(result.message);
        fetchData(); // Reload data
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(result.message || "Error al cambiar estado");
      }
    } catch (err) {
      setError("Error de conexión");
    }
  };

  const handleToggleFeatured = async (eventId) => {
    try {
      const result = await toggleFeatureEvent(eventId);

      if (result.success) {
        setSuccess(result.message);
        fetchData();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(result.message || "Error al cambiar destacado");
      }
    } catch (err) {
      setError("Error de conexión");
    }
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-4 md:p-8 bg-black min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-gradient mb-2 text-2xl md:text-4xl">Dashboard Admin</h1>
        <p className="text-gray-400 text-sm md:text-lg">Resumen general del sistema</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6 flex items-center gap-3">
          <AlertCircle size={20} />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
          <button onClick={() => setError("")} className="ml-auto font-bold">
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-500/20 border border-green-500 text-green-200 px-4 py-3 rounded-lg mb-6 flex items-center gap-3">
          <AlertCircle size={20} />
          <p>{success}</p>
          <button onClick={() => setSuccess("")} className="ml-auto font-bold">
            ×
          </button>
        </div>
      )}

      {/* Stats Cards */}
      {stats && <AdminStats stats={stats} />}

      {/* Eventos Recientes */}
      {recentEvents.length > 0 && (
        <div className="mt-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-white">
                Eventos Recientes
              </h2>
            </div>
            <button
              onClick={() => navigate("/admin/eventos")}
              className="text-primary-300 hover:text-primary-200 text-sm font-medium"
            >
              Ver todos →
            </button>
          </div>

          <div className="space-y-3">
            {recentEvents.map((event) => {
              const isPublished = event.visible_desde !== null;
              const isFeatured = event.destacado === 1;
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
                  imageSize="sm"
                  title={event.titulo}
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
                  fields={[
                    {
                      icon: <Calendar size={14} className="text-primary-300" />,
                      label: "Fecha",
                      value: formatDate(event.fecha_evento),
                    },
                    {
                      icon: <MapPin size={14} className="text-primary-300" />,
                      label: "Ubicación",
                      value: event.ubicacion,
                    },
                    {
                      icon: <Users size={14} className="text-primary-300" />,
                      label: "Asistencia",
                      value: `${event.confirmed_bookings || 0}/${event.aforo_maximo}`,
                    },
                  ]}
                  columns={3}
                  actions={[
                    {
                      icon: isPublished ? <EyeOff size={18} /> : <Eye size={18} />,
                      onClick: () => handleTogglePublish(event.id),
                      color: "primary",
                      title: isPublished ? "Despublicar" : "Publicar",
                    },
                    {
                      icon: (
                        <Star
                          size={18}
                          fill={isFeatured ? "currentColor" : "none"}
                        />
                      ),
                      onClick: () => handleToggleFeatured(event.id),
                      color: isFeatured ? "primary" : "gray",
                      title: isFeatured ? "Quitar destacado" : "Destacar",
                    },
                    {
                      icon: <Edit size={18} />,
                      onClick: () => navigate(`/admin/eventos/editar/${event.id}`),
                      color: "primary",
                      title: "Editar",
                    },
                  ]}
                  onClick={() => navigate(`/admin/eventos?open=${event.id}`)}
                  className="cursor-pointer"
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Acciones Rápidas */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-white mb-6">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <QuickActionCard
            title="Crear Evento"
            description="Añade un nuevo evento al sistema"
            icon={Plus}
            iconColor="primary"
            path="/admin/eventos/nuevo"
          />

          <QuickActionCard
            title="Crear Socio Manual"
            description="Registra un socio sin pago previo"
            icon={UserPlus}
            iconColor="green"
            path="/admin/socios/crear"
          />

          <QuickActionCard
            title="Gestionar Socios"
            description="Ver, aprobar y gestionar socios"
            icon={Users}
            iconColor="blue"
            path="/admin/socios"
          />

          <QuickActionCard
            title="Ver Reservas"
            description="Consulta todas las reservas"
            icon={Ticket}
            iconColor="primary"
            path="/admin/reservas"
          />

          <QuickActionCard
            title="Verificar QR"
            description="Escanear QR para check-in"
            icon={QrCode}
            iconColor="orange"
            path="/admin/reservas/verificar-qr"
          />

          <QuickActionCard
            title="Todos los Eventos"
            description="Ver y gestionar todos los eventos"
            icon={Calendar}
            iconColor="cyan"
            path="/admin/eventos"
          />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;