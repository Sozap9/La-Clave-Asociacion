import { useState, useEffect } from 'react';
import { getAllSocios, updateUserRole, approveUser, rejectUser } from '../../api/adminApi';
import { Users, CheckCircle, XCircle, Shield, Eye, Ban, X } from 'lucide-react';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import FilterBar from '../../components/UI/FilterBar';
import SearchInput from '../../components/UI/SearchInput';

/**
 * AdminSocios - Lista SOLO los socios (usuarios con role='socio')
 */

// Filtros de estado disponibles
const estadoFilters = [
  { value: 'all', label: 'Todos' },
  { value: 'activo', label: 'Activos' },
];

const AdminSocios = () => {
  const [socios, setSocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('all');
  const [selectedSocio, setSelectedSocio] = useState(null);

  useEffect(() => {
    fetchSocios();
    // eslint-disable-next-line
  }, [estadoFilter, search]);

  const fetchSocios = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      
      if (estadoFilter && estadoFilter !== 'all') {
        params.estado = estadoFilter;
      }
      
      if (search) {
        params.search = search;
      }

      const result = await getAllSocios(params);
      
      if (result.success) {
        const sociosData = result.data?.socios || result.data || [];
        // Filtrar SOLO los que tienen role='socio'
        const onlySocios = sociosData.filter(s => s.role === 'socio');
        setSocios(Array.isArray(onlySocios) ? onlySocios : []);
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

  const handleToggleActive = async (userId, currentStatus) => {
    const action = currentStatus ? 'desactivar' : 'activar';
    if (!confirm(`¿Estás seguro de ${action} este socio?`)) return;

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
        fetchSocios();
        alert(`Socio ${action} exitosamente`);
      } else {
        alert(result.message || `Error al ${action} socio`);
      }
    } catch (err) {
      alert('Error de conexión');
    }
  };

  const handleApprove = async (userId) => {
    if (!confirm('¿Aprobar este usuario como socio?')) return;

    try {
      const result = await approveUser(userId);
      if (result.success) {
        fetchSocios();
        alert('Usuario aprobado exitosamente');
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
        alert('Solicitud rechazada exitosamente');
      } else {
        alert(result.message || 'Error al rechazar usuario');
      }
    } catch (err) {
      alert('Error de conexión');
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    if (!confirm(`¿Cambiar el rol del socio a ${newRole}?`)) return;

    try {
      const result = await updateUserRole(userId, newRole);
      if (result.success) {
        // Si es user básico no aparece en la lista
        if (newRole !== 'socio') {
          setSocios(prevSocios => prevSocios.filter(s => s.user_id !== userId));
        } else {
          setSocios(prevSocios =>
            prevSocios.map(socio =>
              socio.user_id === userId ? { ...socio, role: newRole } : socio
            )
          );
        }
        alert('Rol actualizado exitosamente');
      } else {
        alert(result.message || 'Error al cambiar rol');
      }
    } catch (err) {
      alert('Error de conexión');
    }
  };

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
        <h1 className="text-gradient mb-2 text-4xl">Gestión de Socios</h1>
        <p className='text-gray-200 text-lg'>
          Administra tu lista de socios
        </p>
        <p className="text-gray-400 text-lg">
          {socios.length} socio{socios.length !== 1 ? 's' : ''} registrado{socios.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Filtros y búsqueda  */}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        {/* Filtros*/}
        <FilterBar
          customFilters={estadoFilters}
          activeFilter={estadoFilter}
          onFilterChange={setEstadoFilter}
        />
        
        {/* Búsqueda */}
        <div className="flex-1 max-w-md ml-auto">
          <SearchInput
            value={search}
            onChange={setSearch}
            onClear={() => setSearch('')}
            placeholder="Buscar por nombre, email..."
            debounceMs={350}
          />
        </div>
      </div>

      {/* Lista de socios */}
      {socios.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-12 text-center">
          <Users className="mx-auto mb-4 text-gray-600" size={48} />
          <p className="text-gray-400 text-lg">No hay socios en esta categoría</p>
        </div>
      ) : (
        <div className="space-y-4">
          {socios.map((socio) => (
            <div
              key={socio.id}
              className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6 hover:border-primary-500/50 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Avatar y nombre */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {socio.nombre?.charAt(0).toUpperCase() || socio.username?.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-white">
                          {socio.nombre && socio.apellidos ? `${socio.nombre} ${socio.apellidos}` : socio.username}
                        </h3>
                        {socio.activo === false && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                            Inactivo
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm">{socio.email}</p>
                    </div>
                  </div>

                  {/* Grid de información */}
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
                        {getRoleLabel(socio.role)}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Cuota Mensual</p>
                      <p className="text-white text-sm">{socio.cuota_mensual}€</p>
                    </div>
                  </div>

                  {/* Selector de rol y botones aprobar/rechazar */}
                  <div className="flex flex-wrap gap-2 items-center">
                    {/* Botones de aprobar/rechazar para pendientes */}
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

                    {/* Selector de rol */}
                    <div className="flex items-center gap-2">
                      <Shield size={16} className="text-gray-400" />
                      <select
                        onChange={(e) => handleChangeRole(socio.user_id, e.target.value)}
                        value={socio.role}
                        className="bg-[#262626] text-white border border-gray-700 rounded-lg px-3 py-1.5 text-sm cursor-pointer hover:border-primary-500 transition-colors"
                      >
                        <option value="basico">Básico</option>
                        <option value="socio">Socio</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Botones  */}
                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => setSelectedSocio(socio)}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
                  >
                    <Eye size={16} />
                    Ver
                  </button>
                  <button
                    onClick={() => handleToggleActive(socio.user_id, socio.activo !== false)}
                    className={`px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                      socio.activo === false
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-primary-600 hover:bg-primary-700 text-white'
                    }`}
                  >
                    {socio.activo === false ? (
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
              <h2 className="text-2xl font-bold text-white">Detalles del Socio</h2>
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
                    : selectedSocio.username}
                </p>
              </div>

              <div>
                <p className="text-gray-500 text-sm">Número de Socio</p>
                <p className="text-white font-mono">{selectedSocio.numero_socio}</p>
              </div>

              <div>
                <p className="text-gray-500 text-sm">Email</p>
                <p className="text-white">{selectedSocio.email}</p>
              </div>

              {selectedSocio.telefono && (
                <div>
                  <p className="text-gray-500 text-sm">Teléfono</p>
                  <p className="text-white">{selectedSocio.telefono}</p>
                </div>
              )}

              <div>
                <p className="text-gray-500 text-sm">Estado</p>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEstadoBadge(selectedSocio.estado)}`}>
                  {selectedSocio.estado}
                </span>
              </div>

              <div>
                <p className="text-gray-500 text-sm">Cuota Mensual</p>
                <p className="text-white">{selectedSocio.cuota_mensual}€</p>
              </div>

              <div>
                <p className="text-gray-500 text-sm">Fecha de Alta</p>
                <p className="text-white">{new Date(selectedSocio.fecha_alta).toLocaleDateString('es-ES')}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSocios;