// Constantes de la aplicación
export const APP_NAME = 'La Clave';


// Links del footer
export const FOOTER_LINKS = {
  privacy: '/privacidad',
  terms: '/terminos',
  normativa: '/normativa',
  contact: '/contacto'
};

// Rutas de navegación
export const NAV_ROUTES = {
  HOME: '/',
  EVENTS: '/eventos',
  GALLERY: '/galeria',
  NORMATIVA: '/normativa',
  LOGIN: '/login',
  REGISTER: '/registro',       // Única ruta de registro (solicitud de socio)
  DASHBOARD: '/',
  PROFILE: '/perfil',
  MY_BOOKINGS: '/mis-entradas',
  ADMIN: '/admin',
  CONTACT: '/contacto',
  ADMIN_SOLICITUDES: '/admin/solicitudes',
};

// Roles de usuario
export const USER_ROLES = {
  SOCIO: 'socio',
  ADMIN: 'admin'
};

// Permisos por funcionalidad
export const PERMISSIONS = {
  VIEW_EVENTS: [USER_ROLES.SOCIO, USER_ROLES.ADMIN],
  BOOK_EVENTS: [USER_ROLES.SOCIO, USER_ROLES.ADMIN],
  VIEW_GALLERY: [USER_ROLES.SOCIO, USER_ROLES.ADMIN],
  ACCESS_ADMIN: [USER_ROLES.ADMIN]
};

// Interruptores de funcionalidades
// Galería oculta (NO borrada): poner GALLERY_ENABLED a true para volver a mostrarla en toda la web
export const FEATURES = {
  GALLERY_ENABLED: false,
};