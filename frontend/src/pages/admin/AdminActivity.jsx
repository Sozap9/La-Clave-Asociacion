import { useState, useEffect } from 'react';
import { Activity, User, Calendar, Filter, RefreshCw } from 'lucide-react';
import Loader from '../../components/common/Loader';

const AdminActivity = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterAccion, setFilterAccion] = useState('all');
  const [filterEntidad, setFilterEntidad] = useState('all');

  useEffect(() => {
    fetchActivity();
  }, []);

  const fetchActivity = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/activity', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setActivities(result.data.items || result.data || []);
      } else {
        setError(result.message || 'Error al cargar actividad');
        setActivities([]);
      }
    } catch (err) {
      console.error('Error en fetchActivity:', err);
      setError('Error de conexión con el servidor. Verifica que el backend esté corriendo en http://localhost:5000');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredActivities = Array.isArray(activities) ? activities.filter(activity => {
    if (filterAccion !== 'all' && activity.accion !== filterAccion) return false;
    if (filterEntidad !== 'all' && activity.entidad !== filterEntidad) return false;
    return true;
  }) : [];

  const getAccionIcon = (accion) => {
    switch (accion) {
      case 'crear':
        return '➕';
      case 'editar':
      case 'actualizar':
        return '✏️';
      case 'eliminar':
        return '🗑️';
      case 'login':
        return '🔐';
      case 'logout':
        return '🚪';
      case 'aprobar':
        return '✅';
      case 'rechazar':
        return '❌';
      case 'cancelar':
        return '🚫';
      case 'verificar':
        return '✔️';
      default:
        return '📝';
    }
  };

  const getAccionColor = (accion) => {
    switch (accion) {
      case 'crear':
        return 'text-primary-300';
      case 'editar':
      case 'actualizar':
        return 'text-primary-300';
      case 'eliminar':
      case 'cancelar':
        return 'text-primary-300';
      case 'aprobar':
        return 'text-primary-300';
      case 'rechazar':
        return 'text-primary-300';
      case 'login':
        return 'text-primary-300';
      case 'logout':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
    
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtener acciones y entidades únicas para filtros
  const uniqueAcciones = [...new Set(activities.map(a => a.accion))].filter(Boolean);
  const uniqueEntidades = [...new Set(activities.map(a => a.entidad))].filter(Boolean);

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-8 bg-black min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-gradient mb-2 text-4xl">Actividad Reciente</h1>
            <p className="text-gray-400 text-lg">
              {Array.isArray(activities) ? `${activities.length} evento${activities.length !== 1 ? 's' : ''} registrado${activities.length !== 1 ? 's' : ''}` : 'Monitorea acciones del sistema'}
            </p>
          </div>
          <button
            onClick={fetchActivity}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <RefreshCw size={20} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-4 rounded-lg mb-6">
          <p className="mb-2 font-semibold">❌ Error al cargar actividad reciente</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Filtros */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4">
          {/* Filtro por Acción */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-white text-sm font-medium mb-2">
              <Filter size={16} className="inline mr-2" />
              Filtrar por Acción
            </label>
            <select
              value={filterAccion}
              onChange={(e) => setFilterAccion(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#262626] rounded-lg px-4 py-2 text-white focus:border-primary-500 focus:outline-none"
            >
              <option value="all">Todas las acciones</option>
              {uniqueAcciones.map(accion => (
                <option key={accion} value={accion}>
                  {accion.charAt(0).toUpperCase() + accion.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Entidad */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-white text-sm font-medium mb-2">
              <Filter size={16} className="inline mr-2" />
              Filtrar por Entidad
            </label>
            <select
              value={filterEntidad}
              onChange={(e) => setFilterEntidad(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#262626] rounded-lg px-4 py-2 text-white focus:border-primary-500 focus:outline-none"
            >
              <option value="all">Todas las entidades</option>
              {uniqueEntidades.map(entidad => (
                <option key={entidad} value={entidad}>
                  {entidad.charAt(0).toUpperCase() + entidad.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {(filterAccion !== 'all' || filterEntidad !== 'all') && (
          <button
            onClick={() => {
              setFilterAccion('all');
              setFilterEntidad('all');
            }}
            className="text-primary-300 hover:text-primary-300 text-sm"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Timeline de actividad */}
      {filteredActivities.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-12 text-center">
          <Activity className="mx-auto mb-4 text-gray-600" size={48} />
          <p className="text-gray-400 text-lg">
            {filterAccion !== 'all' || filterEntidad !== 'all' 
              ? 'No hay actividad que coincida con los filtros'
              : 'No hay actividad registrada'}
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Línea vertical del timeline */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-[#262626]" />

          <div className="space-y-6">
            {filteredActivities.map((activity, index) => (
              <div key={activity.id || index} className="relative pl-16">
                {/* Punto en el timeline */}
                <div className="absolute left-3 top-2 w-6 h-6 rounded-full bg-gray-900 border-2 border-primary-500 flex items-center justify-center">
                  <span className="text-xs">{getAccionIcon(activity.accion)}</span>
                </div>

                {/* Card de actividad */}
                <div className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-4 hover:border-primary-500/50 transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-semibold ${getAccionColor(activity.accion)}`}>
                          {activity.accion?.toUpperCase()}
                        </span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-400 text-sm">{activity.entidad}</span>
                      </div>
                      
                      <p className="text-white">
                        {activity.descripcion || `${activity.accion} en ${activity.entidad}`}
                      </p>
                      
                      {activity.detalles && (
                        <p className="text-gray-500 text-sm mt-1">{activity.detalles}</p>
                      )}
                    </div>

                    <div className="text-right ml-4">
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Calendar size={14} />
                        <span>{formatDate(activity.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#262626]">
                    {activity.usuario_nombre && (
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-400" />
                        <span className="text-gray-400 text-sm">
                          {activity.usuario_nombre} {activity.usuario_apellidos || ''}
                        </span>
                      </div>
                    )}
                    
                    {activity.ip_address && (
                      <span className="text-gray-500 text-xs font-mono">
                        IP: {activity.ip_address}
                      </span>
                    )}

                    {activity.entidad_id && (
                      <span className="text-gray-500 text-xs">
                        ID: {activity.entidad_id}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminActivity;