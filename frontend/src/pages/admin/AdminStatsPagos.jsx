import { useState, useEffect } from 'react';
import { getPaymentsStats, getMonthlyRevenue } from '../../api/adminApi';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import { DollarSign, TrendingUp } from 'lucide-react';

const AdminStatsPagos = () => {
  const [stats, setStats] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsResult, monthlyResult] = await Promise.all([
        getPaymentsStats(),
        getMonthlyRevenue()
      ]);
      
      if (statsResult.success && monthlyResult.success) {
        setStats(statsResult.data);
        setMonthly(monthlyResult.data);
      } else {
        setError('Error al cargar estadísticas de pagos');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('No se pudieron cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  const totalYear = monthly.reduce((sum, month) => sum + parseFloat(month.total || 0), 0);

  return (
    <div className="p-8 bg-black min-h-screen">
      <div className="mb-8">
        <h1 className="text-gradient mb-2 text-4xl">Estadísticas de Pagos</h1>
        <p className="text-gray-400 text-lg">Análisis de ingresos y transacciones</p>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {stats && (
        <>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <StatCard title="Total Año Actual" value={`${totalYear.toFixed(2)}€`} icon={DollarSign} color="green" />
            <StatCard title="Promedio Mensual" value={`${(totalYear / 12).toFixed(2)}€`} icon={TrendingUp} color="blue" />
            <StatCard title="Último Mes" value={`${(monthly[monthly.length - 1]?.total || 0)}€`} icon={DollarSign} color="purple" />
          </div>

          <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Ingresos por Mes (Año Actual)</h3>
            <div className="space-y-2">
              {monthly.map(month => (
                <div key={month.mes} className="flex items-center justify-between p-3 bg-[#262626]/50 rounded-lg">
                  <span className="text-white font-medium">{month.mes_nombre}</span>
                  <div className="text-right">
                    <p className="text-primary-300 font-bold">{parseFloat(month.total || 0).toFixed(2)}€</p>
                    <p className="text-gray-400 text-sm">{month.cantidad_pagos} pagos</p>
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
    <div className="flex items-start justify-between mb-4">
      <div>
        <p className="text-gray-400 text-sm mb-1">{title}</p>
        <p className="text-primary-300 text-3xl font-bold">{value}</p>
      </div>
      <Icon className={`w-8 h-8 text-${color}-400`} />
    </div>
  </div>
);

export default AdminStatsPagos;