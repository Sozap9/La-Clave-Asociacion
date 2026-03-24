import { useState, useEffect } from 'react';
import { CreditCard, Eye, Send, Ban, CheckCircle, X, TrendingUp, DollarSign, Calendar, User, Mail } from 'lucide-react';
import Loader from '../../components/common/Loader';
import SearchInput from '../../components/UI/SearchInput';
import FilterBar from '../../components/UI/FilterBar';
import Button from '../../components/common/Button';
import AdminCard from '../../components/admin/AdminCard';

const API_URL = import.meta.env.VITE_API_URL;

// Filtros de estado 
const estadoFilters = [
  { value: 'all', label: 'Todos' },
  { value: 'completado', label: 'Completados' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'fallido', label: 'Fallidos' },
  { value: 'reembolsado', label: 'Reembolsados' },
];

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState(null);

  useEffect(() => {
    fetchPayments();
    if (!stats) fetchStats();
    // eslint-disable-next-line
  }, [estadoFilter, search]);

  const fetchPayments = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (estadoFilter && estadoFilter !== 'all') params.append('estado', estadoFilter);
      if (search.trim()) params.append('search', search.trim());

      const url = `${API_URL}/admin/payments?${params.toString()}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();
      if (result.success) {
        const items = result.data?.items || result.data || [];
        setPayments(Array.isArray(items) ? items : []);
      } else {
        setError(result.message || 'Error al cargar pagos');
        setPayments([]);
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('${API_URL}/admin/payments/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch (err) {
      console.error('Error stats:', err);
    }
  };

  const handleSendReminder = async (paymentId) => {
    if (!window.confirm('¿Enviar recordatorio de pago?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/admin/payments/${paymentId}/reminder`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await res.json();
      if (result.success) {
        alert('Recordatorio enviado');
      } else {
        alert(result.message || 'Error al enviar recordatorio');
      }
    } catch (err) {
      alert('Error de conexión');
    }
  };

  const handleToggleUserActive = async (userId, isActive) => {
    const action = isActive ? 'desactivar' : 'activar';
    if (!window.confirm(`¿${action} este usuario?`)) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/admin/users/${userId}/toggle-active`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ activo: !isActive }),
      });

      const result = await res.json();
      if (result.success) {
        alert(`Usuario ${action}do`);
        fetchPayments();
      } else {
        alert(result.message || `Error al ${action} usuario`);
      }
    } catch (err) {
      alert('Error de conexión');
    }
  };

  const getEstadoBadgeColor = (estado) => {
    const map = {
      completado: 'green',
      pendiente: 'yellow',
      fallido: 'red',
      reembolsado: 'blue',
    };
    return map[estado?.toLowerCase()] || 'gray';
  };

  const getTipoPagoLabel = (tipo) => {
    const label = {
      cuota_socio: 'Cuota Socio',
      cuota_mensual: 'Cuota Mensual',
      entrada_evento: 'Entrada Evento',
      renovacion: 'Renovación',
    }[tipo] || tipo?.replace('_', ' ') || '—';
    
    return label;
  };

  const getTipoPagoBadgeColor = (tipo) => {
    const colors = {
      cuota_socio: 'primary',
      cuota_mensual: 'blue',
      entrada_evento: 'purple',
      renovacion: 'green',
    };
    return colors[tipo] || 'gray';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0,00€';
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(amount);
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-8 bg-black min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-gradient mb-2 text-4xl">Gestión de Pagos</h1>
        <p className="text-gray-200 text-lg">
          Administra todos los pagos del sistema
        </p>
        <p className="text-gray-400 text-lg">
          {payments.length} pago{payments.length !== 1 ? 's' : ''} registrado{payments.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-6 hover:border-primary-500/50 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="text-primary-300" size={24} />
              <p className="text-gray-400 text-sm">Ingresos Totales</p>
            </div>
            <p className="text-primary-300 text-2xl font-bold">{formatCurrency(stats.total_ingresos)}</p>
          </div>

          <div className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-6 hover:border-primary-500/50 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="text-primary-300" size={24} />
              <p className="text-gray-400 text-sm">Este Mes</p>
            </div>
            <p className="text-primary-300 text-2xl font-bold">{formatCurrency(stats.ingresos_mes_actual)}</p>
          </div>

          <div className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-6 hover:border-primary-500/50 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <CreditCard className="text-primary-300" size={24} />
              <p className="text-gray-400 text-sm">Completados</p>
            </div>
            <p className="text-primary-300 text-2xl font-bold">{stats.pagos_completados || 0}</p>
          </div>

          <div className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-6 hover:border-primary-500/50 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="text-primary-300" size={24} />
              <p className="text-gray-400 text-sm">Pendientes</p>
            </div>
            <p className="text-primary-300 text-2xl font-bold">{stats.pagos_pendientes || 0}</p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <FilterBar
          customFilters={estadoFilters}
          activeFilter={estadoFilter}
          onFilterChange={setEstadoFilter}
        />
        <div className="flex-1 max-w-md ml-auto">
          <SearchInput
            value={search}
            onChange={setSearch}
            onClear={() => setSearch('')}
            placeholder="Buscar por nombre, email, ID pago..."
            debounceMs={350}
          />
        </div>
      </div>

      {/* Lista */}
      {payments.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-12 text-center">
          <CreditCard className="mx-auto mb-4 text-gray-600" size={48} />
          <p className="text-gray-400 text-lg">
            {search || estadoFilter !== 'all' ? 'No se encontraron pagos' : 'No hay pagos registrados'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <AdminCard
              key={payment.id || payment.stripe_payment_id}
              avatar={
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center">
                  <CreditCard className="text-white" size={24} />
                </div>
              }
              title={formatCurrency(payment.amount)}
              subtitle={payment.stripe_payment_id 
                ? `ID: ${payment.stripe_payment_id.slice(0, 20)}...` 
                : `Pago #${payment.id || 'N/A'}`
              }
              badges={[
                {
                  text: payment.estado || 'Sin estado',
                  color: getEstadoBadgeColor(payment.estado)
                },
                {
                  text: getTipoPagoLabel(payment.tipo_pago),
                  color: getTipoPagoBadgeColor(payment.tipo_pago)
                }
              ].filter(Boolean)}
              actions={[
                {
                  icon: <Eye size={20} />,
                  onClick: () => setSelectedPayment(payment),
                  color: 'primary',
                  title: 'Ver detalles'
                },
                payment.estado?.toLowerCase() === 'pendiente' && {
                  icon: <Mail size={20} />,
                  onClick: () => handleSendReminder(payment.id),
                  color: 'primary',
                  title: 'Enviar recordatorio'
                },
                payment.user_id && {
                  icon: payment.usuario_activo ? <Ban size={20} /> : <CheckCircle size={20} />,
                  onClick: () => handleToggleUserActive(payment.user_id, payment.usuario_activo),
                  color: payment.usuario_activo ? 'red' : 'green',
                  title: payment.usuario_activo ? 'Desactivar usuario' : 'Activar usuario'
                }
              ].filter(Boolean)}
              
            >
              {payment.descripcion && (
                <div className="mt-3 text-gray-400 text-sm">
                  {payment.descripcion}
                </div>
              )}
            </AdminCard>
          ))}
        </div>
      )}

      {/* Modal de detalles */}
      {selectedPayment && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPayment(null)}
        >
          <div
            className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Detalles del Pago</h2>
              <button onClick={() => setSelectedPayment(null)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-500 text-sm">Cantidad</p>
                  <p className="text-2xl font-bold text-primary-300">{formatCurrency(selectedPayment.amount)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Estado</p>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                    selectedPayment.estado?.toLowerCase() === 'completado' ? 'bg-green-500/20 text-green-400' :
                    selectedPayment.estado?.toLowerCase() === 'pendiente' ? 'bg-yellow-500/20 text-yellow-400' :
                    selectedPayment.estado?.toLowerCase() === 'fallido' ? 'bg-red-500/20 text-red-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {selectedPayment.estado || 'Sin estado'}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-gray-500 text-sm">Tipo de pago</p>
                <p className="text-white mt-1">{getTipoPagoLabel(selectedPayment.tipo_pago)}</p>
              </div>

              <div>
                <p className="text-gray-500 text-sm">Usuario</p>
                <p className="text-white mt-1">
                  {selectedPayment.usuario_nombre || 'No disponible'}
                  {selectedPayment.usuario_email && ` (${selectedPayment.usuario_email})`}
                </p>
              </div>

              <div>
                <p className="text-gray-500 text-sm">Fecha</p>
                <p className="text-white mt-1">{formatDateTime(selectedPayment.fecha_pago || selectedPayment.created_at)}</p>
              </div>

              {selectedPayment.stripe_payment_id && (
                <div>
                  <p className="text-gray-500 text-sm">ID de Stripe</p>
                  <p className="text-white font-mono text-sm break-all mt-1">{selectedPayment.stripe_payment_id}</p>
                </div>
              )}

              {selectedPayment.descripcion && (
                <div>
                  <p className="text-gray-500 text-sm">Descripción</p>
                  <p className="text-white mt-1">{selectedPayment.descripcion}</p>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setSelectedPayment(null)}>
                Cerrar
              </Button>
              {selectedPayment.estado?.toLowerCase() === 'pendiente' && (
                <Button
                  variant="primary"
                  onClick={() => {
                    handleSendReminder(selectedPayment.id);
                    setSelectedPayment(null);
                  }}
                >
                  Enviar Recordatorio
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayments;