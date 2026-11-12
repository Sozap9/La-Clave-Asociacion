import { useState, useEffect } from 'react';
import { TrendingUp, Calendar, DollarSign, Download } from 'lucide-react';
import DatePicker, { registerLocale } from 'react-datepicker';
import es from 'date-fns/locale/es';
import 'react-datepicker/dist/react-datepicker.css';
import Loader from '../../components/common/Loader';
import { exportIngresosMensuales } from '../../api/adminApi';

registerLocale('es', es);

const API_URL = import.meta.env.VITE_API_URL;

const AdminPaymentsMonthly = () => {
  const [data,        setData]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [exporting,   setExporting]   = useState(false);
  const [exportError, setExportError] = useState('');

  // Mes a exportar, por defecto el actual
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchMonthlyData();
  }, []);

  const fetchMonthlyData = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/admin/payments/monthly`, {
        headers: { 'Authorization': `Bearer ${token}` },
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

  const handleExportPDF = async () => {
    setExporting(true);
    setExportError('');
    try {
      const year  = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1;
      await exportIngresosMensuales(year, month);
    } catch (err) {
      console.error('Error al exportar PDF:', err);
      setExportError('Error al generar el PDF. Inténtalo de nuevo.');
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount || 0);

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
    const current  = data.current_month.total_ingresos  || 0;
    const previous = data.previous_month.total_ingresos || 0;
    if (previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const selectedLabel = selectedDate.toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
  });

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
          {/* KPIs */}
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

          {/* Evolución mensual */}
          <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6 mb-8 hover:border-primary-500/50 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <h2 className="text-xl font-bold text-white">Evolucion Mensual</h2>

              {/* Mes y exportar */}
              <div className="flex items-center gap-2">
                <div className="month-year-picker-wrapper">
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date) => {
                      setSelectedDate(date);
                      setExportError('');
                    }}
                    locale="es"
                    dateFormat="MMMM yyyy"
                    showMonthYearPicker
                    showFourColumnMonthYearPicker
                    placeholderText="Seleccionar mes"
                    className="month-year-input"
                    popperPlacement="bottom-end"
                    showPopperArrow={false}
                  />
                </div>

                <button
                  onClick={handleExportPDF}
                  disabled={exporting}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  {exporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      Exportar PDF
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Error de exportación */}
            {exportError && (
              <div className="bg-red-500/20 border border-red-500 text-red-200 px-3 py-2 rounded-lg mb-4 text-sm">
                {exportError}
              </div>
            )}

            <p className="text-gray-500 text-xs mb-4 capitalize">
              El PDF se generará con los datos de{' '}
              <span className="text-primary-300 font-medium">{selectedLabel}</span>
            </p>

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

          {/* Desglose por tipo de pago */}
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

      {/* Estilos del selector de mes */}
      <style>{`
        .month-year-picker-wrapper .react-datepicker-wrapper,
        .month-year-picker-wrapper .react-datepicker__input-container {
          display: block;
        }
        .month-year-input {
          background: #262626;
          border: 1px solid #363636;
          color: #ffffff;
          border-radius: 0.5rem;
          padding: 0.375rem 0.75rem;
          font-size: 0.875rem;
          line-height: 1.5rem;
          outline: none;
          cursor: pointer;
          min-width: 140px;
          text-align: center;
          text-transform: capitalize;
        }
        .month-year-input:focus {
          border-color: #7c3aed;
        }
        .month-year-picker-wrapper .react-datepicker {
          background: #1a1a1a;
          border: 1px solid #262626;
          border-radius: 0.75rem;
          font-family: inherit;
          box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        }
        .month-year-picker-wrapper .react-datepicker__header {
          background: #0f0f0f;
          border-bottom: 1px solid #262626;
          border-radius: 0.75rem 0.75rem 0 0;
          padding: 0.75rem;
        }
        .month-year-picker-wrapper .react-datepicker__current-month,
        .month-year-picker-wrapper .react-datepicker-year-header {
          color: #ffffff;
          font-size: 0.875rem;
          font-weight: 600;
        }
        .month-year-picker-wrapper .react-datepicker__navigation-icon::before {
          border-color: #9ca3af;
        }
        .month-year-picker-wrapper .react-datepicker__navigation:hover .react-datepicker__navigation-icon::before {
          border-color: #ffffff;
        }
        .month-year-picker-wrapper .react-datepicker__month-wrapper {
          display: flex;
        }
        .month-year-picker-wrapper .react-datepicker__month-text {
          color: #d1d5db;
          border-radius: 0.375rem;
          padding: 0.4rem 0.5rem;
          margin: 2px;
          font-size: 0.8rem;
          text-transform: capitalize;
        }
        .month-year-picker-wrapper .react-datepicker__month-text:hover {
          background: #262626;
          color: #ffffff;
        }
        .month-year-picker-wrapper .react-datepicker__month-text--selected,
        .month-year-picker-wrapper .react-datepicker__month-text--keyboard-selected {
          background: #7c3aed !important;
          color: #ffffff !important;
        }
      `}</style>
    </div>
  );
};

export default AdminPaymentsMonthly;