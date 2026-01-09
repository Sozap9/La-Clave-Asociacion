import { useState } from 'react';
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
  FileText
} from 'lucide-react';
import SidebarSection from './SidebarSection';

const AdminSidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Estado para controlar qué menú está abierto
  const [openMenu, setOpenMenu] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Menú y Estadísticas
  const statsItems = [
    { path: '/admin/actividad', label: 'Actividad Reciente', icon: BarChart3 },
    { path: '/admin/stats/dashboard', label: 'Dashboard Stats', icon: BarChart3 },
    { path: '/admin/stats/generales', label: 'Generales', icon: BarChart3 },
    { path: '/admin/stats/eventos', label: 'Eventos', icon: Calendar },
    { path: '/admin/stats/reservas', label: 'Reservas', icon: Ticket },
    { path: '/admin/stats/pagos', label: 'Pagos', icon: CreditCard },
    { path: '/admin/stats/galeria', label: 'Galería', icon: Image }
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

  // Gestión Eventos
  const eventosItems = [
    { path: '/admin/eventos', label: 'Listar eventos', icon: Calendar },
    { path: '/admin/eventos/borradores', label: 'Borradores', icon: FileText },
    { path: '/admin/eventos/nuevo', label: 'Crear evento', icon: Calendar }
  ];

  // Gestión Reservas
  const reservasItems = [
    { path: '/admin/reservas', label: 'Listar reservas', icon: Ticket },
    { path: '/admin/reservas/verificar-qr', label: 'Verificar QR', icon: Ticket }
  ];

  // Gestión Pagos
  const pagosItems = [
    { path: '/admin/pagos', label: 'Listar pagos', icon: CreditCard },
    { path: '/admin/pagos/mensuales', label: 'Ingresos mensuales', icon: CreditCard }
  ];

  // Gestión Galería
  const galeriaItems = [
    { path: '/admin/galeria/stats', label: 'Estadísticas Galería', icon: Image },
    { path: '/admin/galeria', label: 'Gestionar Álbumes', icon: Image }
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

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 h-screen sticky top-0 flex flex-col">
      {/* Botón Volver a la Web */}
      <a
        href="/"
        className="flex items-center gap-3 px-6 py-4 text-gray-400 hover:text-white hover:bg-gray-800 transition-all border-b border-gray-800"
      >
        <Home size={20} />
        <span className="font-medium">Volver a la Web</span>
      </a>

      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <h2 className="text-2xl font-display text-white">Panel Admin</h2>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        {/* Dashboard Principal */}
        <NavLink
          to="/admin"
          end
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 mb-4 rounded-lg transition-all ${
              isActive
                ? 'bg-primary-600 text-white shadow-glow'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`
          }
        >
          <LayoutDashboard size={20} />
          <span className="font-medium">Dashboard</span>
        </NavLink>

        {/* Secciones Colapsables con control centralizado */}
        <div className="space-y-2">
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
          
          <SidebarSection 
            id="eventos"
            title="Gestión Eventos" 
            icon={Calendar} 
            items={eventosItems}
            isOpen={openMenu === 'eventos' || (openMenu === null && activeMenu === 'eventos')}
            onToggle={() => handleMenuToggle('eventos')}
          />
          
          <SidebarSection 
            id="reservas"
            title="Gestión Reservas" 
            icon={Ticket} 
            items={reservasItems}
            isOpen={openMenu === 'reservas' || (openMenu === null && activeMenu === 'reservas')}
            onToggle={() => handleMenuToggle('reservas')}
          />
          
          <SidebarSection 
            id="pagos"
            title="Gestión Pagos" 
            icon={CreditCard} 
            items={pagosItems}
            isOpen={openMenu === 'pagos' || (openMenu === null && activeMenu === 'pagos')}
            onToggle={() => handleMenuToggle('pagos')}
          />
          
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
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-all w-full"
        >
          <LogOut size={20} />
          <span className="font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
