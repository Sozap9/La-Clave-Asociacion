// Constantes de la aplicación
export const APP_NAME = 'La Clave';

// URLs de redes sociales (temporales - actualizar luego)
export const SOCIAL_LINKS = {
  whatsapp: '',
  soundcloud: 'https://soundcloud.com/hochspannung12',
  youtube: '',
  facebook: '',
  instagram: 'https://www.instagram.com/essenzclub/'
};

// Links del footer
export const FOOTER_LINKS = {
  privacy: '/privacidad',
  terms: '/terminos',
  statutes: '/estatutos',
  location: 'https://maps.app.goo.gl/XK1mSxFxQnQvSMod6'
};

// Rutas de navegación
export const NAV_ROUTES = {
  HOME: '/',
  EVENTS: '/eventos',
  GALLERY: '/galeria',
  STATUTES: '/estatutos',
  LOGIN: '/login',
  REGISTER: '/registro',       // Única ruta de registro (solicitud de socio)
  DASHBOARD: '/',
  PROFILE: '/perfil',
  MY_BOOKINGS: '/mis-entradas',
  ADMIN: '/admin',
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