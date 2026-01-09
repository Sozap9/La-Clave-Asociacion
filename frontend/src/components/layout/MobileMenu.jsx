import { X, User, LogOut, Shield, Crown, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { NAV_ROUTES } from '../../utils/constants';
import Button from '../common/Button';

const MobileMenu = ({ isOpen, onClose }) => {
  const { user, isAuthenticated, isAdmin, isSocio, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    onClose();
    navigate(NAV_ROUTES.HOME);
  };

  const handleNavigation = (href) => {
    navigate(href);
    onClose();
  };

  // Menú para usuarios NO autenticados
  const publicItems = [
    { label: 'Inicio', href: NAV_ROUTES.HOME },
    { label: 'Estatutos', href: NAV_ROUTES.STATUTES }
  ];

  // Menú para usuarios BÁSICOS
  const basicItems = [
    { label: 'Inicio', href: NAV_ROUTES.HOME },
    { label: 'Estatutos', href: NAV_ROUTES.STATUTES },
    { label: 'Mi Perfil', href: NAV_ROUTES.PROFILE, icon: User }
  ];

  // Menú para SOCIOS
  const socioItems = [
    { label: 'Inicio', href: NAV_ROUTES.HOME },
    { label: 'Eventos', href: NAV_ROUTES.EVENTS },
    { label: 'Galería', href: NAV_ROUTES.GALLERY },
    { label: 'Mis Entradas', href: NAV_ROUTES.MY_BOOKINGS },
    { label: 'Estatutos', href: NAV_ROUTES.STATUTES },
    { label: 'Mi Perfil', href: NAV_ROUTES.PROFILE, icon: User }
  ];

  // Menú para ADMINS
  const adminItems = [
    { label: 'Inicio', href: NAV_ROUTES.HOME },
    { label: 'Eventos', href: NAV_ROUTES.EVENTS },
    { label: 'Galería', href: NAV_ROUTES.GALLERY },
    { label: 'Mi Perfil', href: NAV_ROUTES.PROFILE, icon: User }
  ];

  const getNavItems = () => {
    if (!isAuthenticated) return publicItems;
    if (isAdmin) return adminItems;
    if (isSocio) return socioItems;
    return basicItems; // Usuario básico
  };

  // Obtener badge según rol
  const getRoleBadge = () => {
    if (isAdmin) {
      return {
        label: 'Admin',
        icon: Shield,
        className: 'bg-red-500/20 text-red-400 border-red-500/30'
      };
    } else if (isSocio) {
      return {
        label: 'Socio',
        icon: Crown,
        className: 'bg-primary-500/20 text-primary-400 border-primary-500/30'
      };
    } else {
      return {
        label: 'Usuario',
        icon: User,
        className: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      };
    }
  };

  const navItems = getNavItems();
  const roleBadge = getRoleBadge();
  const RoleIcon = roleBadge.icon;

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-60 z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Menú lateral */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-96 bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-xl font-display text-white">
            {isAuthenticated ? `Hola, ${user?.nombre}` : 'Menú'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
            aria-label="Cerrar menú"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-col h-[calc(100%-80px)]">
          
          {/* Navegación */}
          <nav className="flex-1 px-6 py-8 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const ItemIcon = item.icon;
              return (
                <button
                  key={item.href}
                  onClick={() => handleNavigation(item.href)}
                  className="w-full text-left text-gray-300 hover:text-white hover:bg-gray-800 text-lg transition-all py-3 px-4 rounded-lg flex items-center gap-3"
                >
                  {ItemIcon && <ItemIcon size={20} />}
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Footer del menú */}
          <div className="p-6 border-t border-gray-800 space-y-4 bg-gray-950">
            {isAuthenticated ? (
              <>
                {/* Info del usuario */}
                <div className="flex items-center gap-3 mb-4 p-3 bg-gray-800 rounded-lg">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center shadow-glow">
                    <span className="text-white font-bold text-lg">
                      {user?.nombre?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">
                      {user?.nombre} {user?.apellidos}
                    </p>
                    <p className="text-gray-400 text-sm">{user?.email}</p>
                    <span className={`text-xs px-2 py-1 rounded mt-1 inline-flex items-center gap-1 border ${roleBadge.className}`}>
                      <RoleIcon size={12} />
                      {roleBadge.label}
                    </span>
                  </div>
                </div>
                
                {/* Botón Panel Admin/Socio */}
                {(isAdmin || isSocio) && (
                  <Button
                    variant="primary"
                    onClick={() => handleNavigation(isAdmin ? NAV_ROUTES.ADMIN : NAV_ROUTES.DASHBOARD)}
                    className="w-full"
                  >
                    {isAdmin ? '⚡ Panel Admin' : '👤 Mi Panel'}
                  </Button>
                )}

                {/* Botón Mejorar Cuenta (solo usuarios básicos) */}
                {!isAdmin && !isSocio && (
                  <Button
                    variant="primary"
                    onClick={() => handleNavigation(NAV_ROUTES.UPGRADE)}
                    className="w-full bg-gradient-to-r from-primary-500 to-primary-600"
                  >
                    <Sparkles size={16} className="inline mr-2" />
                    Hazte Socio
                  </Button>
                )}

                {/* Botón Cerrar Sesión */}
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <LogOut size={16} />
                  Cerrar Sesión
                </Button>
              </>
            ) : (
              <>
                {/* Botones para usuarios NO autenticados */}
                <Button
                  variant="outline"
                  onClick={() => handleNavigation(NAV_ROUTES.LOGIN)}
                  className="w-full"
                >
                  Iniciar Sesión
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleNavigation(NAV_ROUTES.REGISTER)}
                  className="w-full"
                >
                  Crear Cuenta
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileMenu;
