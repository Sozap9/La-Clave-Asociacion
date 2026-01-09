import { useState, useEffect } from 'react';
import { getAllSocios, updateUserRole, approveUser, rejectUser } from '../../api/adminApi';
import { Users, CheckCircle, XCircle, Shield } from 'lucide-react';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';

const AdminSocios = () => {
  const [socios, setSocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, activo, moroso, cancelado, pendiente

  useEffect(() => {
    fetchSocios();
  }, []);

  const fetchSocios = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getAllSocios();
      
      if (result.success) {
        const sociosData = result.data?.socios || result.data || [];
        setSocios(Array.isArray(sociosData) ? sociosData : []);
      } else {
        setError(result.message || 'Error al cargar socios');
        setSocios([]);
      }
    } catch (err) {
      console.error('Error en fetchSocios:', err);
      setError('Error de conexión');
      setSocios([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    if (!confirm('¿Aprobar este usuario como socio?')) return;

    try {
      const result = await approveUser(userId);
      if (result.success) {
        fetchSocios();
      } else {
        alert(result.message || 'Error al aprobar usuario');
      }
    } catch (err) {
      alert('Error de conexión');
    }
  };

  const handleReject = async (userId) => {
    if (!confirm('¿Rechazar la solicitud de este usuario?')) return;

    try {
      const result = await rejectUser(userId);
      if (result.success) {
        fetchSocios();
      } else {
        alert(result.message || 'Error al rechazar usuario');
      }
    } catch (err) {
      alert('Error de conexión');
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    if (!confirm(`¿Cambiar el rol del usuario a ${newRole}?`)) return;

    try {
      const result = await updateUserRole(userId, newRole);
      if (result.success) {
        fetchSocios();
      } else {
        alert(result.message || 'Error al cambiar rol');
      }
    } catch (err) {
      alert('Error de conexión');
    }
  };

  const filteredSocios = Array.isArray(socios) ? socios.filter(socio => {
    if (filter === 'all') return true;
    return socio.estado === filter;
  }) : [];

  const getRoleBadge = (role) => {
    const styles = {
      admin: 'bg-red-500/20 text-red-400',
      socio: 'bg-primary-500/20 text-primary-400',
      basico: 'bg-gray-700 text-gray-400'
    };
    return styles[role] || styles.socio;
  };

  const getEstadoBadge = (estado) => {
    const styles = {
      activo: 'bg-green-500/20 text-green-400',
      pendiente: 'bg-yellow-500/20 text-yellow-400',
      moroso: 'bg-orange-500/20 text-orange-400',
      cancelado: 'bg-red-500/20 text-red-400'
    };
    return styles[estado] || styles.activo;
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Gestión de Socios</h1>
        <p className="text-gray-400">
          {Array.isArray(socios) ? `${socios.length} socio${socios.length !== 1 ? 's' : ''} registrado${socios.length !== 1 ? 's' : ''}` : 'Administra socios y aprobaciones'}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filter === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Todos ({Array.isArray(socios) ? socios.length : 0})
        </button>
        <button
          onClick={() => setFilter('activo')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filter === 'activo'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Activos ({Array.isArray(socios) ? socios.filter(s => s.estado === 'activo').length : 0})
        </button>
        <button
          onClick={() => setFilter('pendiente')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filter === 'pendiente'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Pendientes ({Array.isArray(socios) ? socios.filter(s => s.estado === 'pendiente').length : 0})
        </button>
        <button
          onClick={() => setFilter('moroso')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filter === 'moroso'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Morosos ({Array.isArray(socios) ? socios.filter(s => s.estado === 'moroso').length : 0})
        </button>
        <button
          onClick={() => setFilter('cancelado')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filter === 'cancelado'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Cancelados ({Array.isArray(socios) ? socios.filter(s => s.estado === 'cancelado').length : 0})
        </button>
      </div>

      {/* Lista de socios */}
      {filteredSocios.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <Users className="mx-auto mb-4 text-gray-600" size={48} />
          <p className="text-gray-400 text-lg">No hay socios en esta categoría</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSocios.map((socio) => (
            <div
              key={socio.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-primary-500/50 transition-all"
            >
              <div className="flex items-start justify-between">
                {/* Info del socio */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {socio.nombre?.charAt(0).toUpperCase() || socio.username?.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {socio.nombre && socio.apellidos ? `${socio.nombre} ${socio.apellidos}` : socio.username}
                      </h3>
                      <p className="text-gray-400 text-sm">{socio.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Número Socio</p>
                      <p className="text-white text-sm font-mono">{socio.numero_socio}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Estado</p>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoBadge(socio.estado)}`}>
                        {socio.estado}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Rol</p>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadge(socio.role)}`}>
                        {socio.role}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Cuota Mensual</p>
                      <p className="text-white text-sm">{socio.cuota_mensual}€</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Fecha Alta</p>
                      <p className="text-white text-sm">
                        {new Date(socio.fecha_alta).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    {socio.telefono && (
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Teléfono</p>
                        <p className="text-white text-sm">{socio.telefono}</p>
                      </div>
                    )}
                    {socio.dias_morosidad > 0 && (
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Días Morosidad</p>
                        <p className="text-orange-400 text-sm font-bold">{socio.dias_morosidad} días</p>
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-wrap gap-2">
                    {socio.estado === 'pendiente' && (
                      <>
                        <Button
                          variant="primary"
                          onClick={() => handleApprove(socio.user_id)}
                          className="text-sm flex items-center gap-1"
                        >
                          <CheckCircle size={16} />
                          Aprobar
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleReject(socio.user_id)}
                          className="text-sm flex items-center gap-1 border-red-500 text-red-400 hover:bg-red-500/20"
                        >
                          <XCircle size={16} />
                          Rechazar
                        </Button>
                      </>
                    )}

                    {/* ✅ CORRECCIÓN: Mostrar selector SIEMPRE para socios activos, sin importar el rol */}
                    {socio.estado === 'activo' && (
                      <div className="flex items-center gap-2">
                        <Shield size={16} className="text-gray-400" />
                        <select
                          onChange={(e) => handleChangeRole(socio.user_id, e.target.value)}
                          value={socio.role}
                          className="bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-1.5 text-sm cursor-pointer hover:border-primary-500 transition-colors"
                        >
                          <option value="basico">Básico</option>
                          <option value="socio">Socio</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminSocios;