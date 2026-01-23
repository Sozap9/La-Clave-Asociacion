import { useState, useEffect } from 'react';
import { getAllUsers, updateUserRole } from '../../api/adminApi';
import { Users, X, Eye, Ban, CheckCircle, Shield } from 'lucide-react';
import Loader from '../../components/common/Loader';
import FilterBar from '../../components/UI/FilterBar';
import SearchInput from '../../components/UI/SearchInput';

/**
 * AdminUsuarios - Lista TODOS los usuarios (básicos, socios y admins)
 */

// Filtros de rol disponibles
const roleFilters = [
  { value: 'all', label: 'Todos' },
  { value: 'basico', label: 'Básicos' },
  { value: 'socio', label: 'Socios' },
  { value: 'admin', label: 'Admins' }
];

const AdminUsuarios = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, [roleFilter, search]);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      
      if (roleFilter && roleFilter !== 'all') {
        params.role = roleFilter;
      }
      
      if (search) {
        params.search = search;
      }

      const result = await getAllUsers(params);
      
      if (result.success) {
        let usersData = [];
        if (Array.isArray(result.data)) {
          usersData = result.data;
        } else if (result.data.users) {
          usersData = result.data.users;
        } else if (result.data.items) {
          usersData = result.data.items;
        }
        
        setUsers(usersData);
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

  const handleToggleActive = async (userId, currentStatus) => {
    const action = currentStatus ? 'desactivar' : 'activar';
    if (!confirm(`¿Estás seguro de ${action} este usuario?`)) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/toggle-active`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ activo: !currentStatus })
      });

      const result = await response.json();
      
      if (result.success) {
        fetchUsers();
        alert(`Usuario ${action} exitosamente`);
      } else {
        alert(result.message || `Error al ${action} usuario`);
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
        setUsers(prevUsers =>
          prevUsers.map(user =>
            user.id === userId ? { ...user, role: newRole } : user
          )
        );
        alert('Rol actualizado exitosamente');
      } else {
        alert(result.message || 'Error al cambiar rol');
      }
    } catch (err) {
      alert('Error de conexión');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getRoleBadge = (role) => {
    const styles = {
      admin: 'bg-red-500/20 text-red-400',
      socio: 'bg-primary-500/20 text-primary-400',
      basico: 'bg-gray-700 text-gray-400'
    };
    return styles[role] || styles.basico;
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Administrador',
      socio: 'Socio',
      basico: 'Usuario Básico'
    };
    return labels[role] || role;
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-8 bg-black min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-gradient mb-2 text-4xl">Gestión de Usuarios</h1>
        <p className='text-gray-200 text-lg'>
          Administra todos los usuarios.
        </p>
        <p className="text-gray-400 text-lg">
          {users.length} usuario{users.length !== 1 ? 's' : ''} {roleFilter !== 'all' ? `(${roleFilter})` : ''}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Filtros y búsqueda - Igual que en otras páginas */}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        {/* Filtros a la izquierda */}
        <FilterBar
          customFilters={roleFilters}
          activeFilter={roleFilter}
          onFilterChange={setRoleFilter}
        />
        
        {/* Búsqueda a la derecha */}
        <div className="flex-1 max-w-md ml-auto">
          <SearchInput
            value={search}
            onChange={setSearch}
            onClear={() => setSearch('')}
            placeholder="Buscar por nombre, email, username..."
            debounceMs={350}
          />
        </div>
      </div>

      {/* Lista de usuarios */}
      {users.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-12 text-center">
          <Users className="mx-auto mb-4 text-gray-600" size={48} />
          <p className="text-gray-400 text-lg">No hay usuarios en esta categoría</p>
        </div>
      ) : (
        <div className="space-y-4">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6 hover:border-primary-500/50 transition-all"
            >
              <div className="flex items-start justify-between">
                {/* Info del usuario */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {user.nombre?.charAt(0).toUpperCase() ||
                          user.username?.charAt(0).toUpperCase() ||
                          '?'}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-white">
                          {user.nombre && user.apellidos
                            ? `${user.nombre} ${user.apellidos}`
                            : user.username}
                        </h3>
                        {!user.activo && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                            Inactivo
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm">{user.email}</p>
                    </div>
                  </div>

                  {/* Grid de información */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {user.telefono && (
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Teléfono</p>
                        <p className="text-white text-sm">{user.telefono}</p>
                      </div>
                    )}
                    {user.fecha_nacimiento && (
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Fecha Nac.</p>
                        <p className="text-white text-sm">{formatDate(user.fecha_nacimiento)}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Registrado</p>
                      <p className="text-white text-sm">{formatDate(user.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Rol</p>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </div>
                  </div>

                  {/* Selector de rol */}
                  <div className="flex items-center gap-2">
                    <Shield size={16} className="text-gray-400" />
                    <select
                      value={user.role}
                      onChange={(e) => handleChangeRole(user.id, e.target.value)}
                      className="bg-[#262626] text-white border border-gray-700 rounded-lg px-3 py-1.5 text-sm cursor-pointer hover:border-primary-500 transition-colors"
                    >
                      <option value="basico">Básico</option>
                      <option value="socio">Socio</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                {/* Botones a la derecha */}
                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => setSelectedUser(user)}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
                  >
                    <Eye size={16} />
                    Ver
                  </button>
                  <button
                    onClick={() => handleToggleActive(user.id, user.activo !== false)}
                    className={`px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                      user.activo === false
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-primary-600 hover:bg-primary-700 text-white'
                    }`}
                  >
                    {user.activo === false ? (
                      <>
                        <CheckCircle size={16} />
                        Activar
                      </>
                    ) : (
                      <>
                        <Ban size={16} />
                        Desactivar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de detalles - Tu diseño original */}
      {selectedUser && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedUser(null)}
        >
          <div 
            className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Detalles del Usuario</h2>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-gray-500 text-sm">Nombre completo</p>
                <p className="text-white text-lg">
                  {selectedUser.nombre && selectedUser.apellidos
                    ? `${selectedUser.nombre} ${selectedUser.apellidos}`
                    : selectedUser.username}
                </p>
              </div>

              <div>
                <p className="text-gray-500 text-sm">Email</p>
                <p className="text-white">{selectedUser.email}</p>
              </div>

              {selectedUser.telefono && (
                <div>
                  <p className="text-gray-500 text-sm">Teléfono</p>
                  <p className="text-white">{selectedUser.telefono}</p>
                </div>
              )}

              {selectedUser.fecha_nacimiento && (
                <div>
                  <p className="text-gray-500 text-sm">Fecha de nacimiento</p>
                  <p className="text-white">{formatDate(selectedUser.fecha_nacimiento)}</p>
                </div>
              )}

              <div>
                <p className="text-gray-500 text-sm">Rol</p>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadge(selectedUser.role)}`}>
                  {getRoleLabel(selectedUser.role)}
                </span>
              </div>

              <div>
                <p className="text-gray-500 text-sm">Estado</p>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  selectedUser.activo
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {selectedUser.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              <div>
                <p className="text-gray-500 text-sm">Fecha de registro</p>
                <p className="text-white">{formatDate(selectedUser.created_at)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsuarios;