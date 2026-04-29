import { useState, useEffect } from 'react';
import { getBookingsStats } from '../../api/adminApi';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import { Ticket, CheckCircle, Calendar } from 'lucide-react';

const AdminStatsReservas = () => {
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
      const result = await getBookingsStats();
      if (result.success) {
        setStats(result.data);
      } else {
        setError('Error al cargar estadísticas de reservas');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('No se pudieron cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-4 md:p-8 bg-black min-h-screen">
      <div className="mb-8">
        <h1 className="text-gradient mb-2 text-2xl md:text-4xl">Estadísticas de Reservas</h1>
        <p className="text-gray-400 text-sm md:text-lg">Análisis de reservas y asistencias</p>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
            <StatCard title="Total Reservas" value={stats.general?.total_reservas || 0} icon={Ticket} />
            <StatCard title="Confirmadas" value={stats.general?.confirmadas || 0} icon={CheckCircle} color="green" />
            <StatCard title="Esta Semana" value={stats.general?.esta_semana || 0} icon={Calendar} color="blue" />
            <StatCard title="Asistencias" value={stats.general?.asistidas || 0} icon={Ticket} color="purple" />
          </div>

          <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Top Eventos con Más Reservas</h3>
            <div className="space-y-3">
              {stats.top_eventos?.map((evento, index) => (
                <div key={evento.id} className="flex items-center justify-between p-3 bg-[#262626]/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-primary-300">#{index + 1}</span>
                    <div>
                      <h4 className="text-white font-medium">{evento.titulo}</h4>
                      <p className="text-gray-400 text-sm">
                        {new Date(evento.fecha_evento).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">{evento.total_reservas} reservas</p>
                    <p className="text-gray-400 text-sm">{evento.total_entradas} entradas</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color = 'blue' }) => (
  <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6">
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
      <div>
        <p className="text-gray-400 text-sm mb-1">{title}</p>
        <p className="text-primary-300 text-xl sm:text-3xl font-bold">{value}</p>
      </div>
      <Icon className="w-8 h-8 text-primary-400" />
    </div>
  </div>
);

export default AdminStatsReservas;