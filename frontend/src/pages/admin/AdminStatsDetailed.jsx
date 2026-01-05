import { useState, useEffect } from 'react';
import { BarChart3, Users, Calendar, TrendingUp, Ticket, DollarSign } from 'lucide-react';
import Loader from '../../components/common/Loader';

const AdminStatsDetailed = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDetailedStats();
  }, []);

  const fetchDetailedStats = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setStats(result.data);
      } else {
        setError(result.message || 'Error al cargar estadísticas');
      }
    } catch (err) {
      console.error('Error en fetchDetailedStats:', err);
      setError('Error de conexión con el servidor. Verifica que el backend esté corriendo en http://localhost:5000');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Estadísticas Detalladas</h1>
        <p className="text-gray-400">Vista completa del rendimiento del sistema</p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-4 rounded-lg mb-6">
          <p className="mb-3">{error}</p>
          <button
            onClick={fetchDetailedStats}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
          >
            🔄 Reintentar
          </button>
        </div>
      )}

      {stats && (
        <>
          {/* Stats principales - Grid 3x2 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <Users className="text-primary-400" size={28} />
                <p className="text-gray-400 text-sm">Total Usuarios</p>
              </div>
              <p className="text-white text-4xl font-bold mb-2">
                {stats.total_usuarios || 0}
              </p>
              <div className="flex gap-4 text-sm">
                <span className="text-primary-400">
                  {stats.usuarios_activos || 0} activos
                </span>
                <span className="text-gray-500">
                  {stats.nuevos_usuarios_mes || 0} este mes
                </span>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <Users className="text-purple-400" size={28} />
                <p className="text-gray-400 text-sm">Total Socios</p>
              </div>
              <p className="text-white text-4xl font-bold mb-2">
                {stats.total_socios || 0}
              </p>
              <div className="flex gap-4 text-sm">
                <span className="text-green-400">
                  {stats.socios_activos || 0} activos
                </span>
                <span className="text-gray-500">
                  {stats.nuevos_socios_mes || 0} este mes
                </span>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="text-blue-400" size={28} />
                <p className="text-gray-400 text-sm">Total Eventos</p>
              </div>
              <p className="text-white text-4xl font-bold mb-2">
                {stats.total_eventos || 0}
              </p>
              <div className="flex gap-4 text-sm">
                <span className="text-green-400">
                  {stats.eventos_proximos || 0} próximos
                </span>
                <span className="text-gray-500">
                  {stats.eventos_mes || 0} este mes
                </span>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <Ticket className="text-green-400" size={28} />
                <p className="text-gray-400 text-sm">Total Reservas</p>
              </div>
              <p className="text-white text-4xl font-bold mb-2">
                {stats.total_reservas || 0}
              </p>
              <div className="flex gap-4 text-sm">
                <span className="text-green-400">
                  {stats.reservas_confirmadas || 0} confirmadas
                </span>
                <span className="text-gray-500">
                  {stats.reservas_mes || 0} este mes
                </span>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <DollarSign className="text-green-400" size={28} />
                <p className="text-gray-400 text-sm">Ingresos Totales</p>
              </div>
              <p className="text-white text-4xl font-bold mb-2">
                {formatCurrency(stats.ingresos_totales)}
              </p>
              <div className="flex gap-4 text-sm">
                <span className="text-green-400">
                  {formatCurrency(stats.ingresos_mes)}
                </span>
                <span className="text-gray-500">este mes</span>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <TrendingUp className="text-yellow-400" size={28} />
                <p className="text-gray-400 text-sm">Tasa Ocupación</p>
              </div>
              <p className="text-white text-4xl font-bold mb-2">
                {stats.tasa_ocupacion_promedio || 0}%
              </p>
              <p className="text-gray-500 text-sm">promedio eventos</p>
            </div>
          </div>

          {/* Top 5 Eventos más populares */}
          {stats.top_eventos && stats.top_eventos.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <BarChart3 size={24} className="text-primary-400" />
                Top 5 Eventos Más Populares
              </h2>
              <div className="space-y-4">
                {stats.top_eventos.map((evento, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-yellow-500 text-black' :
                      index === 1 ? 'bg-gray-400 text-black' :
                      index === 2 ? 'bg-orange-500 text-black' :
                      'bg-gray-700 text-white'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold">{evento.titulo || evento.nombre}</h3>
                      <p className="text-gray-400 text-sm">
                        {evento.total_reservas} reservas • {evento.entradas_vendidas} entradas vendidas
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-primary-400 font-bold">{evento.ocupacion}%</p>
                      <p className="text-gray-500 text-sm">ocupación</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grid 2 columnas - Próximos eventos + Actividad reciente */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Próximos Eventos */}
            {stats.proximos_eventos && stats.proximos_eventos.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Calendar size={20} className="text-blue-400" />
                  Próximos Eventos
                </h2>
                <div className="space-y-4">
                  {stats.proximos_eventos.map((evento, index) => (
                    <div key={index} className="border-l-4 border-primary-500 pl-4">
                      <h3 className="text-white font-semibold">{evento.titulo || evento.nombre}</h3>
                      <p className="text-gray-400 text-sm">{formatDate(evento.fecha_evento || evento.fecha)}</p>
                      <p className="text-gray-500 text-xs mt-1">
                        {evento.entradas_reservadas || 0} / {evento.aforo_maximo} entradas
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actividad Reciente */}
            {stats.actividad_reciente && stats.actividad_reciente.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <TrendingUp size={20} className="text-green-400" />
                  Actividad Reciente
                </h2>
                <div className="space-y-4">
                  {stats.actividad_reciente.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-primary-500 rounded-full mt-2" />
                      <div className="flex-1">
                        <p className="text-white text-sm">
                          {activity.descripcion || `${activity.accion} en ${activity.entidad}`}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {formatDate(activity.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminStatsDetailed;
