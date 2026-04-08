import { createBrowserRouter } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RecuperarPassword from "./pages/RecuperarPassword";
import Events from "./pages/Events";
import Profile from "./pages/Profile";
import Gallery from "./pages/Gallery";
import GalleryAlbum from "./pages/GalleryAlbum";
import MisEntradas from "./pages/MisEntradas";

// Admin imports
import AdminLayout from "./components/admin/AdminLayout";
import ProtectedRoute from "./components/admin/ProtectedRoute";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminDraftEvents from "./pages/admin/AdminDraftEvents";
import AdminEventForm from "./pages/admin/AdminEventForm";
import AdminSocios from "./pages/admin/AdminSocios";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminVerifyQR from "./pages/admin/AdminVerifyQR";
import AdminCreateSocio from "./pages/admin/AdminCreateSocio";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminPaymentsMonthly from "./pages/admin/AdminPaymentsMonthly";
import AdminActivity from "./pages/admin/AdminActivity";
import AdminStatsDetailed from "./pages/admin/AdminStatsDetailed";
import AdminPlaceholder from "./pages/admin/AdminPlaceholder";
import AdminStatsGenerales from "./pages/admin/AdminStatsGenerales";
import AdminStatsEventos from "./pages/admin/AdminStatsEventos";
import AdminStatsReservas from "./pages/admin/AdminStatsReservas";
import AdminStatsPagos from "./pages/admin/AdminStatsPagos";
import AdminStatsGaleria from "./pages/admin/AdminStatsGaleria";
import AdminGallery from "./pages/admin/AdminGallery";
import AdminGalleryImages from "./pages/admin/AdminGalleryImages";
import AdminSolicitudes from "./pages/admin/AdminSolicitudes";

// Exports individuales
import AdminExportSocios from "./pages/admin/AdminExportSocios";
import AdminExportUsuarios from "./pages/admin/AdminExportUsuarios";
import AdminExportEventos from "./pages/admin/AdminExportEventos";
import AdminExportReservas from "./pages/admin/AdminExportReservas";

const ComingSoon = ({ title }) => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-gradient mb-4">{title}</h1>
      <p className="text-gray-400 text-xl">Próximamente disponible</p>
    </div>
  </div>
);

export const router = createBrowserRouter([
  // RUTAS PÚBLICAS
  {
    path: "/",
    element: (
      <Layout>
        <Home />
      </Layout>
    ),
  },
  {
    path: "/login",
    element: (
      <Layout>
        <Login />
      </Layout>
    ),
  },

  // Única ruta de registro = solicitud de membresía
  {
    path: "/registro",
    element: (
      <Layout>
        <Register />
      </Layout>
    ),
  },

  {
    path: "/estatutos",
    element: (
      <Layout>
        <ComingSoon title="Estatutos" />
      </Layout>
    ),
  },
  {
    path: "/ubicacion",
    element: (
      <Layout>
        <ComingSoon title="Ubicación" />
      </Layout>
    ),
  },
  {
    path: "/privacidad",
    element: (
      <Layout>
        <ComingSoon title="Política de Privacidad" />
      </Layout>
    ),
  },
  {
    path: "/terminos",
    element: (
      <Layout>
        <ComingSoon title="Términos y Condiciones" />
      </Layout>
    ),
  },
  {
    path: "/recuperar-password",
    element: (
      <Layout>
        <RecuperarPassword />
      </Layout>
    ),
  },

  // RUTAS PROTEGIDAS (autenticación requerida)
  {
    path: "/perfil",
    element: (
      <ProtectedRoute>
        <Layout>
          <Profile />
        </Layout>
      </ProtectedRoute>
    ),
  },

  // RUTAS SOLO PARA SOCIOS Y ADMIN
  {
    path: "/eventos",
    element: (
      <ProtectedRoute requireSocio>
        <Layout>
          <Events />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/galeria",
    element: (
      <ProtectedRoute requireSocio>
        <Layout>
          <Gallery />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/galeria/:slug",
    element: (
      <ProtectedRoute requireSocio>
        <Layout>
          <GalleryAlbum />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/mis-entradas",
    element: (
      <ProtectedRoute requireSocio>
        <Layout>
          <MisEntradas />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/panel",
    element: (
      <ProtectedRoute requireSocio>
        <Layout>
          <ComingSoon title="Panel de Socio" />
        </Layout>
      </ProtectedRoute>
    ),
  },

  // RUTAS DE ADMIN
  {
    path: "/admin",
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout>
          <AdminDashboard />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },

  // Eventos
  {
    path: "/admin/eventos",
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout>
          <AdminEvents />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/eventos/borradores",
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout>
          <AdminDraftEvents />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/eventos/nuevo",
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout>
          <AdminEventForm />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/eventos/editar/:id",
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout>
          <AdminEventForm />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },

  // Socios
  {
    path: "/admin/socios",
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout>
          <AdminSocios />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/socios/crear",
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout>
          <AdminCreateSocio />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },

  // Solicitudes ✨ NUEVO
  {
    path: "/admin/solicitudes",
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout>
          <AdminSolicitudes />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },

  // Reservas
  {
    path: "/admin/reservas",
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout>
          <AdminBookings />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/reservas/verificar-qr",
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout>
          <AdminVerifyQR />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },

  // Pagos
  {
    path: "/admin/pagos",
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout>
          <AdminPayments />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/pagos/mensuales",
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
    path: "/admin/stats/dashboard",
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout>
          <AdminStatsDetailed />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/stats/generales",
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout>
          <AdminStatsGenerales />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/stats/eventos",
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout>
          <AdminStatsEventos />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/stats/reservas",
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout>
          <AdminStatsReservas />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/stats/pagos",
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout>
          <AdminStatsPagos />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/stats/galeria",
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
    path: "/admin/actividad",
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
    path: "/admin/galeria",
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout>
          <AdminGallery />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/galeria/:folderId/imagenes",
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout>
          <AdminGalleryImages />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },

  // Exportaciones
  {
    path: "/admin/export/socios",
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout>
          <AdminExportSocios />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/export/usuarios",
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout>
          <AdminExportUsuarios />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/export/eventos",
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout>
          <AdminExportEventos />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/export/reservas",
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout>
          <AdminExportReservas />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },

  // 404
  {
    path: "*",
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