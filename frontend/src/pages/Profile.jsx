import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { User, Mail, Phone, Calendar, CreditCard, Shield, Crown, UserCircle, Edit, Lock } from 'lucide-react';
import api from '../api/axios';
import Loader from '../components/common/Loader';
import EditProfileModal from '../components/common/EditProfileModal';
import ChangePasswordModal from '../components/common/ChangePasswordModal';

const Profile = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/users/profile');
      
      let profileData = null;
      
      if (response.data.data) {
        profileData = response.data.data;
      } else if (response.data) {
        profileData = response.data;
      }
      
      setUserData(profileData);
      
    } catch (error) {
      console.error('❌ Error al cargar perfil:', error);
      setError(error.response?.data?.message || 'Error al cargar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = () => {
    fetchUserData();
  };

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-xl mb-4">{error}</p>
          <button onClick={fetchUserData} className="btn-primary">Reintentar</button>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">No se encontraron datos del perfil</p>
          <button onClick={fetchUserData} className="btn-primary">Reintentar</button>
        </div>
      </div>
    );
  }

  const roleConfig = {
    admin: {
      label: 'Administrador',
      icon: Shield,
      bgColor: 'bg-gradient-to-r from-red-500/20 to-pink-500/20',
      borderColor: 'border-red-500/30'
    },
    socio: {
      label: 'Socio',
      icon: Crown,
      bgColor: 'bg-gradient-to-r from-purple-500/20 to-pink-500/20',
      borderColor: 'border-purple-500/30'
    },
    basico: {
      label: 'Usuario Básico',
      icon: User,
      bgColor: 'bg-gradient-to-r from-gray-500/20 to-gray-600/20',
      borderColor: 'border-gray-500/30'
    }
  };

  const config = roleConfig[userData.role] || roleConfig.basico;
  const RoleIcon = config.icon;

  return (
    <div className="min-h-screen py-20 px-4 bg-gradient-to-b from-gray-950 to-black">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-gradient mb-4">Mi Perfil</h1>
          <p className="text-gray-400 text-lg">Información de tu cuenta</p>
        </div>

        {/* Card Principal */}
        <div className="bg-gradient-to-br from-primary-900/20 via-primary-800/10 to-gray-900/20 backdrop-blur-sm rounded-2xl border border-primary-500/10 overflow-hidden shadow-2xl">
          
          {/* Header con avatar y nombre */}
          <div className="relative p-8 border-b border-primary-500/10">
            <div className="flex flex-col md:flex-row items-center gap-6">
              
              {/* Avatar con badge */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-4xl font-bold shadow-2xl">
                  {userData.avatar_url ? (
                    <img 
                      src={userData.avatar_url} 
                      alt={userData.nombre}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span>
                      {userData.nombre?.charAt(0)?.toUpperCase() || 'U'}
                      {userData.apellidos?.charAt(0)?.toUpperCase() || 'S'}
                    </span>
                  )}
                </div>
                
                <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 ${config.bgColor} ${config.borderColor} border-2 rounded-full px-3 py-1 flex items-center gap-1.5 shadow-lg backdrop-blur-sm whitespace-nowrap`}>
                  <RoleIcon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs font-semibold text-white">{config.label}</span>
                </div>
              </div>

              {/* Nombre y botones */}
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl font-bold text-white mb-2">
                  {userData.nombre || 'Usuario'} {userData.apellidos || ''}
                </h2>
                
                <div className="h-1 w-20 bg-gradient-to-r from-primary-500 to-pink-500 rounded-full mx-auto md:mx-0 mb-4"></div>
                
                {/* Botones */}
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Editar Perfil
                  </button>
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    Cambiar Contraseña
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Información del perfil */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Email */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-800/30 border border-gray-700/30">
                <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-400 mb-1">Email</p>
                  <p className="text-white font-medium truncate">{userData.email || 'No especificado'}</p>
                </div>
              </div>

              {/* Teléfono */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-800/30 border border-gray-700/30">
                <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-400 mb-1">Teléfono</p>
                  <p className="text-white font-medium">
                    {userData.telefono || 'No especificado'}
                  </p>
                </div>
              </div>

              {/* Fecha de Nacimiento */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-800/30 border border-gray-700/30">
                <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-400 mb-1">Fecha de Nacimiento</p>
                  <p className="text-white font-medium">
                    {userData.fecha_nacimiento 
                      ? new Date(userData.fecha_nacimiento).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })
                      : 'No especificada'}
                  </p>
                </div>
              </div>

              {/* DNI */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-800/30 border border-gray-700/30">
                <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-5 h-5 text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-400 mb-1">DNI</p>
                  <p className="text-white font-medium">
                    {userData.dni ? `****${userData.dni.slice(-4)}` : 'No especificado'}
                  </p>
                </div>
              </div>

              {/* Usuario */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-800/30 border border-gray-700/30">
                <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                  <UserCircle className="w-5 h-5 text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-400 mb-1">Usuario</p>
                  <p className="text-white font-medium">{userData.username || 'No especificado'}</p>
                </div>
              </div>

              {/* Miembro desde */}
              {userData.created_at && (
                <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-800/30 border border-gray-700/30">
                  <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-400 mb-1">Miembro desde</p>
                    <p className="text-white font-medium">
                      {new Date(userData.created_at).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modales */}
      <EditProfileModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        userData={userData}
        onUpdate={handleUpdateProfile}
      />

      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </div>
  );
};

export default Profile;
