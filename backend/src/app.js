import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import path from "path";
import { fileURLToPath } from "url";
import { apiLimiter } from "./middleware/rateLimiter.js";
import logger from "./config/logger.js";
import httpLogger from "./middleware/httpLogger.js";
import { CARPETAS_PRIVADAS } from "./utils/documentos.js";

// __dirname en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Detrás del proxy de Railway
app.set('trust proxy', 1);


// Seguridad (el orden importa)


// Helmet, permitiendo cargar las imágenes desde otro origen
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS
const corsOptions = {
  origin: function(origin, callback) {
    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:3006",
      "http://localhost:3000",
      "https://www.laclave981.com",
      "https://laclave981.com",
      process.env.FRONTEND_URL
    ].filter(Boolean);

    // Sin origin (curl), orígenes de la lista y subdominios de pages.dev,
    // workers.dev y vercel.app (las previews de Vercel)
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      /\.pages\.dev$/.test(origin) ||
      /\.workers\.dev$/.test(origin) ||
      /\.vercel\.app$/.test(origin)
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Gzip
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024
}));

// Archivos subidos. Los DNI no son públicos: se piden por la API con sesión
app.use(
  CARPETAS_PRIVADAS.map((carpeta) => `/uploads/${carpeta}`),
  (req, res) => res.status(404).end(),
);
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));


// Log HTTP
if (process.env.NODE_ENV !== 'test') {
  app.use(httpLogger);
}

if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    logger.debug(`${req.method} ${req.path}`, {
      query: req.query,
      body: req.body
    });
    next();
  });
}

// Límite de peticiones
app.use('/api/', apiLimiter);

// Rutas que van antes de los body parsers
import publicEventRoutes from "./routes/publicEventRoutes.js";

app.use("/api/events", publicEventRoutes);


import eventRoutes from "./routes/eventRoutes.js";

// Eventos del admin: FormData con multer
app.use("/api/admin/events", eventRoutes);

// Webhook de Stripe: necesita el body sin parsear para comprobar la firma
import webhookRoutes from "./routes/webhookRoutes.js";
app.use("/api/webhooks", webhookRoutes);


// Body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Resto de rutas
import galleryRoutes from "./routes/galleryRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import socioRoutes from "./routes/socioRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import artistRoutes from "./routes/artistRoutes.js";
import venueRoutes from "./routes/venueRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import pushRoutes from "./routes/pushRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";

// Galería oculta: solo se monta con GALLERY_ENABLED=true (si no, 404)
if (process.env.GALLERY_ENABLED === "true") {
  app.use("/api/gallery", galleryRoutes);
} else {
  app.use("/api/gallery", (req, res) =>
    res.status(404).json({ success: false, message: "Recurso no disponible" })
  );
}

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/socios", socioRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/artists", artistRoutes);
app.use("/api/venues", venueRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/push", pushRoutes);
app.use("/api/contact", contactRoutes);

// Raíz
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "La Clave - API Backend",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development"
  });
});


// 404
app.use((req, res) => {
  logger.warn('Route not found', {
    method: req.method,
    path: req.path,
    ip: req.ip
  });
  
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.path
  });
});

// Errores
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    user: req.user?.id || 'guest'
  });
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      error: err 
    })
  });
});

export default app;