import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { User, Mail, Phone, Calendar, CreditCard, Shield, Crown, Edit, Lock } from 'lucide-react';
import api from '../api/axios';
import Loader from '../components/common/Loader';
import EditProfileModal from '../components/common/EditProfileModal';
import ChangePasswordModal from '../components/common/ChangePasswordModal';
import { ArrowRight } from 'lucide-react';
import { FEATURES } from '../utils/constants';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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
      console.error('Error al cargar perfil:', error);
      setError(error.response?.data?.message || 'Error al cargar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = () => {
    fetchUserData();
  };

  const handleUpgradeClick = () => {
    navigate('/mejorar-cuenta');
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <p className="text-red-400 text-xl mb-4">{error}</p>
          <button onClick={fetchUserData} className="btn-primary">Reintentar</button>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
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
      bgColor: 'bg-gradient-to-r from-primary-500/20 to-pink-500/20',
      borderColor: 'border-primary-500/30'
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
  const isBasicUser = userData.role === 'basico';

  return (
    <div className="min-h-screen p-4 md:p-8 bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto">
        
        {/* Cabecera */}
        <div className="mb-8">
          <h1 className="text-gradient mb-2 text-2xl md:text-4xl"> Mi Perfil</h1>
          <p className="text-gray-400 text-sm md:text-lg"> Información de tu cuenta.</p>
        </div>

        {/* Tarjeta principal */}
        <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl overflow-hidden shadow-2xl">
          
          {/* Avatar y nombre */}
          <div className="relative p-4 sm:p-8 border-b border-[#262626]">
            <div className="flex flex-col lg:flex-row items-start gap-8">
              
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-2xl sm:text-4xl font-bold shadow-2xl">
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

              <div className="flex-1 w-full">
                <div>
                  <h2 className="text-xl sm:text-3xl font-bold text-white mb-2">
                    {userData.nombre || 'Usuario'} {userData.apellidos || ''}
                  </h2>
                  <div className="h-0.5 w-20 bg-primary-500 rounded-full mb-4"></div>
                  
                  {/* Botones */}
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#262626] text-white rounded-lg font-medium transition-all border border-[#262626] hover:border-primary-500/50 flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Editar Perfil
                    </button>
                    <button
                      onClick={() => setShowPasswordModal(true)}
                      className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#262626] text-white rounded-lg font-medium transition-all border border-[#262626] hover:border-primary-500/50 flex items-center gap-2"
                    >
                      <Lock className="w-4 h-4" />
                      Cambiar Contraseña
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Datos */}
          <div className="p-4 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              
              <div className="flex items-start gap-4 p-4 rounded-lg bg-[#0a0a0a] border border-[#262626]">
                <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-400 mb-1">Email</p>
                  <p className="text-white font-medium truncate">{userData.email || 'No especificado'}</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-lg bg-[#0a0a0a] border border-[#262626]">
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

              <div className="flex items-start gap-4 p-4 rounded-lg bg-[#0a0a0a] border border-[#262626]">
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

              <div className="flex items-start gap-4 p-4 rounded-lg bg-[#0a0a0a] border border-[#262626]">
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

              {userData.created_at && (
                <div className="flex items-start gap-4 p-4 rounded-lg bg-[#0a0a0a] border border-[#262626]">
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

          {/* Llamada a hacerse socio (usuarios básicos) */}
          {isBasicUser && (
            <div className="p-8 pt-0">
              <div className="bg-gradient-to-br from-primary-600/30 via-primary-700/20 to-primary-800/30 backdrop-blur-sm rounded-xl p-6 border border-primary-500/20 text-center">
                <h3 className="text-2xl font-bold text-white mb-2">
                  Mejora tu Experiencia
                </h3>
                <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                  Convierte en socio por solo 10€/mes y disfruta de acceso completo a todos los eventos
                  {FEATURES.GALLERY_ENABLED ? ", galería exclusiva" : ""} y beneficios especiales de La Clave.
                </p>
                <button
                  onClick={handleUpgradeClick}
                  className="px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-white rounded-lg font-bold transition-all shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:scale-105"
                >
                  Conviértete en socio <ArrowRight className="inline-block w-5 h-5 ml-2" />
                </button>
              </div>
            </div>
          )}
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