import { useState, useEffect } from 'react';
import { getPaymentsStats, getMonthlyRevenue } from '../../api/adminApi';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import { DollarSign, TrendingUp, CreditCard, Calendar } from 'lucide-react';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const formatMes = (mesStr) => {
  // mesStr comes as 'YYYY-MM-01'
  if (!mesStr) return '';
  const [year, month] = mesStr.split('-');
  return `${MONTH_NAMES[parseInt(month, 10) - 1]} ${year}`;
};

const AdminStatsPagos = () => {
  const [monthlyData, setMonthlyData]     = useState([]);
  const [currentMonth, setCurrentMonth]   = useState(null);
  const [previousMonth, setPreviousMonth] = useState(null);
  const [byType, setByType]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const monthlyResult = await getMonthlyRevenue();

      if (monthlyResult.success) {
        const { monthly_data, current_month, previous_month, by_payment_type } = monthlyResult.data;
        setMonthlyData(Array.isArray(monthly_data) ? monthly_data : []);
        setCurrentMonth(current_month || { total_ingresos: 0, total_pagos: 0 });
        setPreviousMonth(previous_month || { total_ingresos: 0, total_pagos: 0 });
        setByType(Array.isArray(by_payment_type) ? by_payment_type : []);
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

  const totalYear = monthlyData.reduce((sum, m) => sum + parseFloat(m.total_ingresos || 0), 0);
  const avgMonthly = monthlyData.length > 0 ? totalYear / monthlyData.length : 0;

  const TYPE_LABELS = {
    cuota_mensual:  'Cuota mensual',
    entrada_evento: 'Entrada evento',
    otro:           'Otro',
  };

  return (
    <div className="p-4 md:p-8 bg-black min-h-screen">
      <div className="mb-8">
        <h1 className="text-gradient mb-2 text-2xl md:text-4xl">Estadísticas de Pagos</h1>
        <p className="text-gray-400 text-sm md:text-lg">Análisis de ingresos y transacciones</p>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
        <StatCard
          title="Total Año Actual"
          value={`${totalYear.toFixed(2)}€`}
          icon={DollarSign}
        />
        <StatCard
          title="Promedio Mensual"
          value={`${avgMonthly.toFixed(2)}€`}
          icon={TrendingUp}
        />
        <StatCard
          title="Mes Actual"
          value={`${parseFloat(currentMonth?.total_ingresos || 0).toFixed(2)}€`}
          sub={`${currentMonth?.total_pagos || 0} pagos`}
          icon={Calendar}
        />
        <StatCard
          title="Mes Anterior"
          value={`${parseFloat(previousMonth?.total_ingresos || 0).toFixed(2)}€`}
          sub={`${previousMonth?.total_pagos || 0} pagos`}
          icon={CreditCard}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Ingresos por mes */}
        <div className="md:col-span-2 bg-[#1a1a1a] border border-[#262626] rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Ingresos por Mes</h3>
          {monthlyData.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay datos para el año actual.</p>
          ) : (
            <div className="space-y-2">
              {[...monthlyData].reverse().map((month) => (
                <div
                  key={month.mes}
                  className="flex items-center justify-between p-3 bg-[#262626]/50 rounded-lg"
                >
                  <span className="text-white font-medium">{formatMes(month.mes)}</span>
                  <div className="text-right">
                    <p className="text-primary-300 font-bold">
                      {parseFloat(month.total_ingresos || 0).toFixed(2)}€
                    </p>
                    <p className="text-gray-400 text-sm">{month.total_pagos} pagos</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desglose por tipo */}
        <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Por Tipo de Pago</h3>
          {byType.length === 0 ? (
            <p className="text-gray-500 text-sm">Sin datos.</p>
          ) : (
            <div className="space-y-3">
              {byType.map((t) => (
                <div key={t.tipo_pago} className="p-3 bg-[#262626]/50 rounded-lg">
                  <p className="text-gray-400 text-sm mb-1">
                    {TYPE_LABELS[t.tipo_pago] || t.tipo_pago}
                  </p>
                  <p className="text-primary-300 font-bold text-lg">
                    {parseFloat(t.total_ingresos || 0).toFixed(2)}€
                  </p>
                  <p className="text-gray-500 text-xs">{t.total_pagos} transacciones</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, sub, icon: Icon }) => (
  <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6">
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
      <p className="text-gray-400 text-sm">{title}</p>
      <Icon className="w-5 h-5 text-primary-400" />
    </div>
    <p className="text-primary-300 text-xl sm:text-3xl font-bold">{value}</p>
    {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
  </div>
);

export default AdminStatsPagos;