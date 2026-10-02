import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  LayoutDashboard,
  Calendar,
  UserCheck,
  Ticket,
  CreditCard,
  Image,
  BarChart3,
  FileDown,
  LogOut,
  Home,
  FileText,
  X,
  ClipboardList,
} from "lucide-react";
import SidebarSection from "./SidebarSection";
import { getSolicitudesPendientesCount } from "../../api/adminApi";
import { FEATURES } from "../../utils/constants";

const AdminSidebar = ({ isOpen, onClose }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [openMenu, setOpenMenu] = useState(null);
  const [pendientesCount, setPendientesCount] = useState(0);

  // ── Badge: contar solicitudes pendientes ──────────────────────────
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await getSolicitudesPendientesCount();
        if (res.success) setPendientesCount(res.data.total || 0);
      } catch {
        /* silencioso */
      }
    };
    fetchCount();
    // Refrescar cada 60 s mientras el sidebar está montado
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // ── Menús ─────────────────────────────────────────────────────────
  const statsItems = [
    { path: "/admin/actividad", label: "Actividad Reciente", icon: BarChart3 },
    {
      path: "/admin/stats/dashboard",
      label: "Generales",
      icon: BarChart3,
    },
  ];

  const sociosItems = [
    { path: "/admin/socios", label: "Listar socios", icon: UserCheck },
    {
      path: "/admin/solicitudes",
      label: "Solicitudes de socio",
      icon: ClipboardList,
      badge: pendientesCount,
    },
  ];

  const solicitudesItems = [
    {
      path: "/admin/solicitudes",
      label: "Solicitudes de socio",
      icon: ClipboardList,
    },
  ];

  const eventosItems = [
    { path: "/admin/eventos", label: "Listar eventos", icon: Calendar },
    { path: "/admin/eventos/borradores", label: "Borradores", icon: FileText },
    { path: "/admin/eventos/nuevo", label: "Crear evento", icon: Calendar },
    { path: "/admin/stats/eventos", label: "Estadísticas", icon: BarChart3 },
  ];

  const reservasItems = [
    { path: "/admin/reservas", label: "Listar reservas", icon: Ticket },
    {
      path: "/admin/reservas/verificar-qr",
      label: "Verificar QR",
      icon: Ticket,
    },
    { path: "/admin/stats/reservas", label: "Estadísticas", icon: BarChart3 },
  ];

  const pagosItems = [
    { path: "/admin/pagos", label: "Listar pagos", icon: CreditCard },
    {
      path: "/admin/pagos/mensuales",
      label: "Ingresos mensuales",
      icon: CreditCard,
    },
    { path: "/admin/stats/pagos", label: "Estadísticas", icon: BarChart3 },
  ];

  const galeriaItems = [
    { path: "/admin/galeria", label: "Gestionar Álbumes", icon: Image },
  ];

  const exportItems = [
    { path: "/admin/export/socios", label: "Exportar socios", icon: FileDown },
    {
      path: "/admin/export/reservas",
      label: "Exportar reservas",
      icon: FileDown,
    },
    {
      path: "/admin/export/eventos",
      label: "Exportar eventos",
      icon: FileDown,
    },
  ];

  const handleMenuToggle = (menuId) =>
    setOpenMenu(openMenu === menuId ? null : menuId);

  const getActiveMenu = () => {
    if (
      location.pathname.startsWith("/admin/stats") ||
      location.pathname === "/admin/actividad"
    )
      return "stats";
    if (
      location.pathname.startsWith("/admin/socios") ||
      location.pathname.startsWith("/admin/solicitudes")
    )
      return "socios";
    if (location.pathname.startsWith("/admin/eventos")) return "eventos";
    if (location.pathname.startsWith("/admin/reservas")) return "reservas";
    if (location.pathname.startsWith("/admin/pagos")) return "pagos";
    if (location.pathname.startsWith("/admin/galeria")) return "galeria";
    if (location.pathname.startsWith("/admin/export")) return "exports";
    return null;
  };

  const activeMenu = getActiveMenu();

  useEffect(() => {
    if (onClose) onClose();
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 md:hidden animate-fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed md:sticky top-0 left-0 h-screen z-50
          w-64 bg-[#0a0a0a] border-r border-[#262626]
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#262626]">
          <h2 className="text-2xl font-display text-white">Panel Admin</h2>
          <button
            onClick={onClose}
            className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors"
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        {/* Volver a la web */}
        <a
          href="/"
          className="flex items-center gap-3 px-6 py-4 text-gray-400 hover:text-white hover:bg-[#1a1a1a] transition-all border-b border-[#262626]"
        >
          <Home size={20} />
          <span className="font-medium">Volver a la Web</span>
        </a>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-4">
          {/* Dashboard */}
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 mb-4 rounded-lg transition-all ${
                isActive
                  ? "bg-primary-600 text-white shadow-glow"
                  : "text-gray-400 hover:bg-[#1a1a1a] hover:text-white"
              }`
            }
          >
            <LayoutDashboard size={20} />
            <span className="font-medium">Dashboard</span>
          </NavLink>

          <div className="space-y-2">
            <SidebarSection
              id="stats"
              title="Menú y Estadísticas"
              icon={BarChart3}
              items={statsItems}
              isOpen={
                openMenu === "stats" ||
                (openMenu === null && activeMenu === "stats")
              }
              onToggle={() => handleMenuToggle("stats")}
            />

            <SidebarSection
              id="socios"
              title="Gestión Socios"
              icon={UserCheck}
              items={sociosItems}
              isOpen={
                openMenu === "socios" ||
                (openMenu === null && activeMenu === "socios")
              }
              onToggle={() => handleMenuToggle("socios")}
            />

            <SidebarSection
              id="eventos"
              title="Gestión Eventos"
              icon={Calendar}
              items={eventosItems}
              isOpen={
                openMenu === "eventos" ||
                (openMenu === null && activeMenu === "eventos")
              }
              onToggle={() => handleMenuToggle("eventos")}
            />

            <SidebarSection
              id="reservas"
              title="Gestión Reservas"
              icon={Ticket}
              items={reservasItems}
              isOpen={
                openMenu === "reservas" ||
                (openMenu === null && activeMenu === "reservas")
              }
              onToggle={() => handleMenuToggle("reservas")}
            />

            <SidebarSection
              id="pagos"
              title="Gestión Pagos"
              icon={CreditCard}
              items={pagosItems}
              isOpen={
                openMenu === "pagos" ||
                (openMenu === null && activeMenu === "pagos")
              }
              onToggle={() => handleMenuToggle("pagos")}
            />

            {FEATURES.GALLERY_ENABLED && (
              <SidebarSection
                id="galeria"
                title="Gestión Galería"
                icon={Image}
                items={galeriaItems}
                isOpen={
                  openMenu === "galeria" ||
                  (openMenu === null && activeMenu === "galeria")
                }
                onToggle={() => handleMenuToggle("galeria")}
              />
            )}

            <SidebarSection
              id="exports"
              title="Exportaciones"
              icon={FileDown}
              items={exportItems}
              isOpen={
                openMenu === "exports" ||
                (openMenu === null && activeMenu === "exports")
              }
              onToggle={() => handleMenuToggle("exports")}
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