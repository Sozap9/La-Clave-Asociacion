import { useState, useEffect } from 'react';
import { getDashboardStats } from '../../api/adminApi';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import { 
  Users, 
  Calendar, 
  Ticket, 
  DollarSign, 
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

const AdminStatsGenerales = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getDashboardStats();
      if (result.success) {
        setStats(result.data);
      } else {
        setError(result.message || 'Error al cargar estadísticas');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('No se pudieron cargar las estadísticas. Verifica la conexión con el backend.');
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (value) => {
    if (value > 0) return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (value < 0) return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getTrendColor = (value) => {
    if (value > 0) return 'text-green-400';
    if (value < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Estadísticas Generales</h1>
        <p className="text-gray-400">Vista general completa del sistema</p>
      </div>

      {/* Error */}
      {error && (
        <Alert 
          type="error" 
          message={error}
          onClose={() => setError('')}
        />
      )}

      {stats && (
        <>
          {/* Usuarios y Socios */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-6 h-6 text-primary-400" />
              Usuarios y Socios
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Usuarios Básicos"
                value={stats.usuarios?.basicos || 0}
                icon={Users}
                color="blue"
                subtitle={`+${stats.usuarios?.nuevos_usuarios_mes || 0} este mes`}
              />
              
              <StatCard
                title="Socios"
                value={stats.usuarios?.socios || 0}
                icon={Users}
                color="purple"
                subtitle={`+${stats.usuarios?.nuevos_socios_mes || 0} este mes`}
              />
              
              <StatCard
                title="Socios Activos"
                value={stats.socios?.activos || 0}
                icon={Users}
                color="green"
                subtitle={`${stats.socios?.total || 0} total`}
              />
              
              <StatCard
                title="Socios Morosos"
                value={stats.socios?.morosos || 0}
                icon={Users}
                color="red"
                subtitle={`${stats.socios?.baja || 0} de baja`}
              />
            </div>
          </section>

          {/* Eventos */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-primary-400" />
              Eventos
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Eventos"
                value={stats.eventos?.total || 0}
                icon={Calendar}
                color="blue"
                subtitle={`${stats.eventos?.publicados || 0} publicados`}
              />
              
              <StatCard
                title="Próximos"
                value={stats.eventos?.proximos || 0}
                icon={Calendar}
                color="green"
                subtitle="Por celebrar"
              />
              
              <StatCard
                title="Ocupación Promedio"
                value={`${stats.eventos?.ocupacion_promedio || 0}%`}
                icon={TrendingUp}
                color="purple"
                subtitle="Aforo medio"
              />
              
              <StatCard
                title="Eventos Pasados"
                value={stats.eventos?.pasados || 0}
                icon={Calendar}
                color="gray"
                subtitle="Historial"
              />
            </div>
          </section>

          {/* Reservas */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <Ticket className="w-6 h-6 text-primary-400" />
              Reservas
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Reservas"
                value={stats.reservas?.total || 0}
                icon={Ticket}
                color="blue"
                subtitle={`${stats.reservas?.confirmadas || 0} confirmadas`}
              />
              
              <StatCard
                title="Esta Semana"
                value={stats.reservas?.esta_semana || 0}
                icon={TrendingUp}
                color="green"
                subtitle="Últimos 7 días"
              />
              
              <StatCard
                title="Este Mes"
                value={stats.reservas?.este_mes || 0}
                icon={Calendar}
                color="purple"
                subtitle="Últimos 30 días"
              />
              
              <StatCard
                title="Asistencias"
                value={stats.reservas?.asistidas || 0}
                icon={Ticket}
                color="yellow"
                subtitle={`${stats.reservas?.canceladas || 0} canceladas`}
              />
            </div>
          </section>

          {/* Ingresos */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-primary-400" />
              Ingresos
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Mes Actual"
                value={`${stats.ingresos?.mes_actual?.toFixed(2) || '0.00'}€`}
                icon={DollarSign}
                color="green"
                subtitle={
                  <span className={`flex items-center gap-1 ${getTrendColor(stats.ingresos?.comparativa_mes || 0)}`}>
                    {getTrendIcon(stats.ingresos?.comparativa_mes || 0)}
                    {Math.abs(stats.ingresos?.comparativa_mes || 0).toFixed(1)}% vs mes anterior
                  </span>
                }
              />
              
              <StatCard
                title="Mes Anterior"
                value={`${stats.ingresos?.mes_anterior?.toFixed(2) || '0.00'}€`}
                icon={DollarSign}
                color="blue"
                subtitle="Comparativa"
              />
              
              <StatCard
                title="Año Actual"
                value={`${stats.ingresos?.año_actual?.toFixed(2) || '0.00'}€`}
                icon={TrendingUp}
                color="purple"
                subtitle={`${stats.ingresos?.pagos_mes_actual || 0} pagos este mes`}
              />
              
              <StatCard
                title="Promedio Diario"
                value={`${(stats.ingresos?.mes_actual / 30 || 0).toFixed(2)}€`}
                icon={Calendar}
                color="yellow"
                subtitle="Últimos 30 días"
              />
            </div>
          </section>

          {/* Otros */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Otros Módulos</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <StatCard
                title="Galería"
                value={`${stats.galeria?.total_imagenes || 0} fotos`}
                icon={Users}
                color="pink"
                subtitle={`${stats.galeria?.total_folders || 0} álbumes`}
              />
              
              <StatCard
                title="Venues"
                value={stats.venues?.total || 0}
                icon={Calendar}
                color="indigo"
                subtitle={`${stats.venues?.activos || 0} activos`}
              />
              
              <StatCard
                title="Artistas"
                value={stats.artists?.total || 0}
                icon={Users}
                color="red"
                subtitle={`${stats.artists?.verificados || 0} verificados`}
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
};

// Componente reutilizable para tarjetas de estadísticas
const StatCard = ({ title, value, icon: Icon, color, subtitle }) => {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
    green: 'from-green-500/20 to-green-600/10 border-green-500/30',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
    red: 'from-red-500/20 to-red-600/10 border-red-500/30',
    yellow: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30',
    gray: 'from-gray-500/20 to-gray-600/10 border-gray-500/30',
    pink: 'from-pink-500/20 to-pink-600/10 border-pink-500/30',
    indigo: 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/30'
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-6`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-gray-400 text-sm mb-1">{title}</p>
          <p className="text-white text-3xl font-bold">{value}</p>
        </div>
        <Icon className={`w-8 h-8 text-${color}-400`} />
      </div>
      
      {subtitle && (
        <p className="text-gray-400 text-sm">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default AdminStatsGenerales;
