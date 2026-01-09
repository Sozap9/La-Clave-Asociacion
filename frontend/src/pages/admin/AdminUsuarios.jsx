import { useState, useEffect } from 'react';
import { Users, Search, X, Eye, Ban, CheckCircle } from 'lucide-react';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';

const AdminUsuarios = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      
      if (result.success) {
        let usersData = [];
        if (Array.isArray(result.data)) {
          usersData = result.data;
        } else if (result.data.users) {
          usersData = result.data.users;
        } else if (result.data.items) {
          usersData = result.data.items;
        }
        
        // Filtrar solo usuarios básicos (no socios ni admins)
        const basicUsers = usersData.filter(u => u.role === 'basico');
        setUsers(basicUsers);
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

  const filteredUsers = Array.isArray(users) ? users.filter(user => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      user.nombre?.toLowerCase().includes(searchLower) ||
      user.apellidos?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.username?.toLowerCase().includes(searchLower) ||
      user.telefono?.includes(search)
    );
  }) : [];

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-8 bg-black min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-gradient mb-2 text-4xl">Gestión de Usuarios Básicos</h1>
        <p className="text-gray-400 text-lg">
          {Array.isArray(users) ? `${users.length} usuario${users.length !== 1 ? 's' : ''} básico${users.length !== 1 ? 's' : ''}` : 'Administra usuarios registrados'}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Búsqueda */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre, email, username o teléfono..."
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
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-4 hover:border-primary-500/50 transition-all">
          <p className="text-gray-400 text-sm mb-1">Total Usuarios</p>
          <p className="text-primary-300 text-2xl font-bold">{users.length}</p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-4 hover:border-primary-500/50 transition-all">
          <p className="text-gray-400 text-sm mb-1">Usuarios Activos</p>
          <p className="text-primary-300 text-2xl font-bold">
            {users.filter(u => u.activo !== false).length}
          </p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-4 hover:border-primary-500/50 transition-all">
          <p className="text-gray-400 text-sm mb-1">Usuarios Inactivos</p>
          <p className="text-primary-300 text-2xl font-bold">
            {users.filter(u => u.activo === false).length}
          </p>
        </div>
      </div>

      {/* Lista de usuarios */}
      {filteredUsers.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-12 text-center">
          <Users className="mx-auto mb-4 text-gray-600" size={48} />
          <p className="text-gray-400 text-lg">
            {search ? 'No se encontraron usuarios' : 'No hay usuarios básicos registrados'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredUsers.map((user) => (
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
                        {user.nombre?.charAt(0).toUpperCase() || user.username?.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-white">
                          {user.nombre && user.apellidos 
                            ? `${user.nombre} ${user.apellidos}`
                            : user.username}
                        </h3>
                        {user.activo === false && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                            Inactivo
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm">{user.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#262626] text-gray-400 border border-[#333333]">
                        Usuario Básico
                      </span>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
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

      {/* Modal de detalles */}
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
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Avatar y nombre */}
              <div className="flex items-center gap-4 pb-6 border-b border-[#262626]">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-3xl">
                    {selectedUser.nombre?.charAt(0).toUpperCase() || selectedUser.username?.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    {selectedUser.nombre && selectedUser.apellidos 
                      ? `${selectedUser.nombre} ${selectedUser.apellidos}`
                      : selectedUser.username}
                  </h3>
                  <p className="text-gray-400">{selectedUser.email}</p>
                  {selectedUser.activo === false && (
                    <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                      Usuario Inactivo
                    </span>
                  )}
                </div>
              </div>

              {/* Información personal */}
              <div>
                <h4 className="text-white font-semibold mb-3">Información Personal</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Username</p>
                    <p className="text-white">{selectedUser.username || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Email</p>
                    <p className="text-white">{selectedUser.email}</p>
                  </div>
                  {selectedUser.telefono && (
                    <div>
                      <p className="text-gray-500 text-sm mb-1">Teléfono</p>
                      <p className="text-white">{selectedUser.telefono}</p>
                    </div>
                  )}
                  {selectedUser.fecha_nacimiento && (
                    <div>
                      <p className="text-gray-500 text-sm mb-1">Fecha de Nacimiento</p>
                      <p className="text-white">{formatDate(selectedUser.fecha_nacimiento)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Información de cuenta */}
              <div>
                <h4 className="text-white font-semibold mb-3">Información de Cuenta</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Rol</p>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#262626] text-gray-400 border border-[#333333]">
                      Usuario Básico
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Estado</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      selectedUser.activo === false
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-green-500/20 text-green-400'
                    }`}>
                      {selectedUser.activo === false ? 'Inactivo' : 'Activo'}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Fecha de Registro</p>
                    <p className="text-white">{formatDate(selectedUser.created_at)}</p>
                  </div>
                  {selectedUser.updated_at && (
                    <div>
                      <p className="text-gray-500 text-sm mb-1">Última Actualización</p>
                      <p className="text-white">{formatDate(selectedUser.updated_at)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <Button
                variant="outline"
                onClick={() => setSelectedUser(null)}
                className="flex-1"
              >
                Cerrar
              </Button>
              <Button
                variant={selectedUser.activo === false ? 'primary' : 'outline'}
                onClick={() => {
                  handleToggleActive(selectedUser.id, selectedUser.activo !== false);
                  setSelectedUser(null);
                }}
                className={`flex-1 ${
                  selectedUser.activo === false
                    ? ''
                    : 'border-red-500 text-red-400 hover:bg-red-500/20'
                }`}
              >
                {selectedUser.activo === false ? 'Activar Usuario' : 'Desactivar Usuario'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsuarios;