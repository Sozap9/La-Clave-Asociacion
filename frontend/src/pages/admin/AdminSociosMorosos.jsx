import { useState, useEffect } from 'react';
import { getSociosMorosos, sendReminderSocio, suspendSocio, deleteSocio } from '../../api/adminApi';
import { Users, Mail, Ban, Clock, DollarSign, UserX, Phone, Calendar, AlertTriangle, X, Eye } from 'lucide-react';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import FilterBar from '../../components/UI/FilterBar';
import SearchInput from '../../components/UI/SearchInput';
import AdminCard from '../../components/admin/AdminCard';

// Filtros de severidad disponibles
const severityFilters = [
  { value: 'all', label: 'Todos' },
  { value: 'leve', label: 'Leve (< 15 días)' },
  { value: 'moderado', label: 'Moderado (15-29 días)' },
  { value: 'grave', label: 'Grave (≥ 30 días)' }
];

const AdminSociosMorosos = () => {
  const [morosos, setMorosos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [selectedSocio, setSelectedSocio] = useState(null);

  useEffect(() => {
    fetchMorosos();
    // eslint-disable-next-line
  }, [severityFilter, search]);

  const fetchMorosos = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      
      // Aplicar filtro de severidad
      if (severityFilter && severityFilter !== 'all') {
        params.severidad = severityFilter;
      }
      
      // Aplicar búsqueda
      if (search) {
        params.search = search;
      }

      const result = await getSociosMorosos(params);
      
      if (result.success) {
        const morosasData = result.data || [];
        
        // FILTRAR SOLO socios con estado 'moroso' o con días de morosidad > 0
        const soloMorosos = morosasData.filter(socio => 
          socio.estado === 'moroso' || 
          (socio.dias_morosidad && socio.dias_morosidad > 0)
        );
        
        setMorosos(Array.isArray(soloMorosos) ? soloMorosos : []);
      } else {
        setError(result.message || 'Error al cargar socios morosos');
        setMorosos([]);
      }
    } catch (err) {
      console.error('Error en fetchMorosos:', err);
      setError('Error de conexión');
      setMorosos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async (socioId) => {
    setError('');
    setSuccess('');
    try {
      const result = await sendReminderSocio(socioId);
      if (result.success) {
        setSuccess('Recordatorio enviado exitosamente');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message || 'Error al enviar recordatorio');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error al enviar recordatorio');
    }
  };

  const handleSuspend = async (socioId) => {
    if (!confirm('¿Estás seguro de suspender a este socio?')) return;
    
    setError('');
    setSuccess('');
    try {
      const result = await suspendSocio(socioId);
      if (result.success) {
        setSuccess('Socio suspendido exitosamente');
        setTimeout(() => setSuccess(''), 3000);
        fetchMorosos();
      } else {
        setError(result.message || 'Error al suspender socio');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error al suspender socio');
    }
  };

  const handleDarDeBaja = async (socioId) => {
    if (!confirm('¿Estás seguro de dar de baja a este socio? Esta acción cancelará sus reservas activas.')) return;
    
    setError('');
    setSuccess('');
    try {
      const result = await deleteSocio(socioId);
      if (result.success) {
        setSuccess('Socio dado de baja exitosamente');
        setTimeout(() => setSuccess(''), 3000);
        fetchMorosos();
      } else {
        setError(result.message || 'Error al dar de baja al socio');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error al dar de baja al socio');
    }
  };

  const getSeverity = (dias) => {
    if (!dias) dias = 0;
    
    if (dias >= 30) {
      return {
        label: 'Grave',
        color: 'red'
      };
    } else if (dias >= 15) {
      return {
        label: 'Moderado',
        color: 'yellow'
      };
    } else {
      return {
        label: 'Leve',
        color: 'blue'
      };
    }
  };

  const getBorderColor = (dias) => {
    if (dias >= 30) return 'border-l-red-500';
    if (dias >= 15) return 'border-l-yellow-500';
    return 'border-l-blue-500';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin pagos';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0,00€';
    return parseFloat(amount).toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + '€';
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-8 bg-black min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-gradient mb-2 text-4xl">Socios Morosos</h1>
        <p className="text-gray-200 text-lg">
          Gestiona los socios con pagos de cuota pendientes
        </p>
        <p className="text-gray-400 text-lg">
          {morosos.length} socio{morosos.length !== 1 ? 's' : ''} con deuda{morosos.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <Alert type="error" message={error} onClose={() => setError('')} />
      )}
      {success && (
        <Alert type="success" message={success} onClose={() => setSuccess('')} />
      )}

      {/* Filtros y búsqueda */}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        {/* Filtros de severidad */}
        <FilterBar
          customFilters={severityFilters}
          activeFilter={severityFilter}
          onFilterChange={setSeverityFilter}
        />
        
        {/* Búsqueda */}
        <div className="flex-1 max-w-md ml-auto">
          <SearchInput
            value={search}
            onChange={setSearch}
            onClear={() => setSearch('')}
            placeholder="Buscar por nombre, email, número de socio..."
            debounceMs={350}
          />
        </div>
      </div>

      {/* Lista de morosos */}
      {morosos.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-12 text-center">
          <AlertTriangle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">
            {search || severityFilter !== 'all'
              ? 'No se encontraron socios con los filtros aplicados'
              : '¡Excelente! No hay socios con pagos pendientes'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {morosos.map((socio) => {
            const severity = getSeverity(socio.dias_morosidad);
            const borderColor = getBorderColor(socio.dias_morosidad);
            
            return (
              <AdminCard
                key={socio.id || socio.user_id}
                avatar={
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {socio.nombre?.charAt(0).toUpperCase() || socio.username?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                }
                title={
                  socio.nombre && socio.apellidos
                    ? `${socio.nombre} ${socio.apellidos}`
                    : socio.username || 'Sin nombre'
                }
                subtitle={socio.numero_socio ? `Socio #${socio.numero_socio}` : 'Sin número de socio'}
                badges={[
                  {
                    text: severity.label,
                    color: severity.color,
                    icon: <AlertTriangle size={14} />
                  }
                ]}
                actions={[
                  {
                    icon: <Eye size={20} />,
                    onClick: () => setSelectedSocio(socio),
                    color: 'primary',
                    title: 'Ver detalles'
                  },
                  {
                    icon: <Mail size={20} />,
                    onClick: () => handleSendReminder(socio.id || socio.user_id),
                    color: 'primary',
                    title: 'Enviar recordatorio'
                  },
                  {
                    icon: <UserX size={20} />,
                    onClick: () => handleDarDeBaja(socio.id || socio.user_id),
                    color: 'red',
                    title: 'Dar de baja'
                  },
                  socio.dias_morosidad >= 30 && {
                    icon: <Ban size={20} />,
                    onClick: () => handleSuspend(socio.id || socio.user_id),
                    color: 'red',
                    title: 'Suspender'
                  }
                ].filter(Boolean)}
                fields={[
                  {
                    label: 'Días morosidad',
                    icon: <Clock size={14} className="text-primary-300" />,
                    value: socio.dias_morosidad 
                      ? `${socio.dias_morosidad} día${socio.dias_morosidad !== 1 ? 's' : ''}`
                      : 'N/A'
                  },
                  {
                    label: 'Deuda',
                    icon: <DollarSign size={14} className="text-primary-300" />,
                    value: formatCurrency(socio.deuda_pendiente)
                  },
                  {
                    label: 'Teléfono',
                    icon: <Phone size={14} className="text-primary-300" />,
                    value: socio.telefono || 'No disponible'
                  },
                  {
                    label: 'Último pago',
                    icon: <Calendar size={14} className="text-primary-300" />,
                    value: formatDate(socio.ultimo_pago)
                  }
                ]}
                columns={4}
                highlight={socio.dias_morosidad >= 30}
                className={`border-l-4 ${borderColor}`}
              />
            );
          })}
        </div>
      )}

      {/* Modal de detalles */}
      {selectedSocio && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedSocio(null)}
        >
          <div 
            className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className={`w-8 h-8 ${
                  selectedSocio.dias_morosidad >= 30 ? 'text-red-400' :
                  selectedSocio.dias_morosidad >= 15 ? 'text-yellow-400' :
                  'text-blue-400'
                }`} />
                <h2 className="text-2xl font-bold text-white">Detalles del Socio Moroso</h2>
              </div>
              <button
                onClick={() => setSelectedSocio(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-gray-500 text-sm">Nombre completo</p>
                <p className="text-white text-lg">
                  {selectedSocio.nombre && selectedSocio.apellidos
                    ? `${selectedSocio.nombre} ${selectedSocio.apellidos}`
                    : selectedSocio.username || 'Sin nombre'}
                </p>
              </div>

              <div>
                <p className="text-gray-500 text-sm">Número de Socio</p>
                <p className="text-white font-mono">{selectedSocio.numero_socio || 'N/A'}</p>
              </div>

              <div>
                <p className="text-gray-500 text-sm">Email</p>
                <p className="text-white">{selectedSocio.email || 'No disponible'}</p>
              </div>

              {selectedSocio.telefono && (
                <div>
                  <p className="text-gray-500 text-sm">Teléfono</p>
                  <p className="text-white">{selectedSocio.telefono}</p>
                </div>
              )}

              <div className="border-t border-[#262626] pt-4">
                <p className="text-gray-500 text-sm mb-3">Información de Deuda</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Días de morosidad</p>
                    <p className="text-white font-bold text-2xl">
                      {selectedSocio.dias_morosidad || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Deuda pendiente</p>
                    <p className="text-red-400 font-bold text-2xl">
                      {formatCurrency(selectedSocio.deuda_pendiente)}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-gray-400 text-xs mb-1">Último pago realizado</p>
                  <p className="text-white">
                    {formatDate(selectedSocio.ultimo_pago)}
                  </p>
                </div>

                <div className="mt-4">
                  <p className="text-gray-400 text-xs mb-1">Severidad</p>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                    selectedSocio.dias_morosidad >= 30 ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    selectedSocio.dias_morosidad >= 15 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                    'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}>
                    <AlertTriangle size={14} />
                    {getSeverity(selectedSocio.dias_morosidad).label}
                  </span>
                </div>
              </div>

              {/* Acciones en modal */}
              <div className="border-t border-[#262626] pt-4 flex gap-2 flex-wrap">
                <button
                  onClick={() => {
                    handleSendReminder(selectedSocio.id || selectedSocio.user_id);
                    setSelectedSocio(null);
                  }}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
                >
                  <Mail size={16} />
                  Enviar Recordatorio
                </button>

                <button
                  onClick={() => {
                    handleDarDeBaja(selectedSocio.id || selectedSocio.user_id);
                    setSelectedSocio(null);
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
                >
                  <UserX size={16} />
                  Dar de Baja
                </button>

                {selectedSocio.dias_morosidad >= 30 && (
                  <button
                    onClick={() => {
                      handleSuspend(selectedSocio.id || selectedSocio.user_id);
                      setSelectedSocio(null);
                    }}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
                  >
                    <Ban size={16} />
                    Suspender
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSociosMorosos;