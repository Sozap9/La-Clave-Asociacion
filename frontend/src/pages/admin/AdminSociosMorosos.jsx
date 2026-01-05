import { useState, useEffect } from 'react';
import { getSociosMorosos, sendReminderSocio, suspendSocio } from '../../api/adminApi';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import { AlertTriangle, Mail, Ban, Clock } from 'lucide-react';

const AdminSociosMorosos = () => {
  const [morosos, setMorosos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

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

  const handleSendReminder = async (socioId) => {
    setActionLoading(`reminder-${socioId}`);
    setError('');
    setSuccess('');
    try {
      const result = await sendReminderSocio(socioId);
      if (result.success) {
        setSuccess('Recordatorio enviado exitosamente');
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

  const handleSuspend = async (socioId) => {
    if (!confirm('¿Estás seguro de suspender a este socio?')) return;
    
    setActionLoading(`suspend-${socioId}`);
    setError('');
    setSuccess('');
    try {
      const result = await suspendSocio(socioId);
      if (result.success) {
        setSuccess('Socio suspendido exitosamente');
        fetchMorosos(); // Recargar lista
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

  const getSeverity = (dias) => {
    if (dias >= 30) return { color: 'red', label: 'Grave', icon: '🔴' };
    if (dias >= 15) return { color: 'orange', label: 'Moderado', icon: '🟠' };
    return { color: 'yellow', label: 'Leve', icon: '🟡' };
  };

  if (loading) return <Loader fullScreen />;

  const totalDeuda = morosos.reduce((sum, s) => sum + (s.deuda_pendiente || 0), 0);
  const graves = morosos.filter(s => s.dias_morosidad >= 30).length;
  const moderados = morosos.filter(s => s.dias_morosidad >= 15 && s.dias_morosidad < 30).length;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
          <AlertTriangle className="w-10 h-10 text-red-400" />
          Socios Morosos
        </h1>
        <p className="text-gray-400">{morosos.length} socios con pagos pendientes</p>
      </div>

      {/* Alertas */}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Deuda Total"
          value={`${totalDeuda.toFixed(2)}€`}
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          title="Graves (>30 días)"
          value={graves}
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          title="Moderados (15-29 días)"
          value={moderados}
          icon={AlertTriangle}
          color="orange"
        />
        <StatCard
          title="Leves (<15 días)"
          value={morosos.length - graves - moderados}
          icon={Clock}
          color="yellow"
        />
      </div>

      {/* Lista de morosos */}
      {morosos.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
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
                className={`bg-gray-900 border-l-4 border-${severity.color}-500 rounded-xl p-6`}
              >
                <div className="flex items-start justify-between">
                  {/* Info del socio */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{severity.icon}</span>
                      <div>
                        <h3 className="text-xl font-semibold text-white">
                          {socio.nombre} {socio.apellidos}
                        </h3>
                        <p className="text-gray-400 text-sm">
                          Socio #{socio.numero_socio} • {socio.email}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div>
                        <p className="text-gray-400 text-sm">Días de morosidad</p>
                        <p className={`text-${severity.color}-400 font-bold text-lg`}>
                          {socio.dias_morosidad} días
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Estado</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium bg-${severity.color}-500/20 text-${severity.color}-400`}>
                          {severity.label}
                        </span>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Teléfono</p>
                        <p className="text-white">{socio.telefono || 'No disponible'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-col gap-2 ml-6">
                    <button
                      onClick={() => handleSendReminder(socio.id)}
                      disabled={actionLoading === `reminder-${socio.id}`}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                      {actionLoading === `reminder-${socio.id}` ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4" />
                          Enviar Recordatorio
                        </>
                      )}
                    </button>

                    {socio.dias_morosidad >= 30 && (
                      <button
                        onClick={() => handleSuspend(socio.id)}
                        disabled={actionLoading === `suspend-${socio.id}`}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                      >
                        {actionLoading === `suspend-${socio.id}` ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Suspendiendo...
                          </>
                        ) : (
                          <>
                            <Ban className="w-4 h-4" />
                            Suspender Socio
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
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
    <div className="flex items-start justify-between mb-4">
      <div>
        <p className="text-gray-400 text-sm mb-1">{title}</p>
        <p className="text-white text-3xl font-bold">{value}</p>
      </div>
      <Icon className={`w-8 h-8 text-${color}-400`} />
    </div>
  </div>
);

export default AdminSociosMorosos;
