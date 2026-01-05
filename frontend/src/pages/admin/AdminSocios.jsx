import { useState, useEffect } from 'react';
import { getAllUsers, updateUserRole, approveUser, rejectUser } from '../../api/adminApi';
import { Users, CheckCircle, XCircle, Shield } from 'lucide-react';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';

const AdminSocios = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, basico, socio, admin, pendiente

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getAllUsers();
      if (result.success) {
        // ✅ CORRECCIÓN: Manejar diferentes estructuras de respuesta
        let usersData = [];
        
        if (Array.isArray(result.data)) {
          // Si data es un array directamente
          usersData = result.data;
        } else if (result.data.users && Array.isArray(result.data.users)) {
          // Si data tiene propiedad users
          usersData = result.data.users;
        } else if (result.data.items && Array.isArray(result.data.items)) {
          // Si data tiene propiedad items
          usersData = result.data.items;
        } else if (result.data.socios && Array.isArray(result.data.socios)) {
          // Si data tiene propiedad socios
          usersData = result.data.socios;
        }
        
        // ✅ FILTRAR SOLO SOCIOS Y PENDIENTES (no básicos)
        const sociosOnly = usersData.filter(u => 
          u.role === 'socio' || u.role === 'admin' || u.estado === 'pendiente'
        );
        
        setUsers(sociosOnly);
      } else {
        setError(result.message || 'Error al cargar usuarios');
        setUsers([]);
      }
    } catch (err) {
      console.error('Error en fetchUsers:', err);
      setError('Error de conexión');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    if (!confirm('¿Aprobar este usuario como socio?')) return;

    try {
      const result = await approveUser(userId);
      if (result.success) {
        fetchUsers();
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
        fetchUsers();
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
        fetchUsers();
      } else {
        alert(result.message || 'Error al cambiar rol');
      }
    } catch (err) {
      alert('Error de conexión');
    }
  };

  // ✅ CORRECCIÓN: Verificar que users sea array antes de filtrar
  const filteredUsers = Array.isArray(users) ? users.filter(user => {
    if (filter === 'all') return true;
    if (filter === 'pendiente') return user.estado === 'pendiente';
    return user.role === filter;
  }) : [];

  const getRoleBadge = (role) => {
    const styles = {
      admin: 'bg-red-500/20 text-red-400',
      socio: 'bg-primary-500/20 text-primary-400',
      basico: 'bg-gray-700 text-gray-400'
    };
    return styles[role] || styles.basico;
  };

  const getEstadoBadge = (estado) => {
    const styles = {
      activo: 'bg-green-500/20 text-green-400',
      pendiente: 'bg-yellow-500/20 text-yellow-400',
      rechazado: 'bg-red-500/20 text-red-400'
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
          {Array.isArray(users) ? `${users.length} usuario${users.length !== 1 ? 's' : ''} registrado${users.length !== 1 ? 's' : ''}` : 'Administra usuarios y aprobaciones'}
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
          Todos ({Array.isArray(users) ? users.length : 0})
        </button>
        <button
          onClick={() => setFilter('pendiente')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filter === 'pendiente'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Pendientes ({Array.isArray(users) ? users.filter(u => u.estado === 'pendiente').length : 0})
        </button>
        <button
          onClick={() => setFilter('socio')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filter === 'socio'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Socios ({Array.isArray(users) ? users.filter(u => u.role === 'socio').length : 0})
        </button>
        <button
          onClick={() => setFilter('basico')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filter === 'basico'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Básicos ({Array.isArray(users) ? users.filter(u => u.role === 'basico').length : 0})
        </button>
        <button
          onClick={() => setFilter('admin')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filter === 'admin'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Admins ({Array.isArray(users) ? users.filter(u => u.role === 'admin').length : 0})
        </button>
      </div>

      {/* Lista de usuarios */}
      {filteredUsers.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <Users className="mx-auto mb-4 text-gray-600" size={48} />
          <p className="text-gray-400 text-lg">No hay usuarios en esta categoría</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-primary-500/50 transition-all"
            >
              <div className="flex items-start justify-between">
                {/* Info del usuario */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {user.nombre?.charAt(0).toUpperCase() || user.username?.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {user.nombre && user.apellidos ? `${user.nombre} ${user.apellidos}` : user.username}
                      </h3>
                      <p className="text-gray-400 text-sm">{user.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Rol</p>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                        {user.role}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Estado</p>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoBadge(user.estado || 'activo')}`}>
                        {user.estado || 'activo'}
                      </span>
                    </div>
                    {user.telefono && (
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Teléfono</p>
                        <p className="text-white text-sm">{user.telefono}</p>
                      </div>
                    )}
                    {user.fecha_nacimiento && (
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Fecha Nac.</p>
                        <p className="text-white text-sm">
                          {new Date(user.fecha_nacimiento).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-wrap gap-2">
                    {user.estado === 'pendiente' && (
                      <>
                        <Button
                          variant="primary"
                          onClick={() => handleApprove(user.id)}
                          className="text-sm flex items-center gap-1"
                        >
                          <CheckCircle size={16} />
                          Aprobar
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleReject(user.id)}
                          className="text-sm flex items-center gap-1 border-red-500 text-red-400 hover:bg-red-500/20"
                        >
                          <XCircle size={16} />
                          Rechazar
                        </Button>
                      </>
                    )}

                    {user.role !== 'admin' && (user.estado === 'activo' || !user.estado) && (
                      <select
                        onChange={(e) => handleChangeRole(user.id, e.target.value)}
                        value={user.role}
                        className="bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-1.5 text-sm"
                      >
                        <option value="basico">Básico</option>
                        <option value="socio">Socio</option>
                        <option value="admin">Admin</option>
                      </select>
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
