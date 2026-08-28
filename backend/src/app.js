import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import path from "path";
import { fileURLToPath } from "url";
import { apiLimiter } from "./middleware/rateLimiter.js";
import logger from "./config/logger.js";
import httpLogger from "./middleware/httpLogger.js";
import CronService from "./services/cronService.js";

// __dirname CONFIGURATION FOR ES MODULES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CREATE APP
const app = express();

// TRUST PROXY
app.set('trust proxy', 1);


// SECURITY MIDDLEWARES (ORDER MATTERS)


/**
 * 1. HELMET - Security headers
 * Permitir cross-origin para imágenes
 */
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

/**
 * 2. CORS - Permitir múltiples orígenes
 */
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

    // Permitir sin origin (ej: Postman, curl), orígenes permitidos, y subdominios de
    // pages.dev / workers.dev / vercel.app (incluye previews con prefijo, ej:
    // la-clave-asociacion-bb75ywlks-sozap9s-projects.vercel.app)
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

/**
 * 3. COMPRESSION - GZIP
 */
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

/**
 * 4. STATIC FILES
 */
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));


// HTTP LOGGING WITH WINSTON
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

// RATE LIMITING
app.use('/api/', apiLimiter);

// PUBLIC ROUTES (NO AUTH) - BEFORE BODY PARSERS
import publicEventRoutes from "./routes/publicEventRoutes.js";

// Public event routes (no authentication required)
app.use("/api/events", publicEventRoutes);


// FORMDATA/MULTER ROUTES - BEFORE BODY PARSERS
import eventRoutes from "./routes/eventRoutes.js";

// Admin routes with FormData (BEFORE express.json)
app.use("/api/admin/events", eventRoutes);

// WEBHOOK DE STRIPE - BEFORE BODY PARSERS
// Stripe necesita el body en crudo (sin parsear) para verificar la firma
// del webhook (ver webhookRoutes.js: usa express.raw internamente). Si
// esto se montara después de express.json(), el body ya vendría parseado
// como objeto y la verificación de firma fallaría siempre.
import webhookRoutes from "./routes/webhookRoutes.js";
app.use("/api/webhooks", webhookRoutes);


// BODY PARSER - AFTER FormData routes
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// OTHER ROUTES (JSON + FormData mixed) - AFTER body parsers
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

// Gallery routes (handles both JSON and FormData via multer)
app.use("/api/gallery", galleryRoutes);

// Main routes (JSON)
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/socios", socioRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/artists", artistRoutes);
app.use("/api/venues", venueRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/push", pushRoutes);
app.use("/api/contact", contactRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "La Clave - API Backend",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development"
  });
});


// 404 HANDLER
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

// GLOBAL ERROR HANDLER
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

// TAREAS PROGRAMADAS (CRON)
if (process.env.NODE_ENV !== 'test') {
  CronService.init();
}

export default app;