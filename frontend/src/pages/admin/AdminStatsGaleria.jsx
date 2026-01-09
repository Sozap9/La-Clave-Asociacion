import { useState, useEffect } from 'react';
import { getGalleryStats } from '../../api/adminApi';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import { Image, Folder } from 'lucide-react';

const AdminStatsGaleria = () => {
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
      const result = await getGalleryStats();
      if (result.success) {
        setStats(result.data);
      } else {
        setError('Error al cargar estadísticas de galería');
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
    <div className="p-8 bg-black min-h-screen">
      <div className="mb-8">
        <h1 className="text-gradient mb-2 text-4xl">Estadísticas de Galería</h1>
        <p className="text-gray-400 text-lg">Análisis de álbumes y fotografías</p>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {stats && (
        <div className="grid md:grid-cols-4 gap-6">
          <StatCard title="Total Álbumes" value={stats.total_folders || 0} icon={Folder} />
          <StatCard title="Total Imágenes" value={stats.total_imagenes || 0} icon={Image} color="green" />
          <StatCard title="Visibles" value={stats.folders_visibles || 0} icon={Folder} color="blue" />
          <StatCard title="Espacio Usado" value={`${stats.espacio_usado_mb || 0} MB`} icon={Image} color="purple" />
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color = 'blue' }) => (
  <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6">
    <div className="flex items-start justify-between mb-4">
      <div>
        <p className="text-gray-400 text-sm mb-1">{title}</p>
        <p className="text-primary-300 text-3xl font-bold">{value}</p>
      </div>
      <Icon className={`w-8 h-8 text-${color}-400`} />
    </div>
  </div>
);

export default AdminStatsGaleria;