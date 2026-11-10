# La Clave 981

Plataforma web full stack para **La Clave 981**, una asociación cultural: web pública, área de socios, venta de entradas para eventos con pago online y panel de administración completo.

🔗 **Web en producción:** [la-clave-asociacion.vercel.app](https://la-clave-asociacion.vercel.app)

## Funcionalidades

**Parte pública**
- Agenda de eventos, galería de fotos por álbumes, normativa y formulario de contacto
- Solicitud de alta como socio, con revisión y aprobación por parte de la asociación
- Registro, inicio de sesión y recuperación de contraseña

**Área de socios**
- Compra de entradas para eventos con pago por **Stripe**
- Entradas con **código QR** que se validan en la puerta
- Perfil de usuario y listado de "Mis entradas"
- Notificaciones push y por email

**Panel de administración**
- Gestión de eventos (borradores, publicación, artistas, géneros y salas)
- Gestión de socios y solicitudes de alta
- Reservas, pagos y verificación de entradas por QR
- Galería con subida y optimización de imágenes
- Estadísticas de eventos, reservas y pagos
- Exportación de socios, eventos y reservas a CSV y PDF
- Registro de actividad

**Tareas automáticas (cron):** recordatorios de eventos, agenda mensual por email, detección de impagos y limpieza de tokens caducados.

## Stack

| Parte | Tecnologías |
| --- | --- |
| Frontend | React 19, Vite, React Router, TanStack Query, Zustand, React Hook Form, Tailwind CSS |
| Backend | Node.js, Express 5, API REST |
| Base de datos | MySQL |
| Autenticación y seguridad | JWT, bcrypt, Helmet, rate limiting, validación con express-validator |
| Pagos | Stripe (Checkout y webhooks) |
| Otros | Nodemailer / Brevo (emails), Web Push, Multer + Sharp (imágenes), PDFKit y json2csv (exportaciones), node-cron |
| Despliegue | Vercel (frontend) y Railway (backend) |

## Estructura

```
backend/    API REST en Express (rutas, controladores, modelos, servicios)
frontend/   Aplicación React + Vite
reset_db.sql  Script para vaciar la base de datos de desarrollo
```

## Puesta en marcha en local

Requisitos: Node.js 20 o superior y MySQL.

```bash
# Backend
cd backend
npm install
cp .env.example .env   # rellena las variables (ver backend/docs/ENVIRONMENT_VARIABLES.md)
# crea la base de datos e importa los scripts de src/migrations/ en orden (001, 002…)
npm run dev

# Frontend (en otra terminal)
cd frontend
npm install
# crea frontend/.env.local con VITE_API_URL y VITE_BASE_URL apuntando a tu backend local
npm run dev
```

## Autor

Diego Pazos Pérez · [LinkedIn](https://www.linkedin.com/in/diego-pazos-perez/) · [GitHub](https://github.com/Sozap9)
