// Constantes de la aplicación
export const APP_NAME = 'La Clave';

// URLs de redes sociales (temporales - actualizar luego)
export const SOCIAL_LINKS = {
  whatsapp: 'https://wa.me/34600000000',
  soundcloud: 'https://soundcloud.com/laclave',
  youtube: 'https://youtube.com/@laclave',
  facebook: 'https://facebook.com/laclave',
  instagram: 'https://instagram.com/laclave'
};

// Links del footer
export const FOOTER_LINKS = {
  privacy: '/privacidad',
  terms: '/terminos',
  statutes: '/estatutos',
  location: '/ubicacion'
};

// Rutas de navegación
export const NAV_ROUTES = {
  HOME: '/',
  EVENTS: '/eventos',
  GALLERY: '/galeria',
  STATUTES: '/estatutos',
  LOGIN: '/login',
  REGISTER: '/registro',
  REGISTER_SOCIO: '/registro-socio',
  DASHBOARD: '/panel',
  PROFILE: '/perfil',
  MY_BOOKINGS: '/mis-reservas',
  UPGRADE: '/mejorar-cuenta',
  ADMIN: '/admin'
};

// Roles de usuario
export const USER_ROLES = {
  BASICO: 'basico',
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
