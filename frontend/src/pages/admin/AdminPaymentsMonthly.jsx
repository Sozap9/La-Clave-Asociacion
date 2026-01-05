import { useState, useEffect } from 'react';
import { TrendingUp, Calendar, DollarSign, Download } from 'lucide-react';
import Loader from '../../components/common/Loader';

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
      const response = await fetch('http://localhost:5000/api/admin/payments/monthly', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.message || 'Error al cargar datos mensuales');
      }
    } catch (err) {
      console.error('Error en fetchMonthlyData:', err);
      setError('Error de conexión');
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

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Ingresos Mensuales</h1>
        <p className="text-gray-400">Análisis de ingresos de los últimos 12 meses</p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {data && (
        <>
          {/* Stats principales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="text-green-400" size={24} />
                <p className="text-gray-400 text-sm">Mes Actual</p>
              </div>
              <p className="text-white text-3xl font-bold">
                {formatCurrency(data.current_month?.total_ingresos)}
              </p>
              <p className="text-gray-500 text-sm mt-1">
                {data.current_month?.total_pagos || 0} pago{data.current_month?.total_pagos !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="text-blue-400" size={24} />
                <p className="text-gray-400 text-sm">Mes Anterior</p>
              </div>
              <p className="text-white text-3xl font-bold">
                {formatCurrency(data.previous_month?.total_ingresos)}
              </p>
              <p className="text-gray-500 text-sm mt-1">
                {data.previous_month?.total_pagos || 0} pago{data.previous_month?.total_pagos !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className={calculateChange() >= 0 ? 'text-green-400' : 'text-red-400'} size={24} />
                <p className="text-gray-400 text-sm">Variación</p>
              </div>
              <p className={`text-3xl font-bold ${calculateChange() >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {calculateChange() >= 0 ? '+' : ''}{calculateChange()}%
              </p>
              <p className="text-gray-500 text-sm mt-1">vs mes anterior</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="text-primary-400" size={24} />
                <p className="text-gray-400 text-sm">Total 12 Meses</p>
              </div>
              <p className="text-white text-3xl font-bold">
                {formatCurrency(data.monthly_data?.reduce((sum, m) => sum + (m.total_ingresos || 0), 0))}
              </p>
              <p className="text-gray-500 text-sm mt-1">Último año</p>
            </div>
          </div>

          {/* Gráfica de barras simple */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Evolución Mensual</h2>
              <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm transition-colors flex items-center gap-2">
                <Download size={16} />
                Exportar
              </button>
            </div>

            <div className="space-y-4">
              {data.monthly_data?.map((month, index) => {
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
                    <div className="w-full bg-gray-800 rounded-full h-8 overflow-hidden">
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
          </div>

          {/* Desglose por tipo de pago */}
          {data.by_payment_type && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Desglose por Tipo de Pago</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.by_payment_type.map((type, index) => (
                  <div key={index} className="bg-gray-800 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-1">
                      {type.tipo_pago?.replace('_', ' ') || 'Otros'}
                    </p>
                    <p className="text-white text-2xl font-bold mb-1">
                      {formatCurrency(type.total_ingresos)}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {type.total_pagos} transacción{type.total_pagos !== 1 ? 'es' : ''}
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
