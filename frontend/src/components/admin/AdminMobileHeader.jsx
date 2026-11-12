// Cabecera del admin en móvil; la hamburguesa abre o cierra el lateral

import { Menu, Home } from 'lucide-react';

const AdminMobileHeader = ({ onMenuToggle, isSidebarOpen }) => {
  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-[#0a0a0a] border-b border-[#262626] px-4 py-3 flex items-center justify-between">
      {/* Hamburguesa */}
      <button
        onClick={onMenuToggle}
        className="p-2 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors"
        aria-label={isSidebarOpen ? "Cerrar menú" : "Abrir menú"}
      >
        <Menu size={24} />
      </button>

      {/* Título */}
      <h2 className="text-xl font-display text-white">Panel Admin</h2>

      {/* Volver a la web */}
      <a
        href="/"
        className="p-2 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors"
        aria-label="Volver a la web"
      >
        <Home size={20} />
      </a>
    </div>
  );
};

export default AdminMobileHeader;