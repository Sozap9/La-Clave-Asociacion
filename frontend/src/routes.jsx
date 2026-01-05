import { createBrowserRouter } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import RegisterSocio from './pages/RegisterSocio';
import Events from './pages/Events';
import Profile from './pages/Profile';
import UpgradeToSocio from './pages/UpgradeToSocio';
import Gallery from './pages/Gallery';
import GalleryAlbum from './pages/GalleryAlbum';

// Admin imports
import AdminLayout from './components/admin/AdminLayout';
import ProtectedRoute from './components/admin/ProtectedRoute';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminEvents from './pages/admin/AdminEvents';
import AdminEventForm from './pages/admin/AdminEventForm';
import AdminSocios from './pages/admin/AdminSocios';
import AdminBookings from './pages/admin/AdminBookings';
import AdminVerifyQR from './pages/admin/AdminVerifyQR';
import AdminCreateSocio from './pages/admin/AdminCreateSocio';
import AdminUsuarios from './pages/admin/AdminUsuarios';
import AdminPayments from './pages/admin/AdminPayments';
import AdminPaymentsMonthly from './pages/admin/AdminPaymentsMonthly';
import AdminSociosMorosos from './pages/admin/AdminSociosMorosos';
import AdminActivity from './pages/admin/AdminActivity';
import AdminStatsDetailed from './pages/admin/AdminStatsDetailed';
import AdminPlaceholder from './pages/admin/AdminPlaceholder';
import AdminStatsGenerales from './pages/admin/AdminStatsGenerales';
import AdminStatsEventos from './pages/admin/AdminStatsEventos';
import AdminStatsReservas from './pages/admin/AdminStatsReservas';
import AdminStatsPagos from './pages/admin/AdminStatsPagos';
import AdminStatsGaleria from './pages/admin/AdminStatsGaleria';
import AdminGallery from './pages/admin/AdminGallery';
import AdminGalleryImages from './pages/admin/AdminGalleryImages';

// Exports individuales
import AdminExportSocios from './pages/admin/AdminExportSocios';
import AdminExportUsuarios from './pages/admin/AdminExportUsuarios';
import AdminExportEventos from './pages/admin/AdminExportEventos';
import AdminExportReservas from './pages/admin/AdminExportReservas';

// Componente temporal para rutas que aún no existen
const ComingSoon = ({ title }) => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-gradient mb-4">{title}</h1>
      <p className="text-gray-400 text-xl">Próximamente disponible</p>
    </div>
  </div>
);

export const router = createBrowserRouter([
  // ============================================
  // RUTAS PÚBLICAS
  // ============================================
  {
    path: '/',
    element: <Layout><Home /></Layout>,
  },
  {
    path: '/login',
    element: <Layout><Login /></Layout>,
  },
  {
    path: '/registro',
    element: <Layout><Register /></Layout>,
  },
  {
    path: '/registro-socio',
    element: <Layout><RegisterSocio /></Layout>,
  },
  {
    path: '/estatutos',
    element: <Layout><ComingSoon title="Estatutos" /></Layout>,
  },
  {
    path: '/ubicacion',
    element: <Layout><ComingSoon title="Ubicación" /></Layout>,
  },
  {
    path: '/privacidad',
    element: <Layout><ComingSoon title="Política de Privacidad" /></Layout>,
  },
  {
    path: '/terminos',
    element: <Layout><ComingSoon title="Términos y Condiciones" /></Layout>,
  },
  {
    path: '/recuperar-password',
    element: <Layout><ComingSoon title="Recuperar Contraseña" /></Layout>,
  },

  // ============================================
  // RUTAS PROTEGIDAS (Requieren autenticación)
  // ============================================
  {
    path: '/perfil',
    element: (
      <ProtectedRoute>
        <Layout><Profile /></Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/mejorar-cuenta',
    element: (
      <ProtectedRoute>
        <Layout><UpgradeToSocio /></Layout>
      </ProtectedRoute>
    ),
  },

  // ============================================
  // RUTAS SOLO PARA SOCIOS Y ADMIN
  // ============================================
  {
    path: '/eventos',
    element: (
      <ProtectedRoute requireSocio>
        <Layout><Events /></Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/galeria',
    element: (
      <ProtectedRoute requireSocio>
        <Layout><Gallery /></Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/galeria/:slug',
    element: (
      <ProtectedRoute requireSocio>
        <Layout><GalleryAlbum /></Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/mis-reservas',
    element: (
      <ProtectedRoute requireSocio>
        <Layout><ComingSoon title="Mis Reservas" /></Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/panel',
    element: (
      <ProtectedRoute requireSocio>
        <Layout><ComingSoon title="Panel de Socio" /></Layout>
      </ProtectedRoute>
    ),
  },

  // ============================================
  // RUTAS DE ADMIN (SOLO ADMINISTRADORES)
  // ============================================
  {
    path: '/admin',
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout>
          <AdminDashboard />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },

  // Gestión de Eventos
  {
    path: '/admin/eventos',
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout>
          <AdminEvents />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/eventos/nuevo',
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout>
          <AdminEventForm />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/eventos/editar/:id',
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout>
          <AdminEventForm />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },

  // Gestión de Socios
  {
    path: '/admin/socios',
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout>
          <AdminSocios />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/socios/crear',
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout>
          <AdminCreateSocio />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/socios/morosos',
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout>
          <AdminSociosMorosos />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },

  // Gestión de Usuarios
  {
    path: '/admin/usuarios',
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout>
          <AdminUsuarios />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/usuarios/ver',
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout>
          <AdminPlaceholder title="Ver Usuario" />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },

  // Gestión de Reservas
  {
    path: '/admin/reservas',
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout>
          <AdminBookings />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/reservas/verificar-qr',
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout>
          <AdminVerifyQR />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },

  // Gestión de Pagos
  {
    path: '/admin/pagos',
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout>
          <AdminPayments />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/pagos/mensuales',
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout>
          <AdminPaymentsMonthly />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },

  // Estadísticas
  {
    path: '/admin/stats/dashboard',
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout>
          <AdminStatsDetailed />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/stats/generales',
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout>
          <AdminStatsGenerales />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/stats/eventos',
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout>
          <AdminStatsEventos />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/stats/reservas',
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout>
          <AdminStatsReservas />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/stats/pagos',
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout>
          <AdminStatsPagos />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/stats/galeria',
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout>
          <AdminStatsGaleria />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },

  // Actividad
  {
    path: '/admin/actividad',
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout>
          <AdminActivity />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },

  // Galería
  {
    path: '/admin/galeria',
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout>
          <AdminGallery />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/galeria/:folderId/imagenes',
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout>
          <AdminGalleryImages />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },

  // Exportaciones (PÁGINAS INDIVIDUALES)
  {
    path: '/admin/export/socios',
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout>
          <AdminExportSocios />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/export/usuarios',
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout>
          <AdminExportUsuarios />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/export/eventos',
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout>
          <AdminExportEventos />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/export/reservas',
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout>
          <AdminExportReservas />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },

  // ============================================
  // 404 - PÁGINA NO ENCONTRADA
  // ============================================
  {
    path: '*',
    element: (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-primary-500 mb-4">404</h1>
            <p className="text-gray-400 text-xl mb-6">Página no encontrada</p>
            <a href="/" className="text-primary-400 hover:text-primary-300">
              Volver al inicio
            </a>
          </div>
        </div>
      </Layout>
    ),
  },
]);
