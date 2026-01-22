/**
 * ARCHIVO MODIFICADO: AdminSidebar.jsx
 * 
 * CAMBIOS PRINCIPALES:
 * 
 * 1. RESPONSIVE:
 *    - Ahora recibe props: isOpen, onClose
 *    - Overlay oscuro en móvil
 *    - Botón X para cerrar (solo móvil)
 *    - Transiciones suaves
 *    - Fixed en móvil, sticky en desktop
 * 
 * 2. REORGANIZACIÓN DEL MENÚ:
 *    - Estadísticas de Eventos movidas a "Gestión Eventos"
 *    - Estadísticas de Reservas movidas a "Gestión Reservas"
 *    - Estadísticas de Pagos movidas a "Gestión Pagos"
 *    - "Menú y Estadísticas" ahora solo tiene: Actividad, Dashboard Stats, Generales
 * 
 * 3. FUNCIONALIDADES AÑADIDAS:
 *    - Cierre automático al cambiar de ruta
 *    - Prevención de scroll del body cuando está abierto
 *    - Click en overlay cierra el menú
 */

import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  UserCheck,
  Ticket,
  CreditCard,
  Image,
  BarChart3,
  FileDown,
  LogOut,
  Home,
  FileText,
  X
} from 'lucide-react';
import SidebarSection from './SidebarSection';

const AdminSidebar = ({ isOpen, onClose }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Estado para controlar qué menú está abierto
  const [openMenu, setOpenMenu] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // ========================================
  // REORGANIZACIÓN: "Menú y Estadísticas" 
  // Solo contiene items generales
  // ========================================
  const statsItems = [
    { path: '/admin/actividad', label: 'Actividad Reciente', icon: BarChart3 },
    { path: '/admin/stats/dashboard', label: 'Dashboard Stats', icon: BarChart3 },
    { path: '/admin/stats/generales', label: 'Generales', icon: BarChart3 }
  ];

  // Gestión Usuarios
  const usersItems = [
    { path: '/admin/usuarios', label: 'Listar usuarios', icon: Users }
  ];

  // Gestión Socios
  const sociosItems = [
    { path: '/admin/socios', label: 'Listar socios', icon: UserCheck },
    { path: '/admin/socios/morosos', label: 'Socios morosos', icon: UserCheck },
    { path: '/admin/socios/crear', label: 'Crear socio manual', icon: UserCheck }
  ];

  // ========================================
  // REORGANIZACIÓN: Gestión Eventos
  // Añadida "Estadísticas" aquí
  // ========================================
  const eventosItems = [
    { path: '/admin/eventos', label: 'Listar eventos', icon: Calendar },
    { path: '/admin/eventos/borradores', label: 'Borradores', icon: FileText },
    { path: '/admin/eventos/nuevo', label: 'Crear evento', icon: Calendar },
    { path: '/admin/stats/eventos', label: 'Estadísticas', icon: BarChart3 } // NUEVO
  ];

  // ========================================
  // REORGANIZACIÓN: Gestión Reservas
  // Añadida "Estadísticas" aquí
  // ========================================
  const reservasItems = [
    { path: '/admin/reservas', label: 'Listar reservas', icon: Ticket },
    { path: '/admin/reservas/verificar-qr', label: 'Verificar QR', icon: Ticket },
    { path: '/admin/stats/reservas', label: 'Estadísticas', icon: BarChart3 } // NUEVO
  ];

  // ========================================
  // REORGANIZACIÓN: Gestión Pagos
  // Añadida "Estadísticas" aquí
  // ========================================
  const pagosItems = [
    { path: '/admin/pagos', label: 'Listar pagos', icon: CreditCard },
    { path: '/admin/pagos/mensuales', label: 'Ingresos mensuales', icon: CreditCard },
    { path: '/admin/stats/pagos', label: 'Estadísticas', icon: BarChart3 } // NUEVO
  ];

  // ========================================
  // REORGANIZACIÓN: Gestión Galería
  // Reordenado: Gestión primero, estadísticas después
  // ========================================
  const galeriaItems = [
    { path: '/admin/galeria', label: 'Gestionar Álbumes', icon: Image },
    { path: '/admin/stats/galeria', label: 'Estadísticas', icon: BarChart3 }
  ];

  // Exportaciones
  const exportItems = [
    { path: '/admin/export/socios', label: 'Exportar socios ', icon: FileDown },
    { path: '/admin/export/reservas', label: 'Exportar reservas', icon: FileDown },
    { path: '/admin/export/usuarios', label: 'Exportar usuarios', icon: FileDown },
    { path: '/admin/export/eventos', label: 'Exportar eventos', icon: FileDown }
  ];

  // Función para manejar apertura/cierre de menús
  const handleMenuToggle = (menuId) => {
    setOpenMenu(openMenu === menuId ? null : menuId);
  };

  // Determinar qué menú debe estar abierto según la ruta actual
  const getActiveMenu = () => {
    if (location.pathname.startsWith('/admin/stats') || location.pathname === '/admin/actividad') return 'stats';
    if (location.pathname.startsWith('/admin/usuarios')) return 'users';
    if (location.pathname.startsWith('/admin/socios')) return 'socios';
    if (location.pathname.startsWith('/admin/eventos')) return 'eventos';
    if (location.pathname.startsWith('/admin/reservas')) return 'reservas';
    if (location.pathname.startsWith('/admin/pagos')) return 'pagos';
    if (location.pathname.startsWith('/admin/galeria')) return 'galeria';
    if (location.pathname.startsWith('/admin/export')) return 'exports';
    return null;
  };

  const activeMenu = getActiveMenu();

  // ========================================
  // NUEVO: Cerrar sidebar en móvil al cambiar de ruta
  // ========================================
  useEffect(() => {
    if (onClose) {
      onClose();
    }
  }, [location.pathname]);

  // ========================================
  // NUEVO: Prevenir scroll del body cuando el sidebar está abierto en móvil
  // ========================================
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup: restaurar scroll al desmontar
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* ========================================
          NUEVO: Overlay - solo visible en móvil cuando el menú está abierto
          ======================================== */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 md:hidden animate-fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* ========================================
          Sidebar Principal
          ======================================== */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 h-screen z-50
          w-64 bg-[#0a0a0a] border-r border-[#262626] 
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* ========================================
            Header con botón cerrar
            ======================================== */}
        <div className="flex items-center justify-between p-6 border-b border-[#262626]">
          <h2 className="text-2xl font-display text-white">Panel Admin</h2>
          
          {/* NUEVO: Botón cerrar - solo visible en móvil */}
          <button
            onClick={onClose}
            className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors"
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        {/* Botón Volver a la Web */}
        <a 
          href="/" 
          className="flex items-center gap-3 px-6 py-4 text-gray-400 hover:text-white hover:bg-[#1a1a1a] transition-all border-b border-[#262626]"
        >
          <Home size={20} />
          <span className="font-medium">Volver a la Web</span>
        </a>

        {/* ========================================
            Navigation
            ======================================== */}
        <nav className="flex-1 overflow-y-auto p-4">
          {/* Dashboard Principal */}
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 mb-4 rounded-lg transition-all ${
                isActive
                  ? 'bg-primary-600 text-white shadow-glow'
                  : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'
              }`
            }
          >
            <LayoutDashboard size={20} />
            <span className="font-medium">Dashboard</span>
          </NavLink>

          {/* Secciones Colapsables */}
          <div className="space-y-2">
            {/* REORGANIZADO: Menú y Estadísticas - Solo items generales */}
            <SidebarSection 
              id="stats"
              title="Menú y Estadísticas" 
              icon={BarChart3} 
              items={statsItems}
              isOpen={openMenu === 'stats' || (openMenu === null && activeMenu === 'stats')}
              onToggle={() => handleMenuToggle('stats')}
            />
            
            <SidebarSection 
              id="users"
              title="Gestión Usuarios" 
              icon={Users} 
              items={usersItems}
              isOpen={openMenu === 'users' || (openMenu === null && activeMenu === 'users')}
              onToggle={() => handleMenuToggle('users')}
            />
            
            <SidebarSection 
              id="socios"
              title="Gestión Socios" 
              icon={UserCheck} 
              items={sociosItems}
              isOpen={openMenu === 'socios' || (openMenu === null && activeMenu === 'socios')}
              onToggle={() => handleMenuToggle('socios')}
            />
            
            {/* REORGANIZADO: Gestión Eventos - Ahora incluye Estadísticas */}
            <SidebarSection 
              id="eventos"
              title="Gestión Eventos" 
              icon={Calendar} 
              items={eventosItems}
              isOpen={openMenu === 'eventos' || (openMenu === null && activeMenu === 'eventos')}
              onToggle={() => handleMenuToggle('eventos')}
            />
            
            {/* REORGANIZADO: Gestión Reservas - Ahora incluye Estadísticas */}
            <SidebarSection 
              id="reservas"
              title="Gestión Reservas" 
              icon={Ticket} 
              items={reservasItems}
              isOpen={openMenu === 'reservas' || (openMenu === null && activeMenu === 'reservas')}
              onToggle={() => handleMenuToggle('reservas')}
            />
            
            {/* REORGANIZADO: Gestión Pagos - Ahora incluye Estadísticas */}
            <SidebarSection 
              id="pagos"
              title="Gestión Pagos" 
              icon={CreditCard} 
              items={pagosItems}
              isOpen={openMenu === 'pagos' || (openMenu === null && activeMenu === 'pagos')}
              onToggle={() => handleMenuToggle('pagos')}
            />
            
            {/* REORGANIZADO: Gestión Galería - Reordenado */}
            <SidebarSection 
              id="galeria"
              title="Gestión Galería" 
              icon={Image} 
              items={galeriaItems}
              isOpen={openMenu === 'galeria' || (openMenu === null && activeMenu === 'galeria')}
              onToggle={() => handleMenuToggle('galeria')}
            />
            
            <SidebarSection 
              id="exports"
              title="Exportaciones" 
              icon={FileDown} 
              items={exportItems}
              isOpen={openMenu === 'exports' || (openMenu === null && activeMenu === 'exports')}
              onToggle={() => handleMenuToggle('exports')}
            />
          </div>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-[#262626]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-[#1a1a1a] hover:text-white transition-all w-full"
          >
            <LogOut size={20} />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;