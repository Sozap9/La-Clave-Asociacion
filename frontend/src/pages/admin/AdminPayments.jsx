import { useState, useEffect } from 'react';
import { CreditCard, Search, X, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import Loader from '../../components/common/Loader';

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('all');

  useEffect(() => {
    fetchPayments();
    fetchStats();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/payments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      
      if (result.success) {
        setPayments(result.data.items || result.data || []);
      } else {
        setError(result.message || 'Error al cargar pagos');
        setPayments([]);
      }
    } catch (err) {
      console.error('Error en fetchPayments:', err);
      setError('Error de conexión');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/payments/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      
      if (result.success) {
        setStats(result.data);
      }
    } catch (err) {
      console.error('Error en fetchStats:', err);
    }
  };

  const filteredPayments = Array.isArray(payments) ? payments.filter(payment => {
    // Filtro por estado
    if (filterEstado !== 'all' && payment.estado !== filterEstado) return false;
    
    // Búsqueda
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        payment.stripe_payment_id?.toLowerCase().includes(searchLower) ||
        payment.usuario_nombre?.toLowerCase().includes(searchLower) ||
        payment.usuario_email?.toLowerCase().includes(searchLower) ||
        payment.tipo_pago?.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  }) : [];

  const getEstadoBadge = (estado) => {
    const styles = {
      completado: 'bg-green-500/20 text-green-400',
      pendiente: 'bg-yellow-500/20 text-yellow-400',
      fallido: 'bg-red-500/20 text-red-400',
      reembolsado: 'bg-blue-500/20 text-blue-400'
    };
    return styles[estado] || styles.completado;
  };

  const getTipoPagoBadge = (tipo) => {
    const labels = {
      cuota_socio: 'Cuota Socio',
      entrada_evento: 'Entrada Evento',
      renovacion: 'Renovación'
    };
    return (
      <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary-500/20 text-primary-300 border border-primary-500/30">
        {labels[tipo] || tipo}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-8 bg-black min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-gradient mb-2 text-4xl">Gestión de Pagos</h1>
        <p className="text-gray-400 text-lg">
          {Array.isArray(payments) ? `${payments.length} pago${payments.length !== 1 ? 's' : ''} registrado${payments.length !== 1 ? 's' : ''}` : 'Administra transacciones y pagos'}
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
              <p className="text-gray-400 text-sm">Pagos Completados</p>
            </div>
            <p className="text-primary-300 text-2xl font-bold">{stats.pagos_completados || 0}</p>
          </div>
          
          <div className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-6 hover:border-primary-500/50 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="text-primary-300" size={24} />
              <p className="text-gray-400 text-sm">Pagos Pendientes</p>
            </div>
            <p className="text-primary-300 text-2xl font-bold">{stats.pagos_pendientes || 0}</p>
          </div>
        </div>
      )}

      {/* Filtros y Búsqueda */}
      <div className="mb-6 space-y-4">
        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por ID Stripe, nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#262626] border border-[#333333] rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Filtros por estado */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setFilterEstado('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filterEstado === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-[#262626] text-gray-400 hover:bg-[#333333]'
            }`}
          >
            Todos ({payments.length})
          </button>
          <button
            onClick={() => setFilterEstado('completado')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filterEstado === 'completado'
                ? 'bg-primary-600 text-white'
                : 'bg-[#262626] text-gray-400 hover:bg-[#333333]'
            }`}
          >
            Completados ({payments.filter(p => p.estado === 'completado').length})
          </button>
          <button
            onClick={() => setFilterEstado('pendiente')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filterEstado === 'pendiente'
                ? 'bg-primary-600 text-white'
                : 'bg-[#262626] text-gray-400 hover:bg-[#333333]'
            }`}
          >
            Pendientes ({payments.filter(p => p.estado === 'pendiente').length})
          </button>
          <button
            onClick={() => setFilterEstado('fallido')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filterEstado === 'fallido'
                ? 'bg-primary-600 text-white'
                : 'bg-[#262626] text-gray-400 hover:bg-[#333333]'
            }`}
          >
            Fallidos ({payments.filter(p => p.estado === 'fallido').length})
          </button>
        </div>
      </div>

      {/* Lista de pagos */}
      {filteredPayments.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-12 text-center">
          <CreditCard className="mx-auto mb-4 text-gray-600" size={48} />
          <p className="text-gray-400 text-lg">
            {search ? 'No se encontraron pagos' : 'No hay pagos registrados'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPayments.map((payment) => (
            <div
              key={payment.id}
              className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6 hover:border-primary-500/50 transition-all"
            >
              <div className="flex items-start justify-between">
                {/* Info del pago */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <CreditCard className="text-primary-400" size={24} />
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {formatCurrency(payment.amount)}
                      </h3>
                      <p className="text-gray-400 text-sm font-mono">
                        {payment.stripe_payment_id || `Pago #${payment.id}`}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Usuario</p>
                      <p className="text-white text-sm">
                        {payment.usuario_nombre || payment.usuario_email || 'N/A'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Tipo de Pago</p>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTipoPagoBadge(payment.tipo_pago)}`}>
                        {payment.tipo_pago?.replace('_', ' ') || 'N/A'}
                      </span>
                    </div>
                    
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Estado</p>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoBadge(payment.estado)}`}>
                        {payment.estado}
                      </span>
                    </div>
                    
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Fecha</p>
                      <p className="text-white text-sm">{formatDate(payment.fecha_pago || payment.created_at)}</p>
                    </div>
                  </div>

                  {payment.descripcion && (
                    <div className="mt-3">
                      <p className="text-gray-400 text-sm">{payment.descripcion}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPayments;