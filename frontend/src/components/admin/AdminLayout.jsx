/**
 * ARCHIVO CORREGIDO: AdminLayout.jsx
 * 
 * CORRECCIÓN:
 * - Ahora pasa isSidebarOpen como prop al AdminMobileHeader
 * - Esto permite que el botón hamburguesa sepa si debe abrir o cerrar
 * - Misma lógica que en NavBar.jsx de la web principal
 */

import { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminMobileHeader from './AdminMobileHeader';

const AdminLayout = ({ children }) => {
  // Estado para controlar si el sidebar está abierto en móvil
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Función para alternar el sidebar (hamburguesa)
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Función para cerrar el sidebar
  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Header móvil con botón hamburguesa - CORREGIDO: ahora recibe isSidebarOpen */}
      <AdminMobileHeader 
        onMenuToggle={toggleSidebar} 
        isSidebarOpen={isSidebarOpen} 
      />

      {/* Sidebar con control de visibilidad */}
      <AdminSidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      {/* 
        Main content:
        - pt-14 (padding-top en móvil para el header fijo)
        - md:pt-0 (sin padding en desktop)
      */}
      <main className="flex-1 overflow-x-hidden pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;