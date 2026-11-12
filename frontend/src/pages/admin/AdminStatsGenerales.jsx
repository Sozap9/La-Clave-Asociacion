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
import { FEATURES } from '../../utils/constants';

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
    if (value > 0) return <TrendingUp className="w-4 h-4 text-primary-300" />;
    if (value < 0) return <TrendingDown className="w-4 h-4 text-primary-300" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getTrendColor = (value) => {
    if (value > 0) return 'text-primary-300';
    if (value < 0) return 'text-primary-300';
    return 'text-gray-400';
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-4 md:p-8 bg-black min-h-screen">
      {/* Cabecera */}
      <div className="mb-8">
        <h1 className="text-gradient mb-2 text-2xl md:text-4xl">Estadísticas Generales</h1>
        <p className="text-gray-400 text-sm md:text-lg">Vista general completa del sistema</p>
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
          {/* Usuarios y socios */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-6 h-6 text-primary-300" />
              Usuarios y Socios
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
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
              

            </div>
          </section>

          {/* Eventos */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-primary-300" />
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
              <Ticket className="w-6 h-6 text-primary-300" />
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
              <DollarSign className="w-6 h-6 text-primary-300" />
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
            
            <div
              className={`grid grid-cols-1 ${
                FEATURES.GALLERY_ENABLED ? "md:grid-cols-3" : "md:grid-cols-2"
              } gap-4 md:gap-6`}
            >
              {FEATURES.GALLERY_ENABLED && (
                <StatCard
                  title="Galería"
                  value={`${stats.galeria?.total_imagenes || 0} fotos`}
                  icon={Users}
                  color="pink"
                  subtitle={`${stats.galeria?.total_folders || 0} álbumes`}
                />
              )}
              
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

// Tarjeta de estadística
const StatCard = ({ title, value, icon: Icon, color, subtitle }) => {
  return (
    <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6 hover:border-primary-500/50 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div>
          <p className="text-gray-400 text-sm mb-1">{title}</p>
          <p className="text-primary-300 text-xl sm:text-3xl font-bold">{value}</p>
        </div>
        <Icon className="w-8 h-8 text-primary-300" />
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