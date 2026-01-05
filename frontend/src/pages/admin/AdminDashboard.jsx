import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getAdminStats, 
  getAllEventsAdmin,
  togglePublishEvent,
  toggleFeatureEvent 
} from '../../api/adminApi';
import AdminStats from '../../components/admin/AdminStats';
import QuickActionCard from '../../components/admin/QuickActionCard';
import Loader from '../../components/common/Loader';
import { 
  AlertCircle, Plus, UserPlus, Users, Ticket, QrCode, Calendar,
  Eye, EyeOff, Star, Edit, TrendingUp
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Fetch stats and recent events in parallel
      const [statsResult, eventsResult] = await Promise.all([
        getAdminStats(),
        getAllEventsAdmin({ limit: 5 })
      ]);
      
      if (statsResult.success) {
        setStats(statsResult.data);
      } else {
        setStats({
          totalEventos: 0,
          totalUsuarios: 1,
          totalReservas: 0,
          sociosActivos: 0
        });
      }

      if (eventsResult.success) {
        setRecentEvents(Array.isArray(eventsResult.data) ? eventsResult.data : []);
      } else {
        setRecentEvents([]);
      }
    } catch (err) {
      console.error('Error en fetchData:', err);
      setError('No se pudieron cargar los datos del sistema');
      setStats({
        totalEventos: 0,
        totalUsuarios: 1,
        totalReservas: 0,
        sociosActivos: 0
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
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message || 'Error al cambiar estado');
      }
    } catch (err) {
      setError('Error de conexión');
    }
  };

  const handleToggleFeatured = async (eventId) => {
    try {
      const result = await toggleFeatureEvent(eventId);
      
      if (result.success) {
        setSuccess(result.message);
        fetchData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message || 'Error al cambiar destacado');
      }
    } catch (err) {
      setError('Error de conexión');
    }
  };

  const getStatusBadge = (event) => {
    const isPublished = event.visible_desde !== null;
    const estado = event.estado;

    let color, text;
    
    if (estado === 'draft') {
      color = 'bg-gray-500';
      text = 'Borrador';
    } else if (estado === 'scheduled' && isPublished) {
      color = 'bg-green-500';
      text = 'Publicado';
    } else if (estado === 'scheduled' && !isPublished) {
      color = 'bg-blue-500';
      text = 'Programado';
    } else if (estado === 'active') {
      color = 'bg-purple-500';
      text = 'En curso';
    } else if (estado === 'completed') {
      color = 'bg-gray-400';
      text = 'Finalizado';
    } else if (estado === 'cancelled') {
      color = 'bg-red-500';
      text = 'Cancelado';
    } else {
      color = 'bg-gray-500';
      text = estado || 'Desconocido';
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}/20 text-white`}>
        {text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Dashboard Admin</h1>
        <p className="text-gray-400">Resumen general del sistema</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6 flex items-center gap-3">
          <AlertCircle size={20} />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
          <button onClick={() => setError('')} className="ml-auto font-bold">×</button>
        </div>
      )}
      
      {success && (
        <div className="bg-green-500/20 border border-green-500 text-green-200 px-4 py-3 rounded-lg mb-6 flex items-center gap-3">
          <AlertCircle size={20} />
          <p>{success}</p>
          <button onClick={() => setSuccess('')} className="ml-auto font-bold">×</button>
        </div>
      )}

      {/* Stats Cards */}
      {stats && <AdminStats stats={stats} />}

      {/* Eventos Recientes */}
      {recentEvents.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="text-purple-400" size={24} />
              <h2 className="text-2xl font-bold text-white">Eventos Recientes</h2>
            </div>
            <button
              onClick={() => navigate('/admin/eventos')}
              className="text-purple-400 hover:text-purple-300 text-sm font-medium"
            >
              Ver todos →
            </button>
          </div>

          <div className="space-y-3">
            {recentEvents.map((event) => {
              const isPublished = event.visible_desde !== null;
              const isFeatured = event.destacado === 1;
              
              return (
                <div
                  key={event.id}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-purple-500/50 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {/* Image */}
                      {event.imagen_cartel_url && (
                        <img
                          src={`${import.meta.env.VITE_API_URL}${event.imagen_cartel_url}`}
                          alt={event.titulo}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}

                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-white">
                            {event.titulo}
                          </h3>
                          {isFeatured && (
                            <Star className="text-yellow-400" size={16} fill="currentColor" />
                          )}
                          {getStatusBadge(event)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>📅 {formatDate(event.fecha_evento)}</span>
                          <span>📍 {event.ubicacion}</span>
                          <span>👥 {event.confirmed_bookings || 0}/{event.aforo_maximo}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {/* Toggle Publish */}
                      <button
                        onClick={() => handleTogglePublish(event.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          isPublished 
                            ? 'text-orange-400 hover:bg-orange-500/20' 
                            : 'text-green-400 hover:bg-green-500/20'
                        }`}
                        title={isPublished ? 'Despublicar' : 'Publicar'}
                      >
                        {isPublished ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>

                      {/* Toggle Featured */}
                      <button
                        onClick={() => handleToggleFeatured(event.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          isFeatured
                            ? 'text-yellow-400 hover:bg-yellow-500/20'
                            : 'text-gray-400 hover:bg-gray-500/20'
                        }`}
                        title={isFeatured ? 'Quitar destacado' : 'Destacar'}
                      >
                        <Star size={18} fill={isFeatured ? 'currentColor' : 'none'} />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => navigate(`/admin/eventos/editar/${event.id}`)}
                        className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit size={18} />
                      </button>
                    </div>
                  </div>
                </div>
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
            iconColor="purple"
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
