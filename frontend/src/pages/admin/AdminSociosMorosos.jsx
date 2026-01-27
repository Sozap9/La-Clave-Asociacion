import { useState, useEffect } from 'react';
import { getSociosMorosos, sendReminderSocio, suspendSocio, deleteSocio } from '../../api/adminApi';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import { AlertTriangle, Mail, Ban, Clock, TrendingDown, DollarSign, X, UserX} from 'lucide-react';

const AdminSociosMorosos = () => {
  const [morosos, setMorosos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedSocio, setSelectedSocio] = useState(null);

  useEffect(() => {
    fetchMorosos();
  }, []);

  const fetchMorosos = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getSociosMorosos();
      if (result.success) {
        setMorosos(result.data || []);
      } else {
        setError(result.message || 'Error al cargar socios morosos');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('No se pudieron cargar los socios morosos. Verifica la conexión con el backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async (socioId, e) => {
    e.stopPropagation();
    setActionLoading(`reminder-${socioId}`);
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
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspend = async (socioId, e) => {
    e.stopPropagation();
    if (!confirm('¿Estás seguro de suspender a este socio?')) return;
    
    setActionLoading(`suspend-${socioId}`);
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
    } finally {
      setActionLoading(null);
    }
  };

  const handleDarDeBaja = async (socioId, e) => {
    e.stopPropagation();
    if (!confirm('¿Estás seguro de dar de baja a este socio? Esta acción cancelará sus reservas activas.')) return;
    
    setActionLoading(`baja-${socioId}`);
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
    } finally {
      setActionLoading(null);
    }
  };

  const getSeverity = (dias) => {
    if (dias >= 30) return { 
      color: 'red', 
      label: 'Grave', 
      bgClass: 'bg-red-500/20',
      textClass: 'text-red-400',
      borderClass: 'bg-red-500'
    };
    if (dias >= 15) return { 
      color: 'orange', 
      label: 'Moderado', 
      bgClass: 'bg-orange-500/20',
      textClass: 'text-orange-400',
      borderClass: 'bg-orange-500'
    };
    return { 
      color: 'yellow', 
      label: 'Leve', 
      bgClass: 'bg-yellow-500/20',
      textClass: 'text-yellow-400',
      borderClass: 'bg-yellow-500'
    };
  };

  if (loading) return <Loader fullScreen />;

  const totalDeuda = morosos.reduce((sum, s) => sum + (s.deuda_pendiente || 0), 0);
  const graves = morosos.filter(s => s.dias_morosidad >= 30).length;
  const moderados = morosos.filter(s => s.dias_morosidad >= 15 && s.dias_morosidad < 30).length;
  const leves = morosos.length - graves - moderados;

  return (
    <div className="p-8 bg-black min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle className="w-10 h-10 text-primary-300" />
          <h1 className="text-gradient text-4xl">Socios Morosos</h1>
        </div>
        <p className="text-gray-400 text-lg">
          {morosos.length} socio{morosos.length !== 1 ? 's' : ''} con pago{morosos.length !== 1 ? 's' : ''} pendiente{morosos.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Alertas */}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Deuda Total"
          value={`${totalDeuda.toFixed(2)}€`}
          icon={DollarSign}
          iconColor="text-primary-300"
        />
        <StatCard
          title="Graves (≥30 días)"
          value={graves}
          icon={AlertTriangle}
          iconColor="text-primary-300"
        />
        <StatCard
          title="Moderados (15-29 días)"
          value={moderados}
          icon={TrendingDown}
          iconColor="text-primary-300"
        />
        <StatCard
          title="Leves (<15 días)"
          value={leves}
          icon={Clock}
          iconColor="text-primary-300"
        />
      </div>

      {/* Lista */}
      {morosos.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-12 text-center">
          <AlertTriangle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">¡Excelente! No hay socios con pagos pendientes</p>
        </div>
      ) : (
        <div className="space-y-4">
          {morosos.map((socio) => {
            const severity = getSeverity(socio.dias_morosidad);
            return (
              <div
                key={socio.id}
                onClick={() => setSelectedSocio(socio)}
                className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6 hover:border-primary-500/50 transition-all cursor-pointer relative overflow-hidden"
              >
                {/* Barra lateral de color */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${severity.borderClass}`}></div>
                
                <div className="flex items-start justify-between pl-4">
                  {/* Info del socio */}
                  <div className="flex-1">
                    {/* Avatar y nombre */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {socio.nombre?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold text-white">
                            {socio.nombre} {socio.apellidos}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${severity.bgClass} ${severity.textClass} border ${severity.borderClass}`}>
                            {severity.label}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm">
                          Socio #{socio.numero_socio} • {socio.email}
                        </p>
                      </div>
                    </div>

                    {/* Grid de información */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Días de morosidad</p>
                        <p className="text-white font-bold text-lg">
                          {socio.dias_morosidad} día{socio.dias_morosidad !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Deuda pendiente</p>
                        <p className="text-white font-semibold text-lg">
                          {(socio.deuda_pendiente || 0).toFixed(2)}€
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Teléfono</p>
                        <p className="text-white text-sm">{socio.telefono || 'No disponible'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Último pago</p>
                        <p className="text-white text-sm">
                          {socio.ultimo_pago ? new Date(socio.ultimo_pago).toLocaleDateString('es-ES') : 'Sin pagos'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-col gap-2 ml-6">
                    <button
                      onClick={(e) => handleSendReminder(socio.id, e)}
                      disabled={actionLoading === `reminder-${socio.id}`}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap text-sm"
                    >
                      {actionLoading === `reminder-${socio.id}` ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4" />
                          Enviar recordatorio
                        </>
                      )}
                    </button>

                    <button
                      onClick={(e) => handleDarDeBaja(socio.id, e)}
                      disabled={actionLoading === `baja-${socio.id}`}
                      className="px-4 py-2 bg-[#262626] hover:bg-[#333333] disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap text-sm"
                    >
                      {actionLoading === `baja-${socio.id}` ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Procesando...
                        </>
                      ) : (
                        <>
                          <UserX className="w-4 h-4" />
                          Dar de baja
                        </>
                      )}
                    </button>

                    {socio.dias_morosidad >= 30 && (
                      <button
                        onClick={(e) => handleSuspend(socio.id, e)}
                        disabled={actionLoading === `suspend-${socio.id}`}
                        className="px-4 py-2 bg-[#262626] hover:bg-[#333333] disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap text-sm"
                      >
                        {actionLoading === `suspend-${socio.id}` ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Suspendiendo...
                          </>
                        ) : (
                          <>
                            <Ban className="w-4 h-4" />
                            Suspender
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
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
              <h2 className="text-2xl font-bold text-white">Detalles del socio</h2>
              <button
                onClick={() => setSelectedSocio(null)}
                className="text-gray-400 hover:text-white transition-colors text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 text-sm mb-1">Nombre completo</p>
                  <p className="text-white text-lg">
                    {selectedSocio.nombre} {selectedSocio.apellidos}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm mb-1">Número de socio</p>
                  <p className="text-white font-mono">{selectedSocio.numero_socio}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 text-sm mb-1">Email</p>
                  <p className="text-white">{selectedSocio.email}</p>
                </div>
                {selectedSocio.telefono && (
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Teléfono</p>
                    <p className="text-white">{selectedSocio.telefono}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 text-sm mb-1">Días de morosidad</p>
                  <p className="text-white font-bold text-xl">
                    {selectedSocio.dias_morosidad} día{selectedSocio.dias_morosidad !== 1 ? 's' : ''}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm mb-1">Estado</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverity(selectedSocio.dias_morosidad).bgClass} ${getSeverity(selectedSocio.dias_morosidad).textClass}`}>
                    {getSeverity(selectedSocio.dias_morosidad).label}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 text-sm mb-1">Deuda pendiente</p>
                  <p className="text-white font-bold text-xl">
                    {(selectedSocio.deuda_pendiente || 0).toFixed(2)}€
                  </p>
                </div>
                {selectedSocio.cuota_mensual && (
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Cuota mensual</p>
                    <p className="text-white">{selectedSocio.cuota_mensual}€</p>
                  </div>
                )}
              </div>

              {selectedSocio.ultimo_pago && (
                <div>
                  <p className="text-gray-500 text-sm mb-1">Último pago</p>
                  <p className="text-white">
                    {new Date(selectedSocio.ultimo_pago).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              )}

              {selectedSocio.fecha_alta && (
                <div>
                  <p className="text-gray-500 text-sm mb-1">Fecha de alta</p>
                  <p className="text-white">
                    {new Date(selectedSocio.fecha_alta).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setSelectedSocio(null)}
                className="flex-1 px-4 py-2 bg-[#262626] hover:bg-[#333333] text-white rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, iconColor }) => (
  <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6 hover:border-primary-500/50 transition-all">
    <div className="flex items-start justify-between mb-4">
      <div>
        <p className="text-gray-400 text-sm mb-1">{title}</p>
        <p className="text-white text-3xl font-bold">{value}</p>
      </div>
      <Icon className={`w-8 h-8 ${iconColor}`} />
    </div>
  </div>
);

export default AdminSociosMorosos;