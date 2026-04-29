import { useState, useEffect } from 'react';
import { TrendingUp, Calendar, DollarSign, Download } from 'lucide-react';
import Loader from '../../components/common/Loader';

const API_URL = import.meta.env.VITE_API_URL;

const AdminPaymentsMonthly = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMonthlyData();
  }, []);

  const fetchMonthlyData = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/admin/payments/monthly`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.message || 'Error al cargar datos mensuales');
      }
    } catch (err) {
      console.error('Error en fetchMonthlyData:', err);
      setError('Error de conexion');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount || 0);
  };

  const formatMonth = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
  };

  const getMaxAmount = () => {
    if (!data?.monthly_data) return 0;
    return Math.max(...data.monthly_data.map(m => m.total_ingresos || 0));
  };

  const calculateChange = () => {
    if (!data?.current_month || !data?.previous_month) return 0;
    const current = data.current_month.total_ingresos || 0;
    const previous = data.previous_month.total_ingresos || 0;
    if (previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const exportCSV = () => {
    if (!data?.monthly_data) return;

    const totalAnual = data.monthly_data.reduce((sum, m) => sum + (parseFloat(m.total_ingresos) || 0), 0);
    const totalPagos = data.monthly_data.reduce((sum, m) => sum + (m.total_pagos || 0), 0);

    const rows = [
      ['Mes', 'Ingresos (EUR)', 'Num Pagos'],
      ...data.monthly_data.map(m => [
        formatMonth(m.mes),
        (parseFloat(m.total_ingresos) || 0).toFixed(2),
        m.total_pagos ?? 0,
      ]),
      [],
      ['TOTAL ANUAL', totalAnual.toFixed(2), totalPagos],
      [],
      ['Mes actual', (parseFloat(data.current_month?.total_ingresos) || 0).toFixed(2), data.current_month?.total_pagos ?? 0],
      ['Mes anterior', (parseFloat(data.previous_month?.total_ingresos) || 0).toFixed(2), data.previous_month?.total_pagos ?? 0],
    ];

    const csvContent = rows
      .map(row => row.map(cell => String(cell)).join(';'))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ingresos_mensuales_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-4 md:p-8 bg-black min-h-screen">
      <div className="mb-8">
        <h1 className="text-gradient mb-2 text-2xl md:text-4xl">Ingresos Mensuales</h1>
        <p className="text-gray-400 text-sm md:text-lg">Analisis de ingresos de los ultimos 12 meses</p>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
            <div className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-6 hover:border-primary-500/50 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="text-primary-300" size={24} />
                <p className="text-gray-400 text-sm">Mes Actual</p>
              </div>
              <p className="text-primary-300 text-xl sm:text-3xl font-bold">
                {formatCurrency(data.current_month?.total_ingresos)}
              </p>
              <p className="text-gray-500 text-sm mt-1">
                {data.current_month?.total_pagos || 0} pago{data.current_month?.total_pagos !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-6 hover:border-primary-500/50 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="text-primary-300" size={24} />
                <p className="text-gray-400 text-sm">Mes Anterior</p>
              </div>
              <p className="text-primary-300 text-xl sm:text-3xl font-bold">
                {formatCurrency(data.previous_month?.total_ingresos)}
              </p>
              <p className="text-gray-500 text-sm mt-1">
                {data.previous_month?.total_pagos || 0} pago{data.previous_month?.total_pagos !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-6 hover:border-primary-500/50 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="text-primary-300" size={24} />
                <p className="text-gray-400 text-sm">Variacion</p>
              </div>
              <p className="text-primary-300 text-xl sm:text-3xl font-bold">
                {calculateChange() >= 0 ? '+' : ''}{calculateChange()}%
              </p>
              <p className="text-gray-500 text-sm mt-1">vs mes anterior</p>
            </div>

            <div className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-6 hover:border-primary-500/50 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="text-primary-300" size={24} />
                <p className="text-gray-400 text-sm">Total 12 Meses</p>
              </div>
              <p className="text-primary-300 text-xl sm:text-3xl font-bold">
                {formatCurrency(data.monthly_data?.reduce((sum, m) => sum + (m.total_ingresos || 0), 0))}
              </p>
              <p className="text-gray-500 text-sm mt-1">Ultimo año</p>
            </div>
          </div>

          <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6 mb-8 hover:border-primary-500/50 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <h2 className="text-xl font-bold text-white">Evolucion Mensual</h2>
              <button
                onClick={exportCSV}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
              >
                <Download size={16} />
                Exportar
              </button>
            </div>

            {data.monthly_data?.length > 0 ? (
              <div className="space-y-4">
                {data.monthly_data.map((month, index) => {
                  const maxAmount = getMaxAmount();
                  const percentage = maxAmount > 0 ? (month.total_ingresos / maxAmount * 100) : 0;
                  return (
                    <div key={index} className="group">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 text-sm font-medium w-24">
                          {formatMonth(month.mes)}
                        </span>
                        <span className="text-white font-semibold">
                          {formatCurrency(month.total_ingresos)}
                        </span>
                      </div>
                      <div className="w-full bg-[#262626] rounded-full h-8 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-primary-600 to-primary-400 h-full rounded-full transition-all duration-500 flex items-center justify-end px-3"
                          style={{ width: `${percentage}%` }}
                        >
                          {percentage > 20 && (
                            <span className="text-white text-xs font-medium">
                              {month.total_pagos} pago{month.total_pagos !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No hay datos de ingresos para este año</p>
            )}
          </div>

          {data.by_payment_type?.length > 0 && (
            <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Desglose por Tipo de Pago</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.by_payment_type.map((type, index) => (
                  <div key={index} className="bg-[#262626] rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-1">
                      {type.tipo_pago?.replace('_', ' ') || 'Otros'}
                    </p>
                    <p className="text-white text-2xl font-bold mb-1">
                      {formatCurrency(type.total_ingresos)}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {type.total_pagos} transaccion{type.total_pagos !== 1 ? 'es' : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminPaymentsMonthly;