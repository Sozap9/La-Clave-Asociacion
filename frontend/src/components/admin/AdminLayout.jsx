import { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminMobileHeader from './AdminMobileHeader';

const AdminLayout = ({ children }) => {
  // Lateral abierto en móvil
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Cabecera móvil */}
      <AdminMobileHeader 
        onMenuToggle={toggleSidebar} 
        isSidebarOpen={isSidebarOpen} 
      />

      {/* Lateral */}
      <AdminSidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      {/* pt-14 deja sitio a la cabecera fija del móvil */}
      <main className="flex-1 overflow-x-hidden pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;