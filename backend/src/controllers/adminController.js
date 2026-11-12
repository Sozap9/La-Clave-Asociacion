import { query, transaction } from "../config/database.js";
import User from "../models/User.js";
import Socio from "../models/Socio.js";
import SolicitudSocio from "../models/SolicitudSocio.js"; 
import Event from "../models/Event.js";
import Booking from "../models/Booking.js";
import EventTicketTier from "../models/EventTicketTier.js";
import Payment from "../models/Payment.js";
import Gallery from "../models/Gallery.js";
import PDFDocument from "pdfkit";
import { createListPdf, drawTable, finishPdf, STATUS_COLORS } from "../utils/pdfTable.js";
import EmailService from "../services/emailService.js"; 
import { generateQRCodeBase64 } from "../utils/qrCodeGenerator.js";
import logger from "../config/logger.js"; 
import { registrarActividad, getIpFromRequest } from "../utils/activityLogger.js";

// Estadísticas y dashboard

/**
 * Obtener estadísticas generales del sistema
 * GET /api/admin/stats
 */
export const getGeneralStats = async (req, res) => {
  try {
    // totalUsuarios no cuenta admins
    const usersSql = `
      SELECT 
        COUNT(CASE WHEN role = 'basico' THEN 1 END) as total_usuarios_basicos,
        COUNT(CASE WHEN role = 'socio' THEN 1 END) as total_socios_role
      FROM users
      WHERE activo = true
    `;
    const usersResult = await query(usersSql);

    const eventosSql = `
      SELECT 
        COUNT(CASE WHEN fecha_evento >= CURDATE() THEN 1 END) as eventos_proximos,
        COUNT(CASE WHEN fecha_evento < CURDATE() THEN 1 END) as eventos_realizados
      FROM events
    `;
    const eventosResult = await query(eventosSql);

    // Se suman entradas (numero_entradas), no reservas, para cuadrar con la
    // asistencia de cada evento
    const reservasSql = `
      SELECT 
        SUM(CASE WHEN estado IN ('confirmada', 'asistida') THEN numero_entradas ELSE 0 END) as reservas_activas
      FROM bookings
    `;
    const reservasResult = await query(reservasSql);

    // Socios desde la tabla socios, sin filtrar por rol: un admin también es
    // socio (ver updateUserRole)
    const sociosSql = `
      SELECT 
        COUNT(*) as total_socios,
        COUNT(CASE WHEN estado = 'activo' THEN 1 END) as socios_activos
      FROM socios
    `;
    const sociosResult = await query(sociosSql);

    return res.status(200).json({
      success: true,
      data: {
        totalEventos:
          eventosResult[0].eventos_proximos +
          eventosResult[0].eventos_realizados,
        // Sin admins
        totalUsuarios:
          usersResult[0].total_usuarios_basicos +
          usersResult[0].total_socios_role,
        totalReservas: reservasResult[0].reservas_activas || 0,
        totalSocios: sociosResult[0].total_socios || 0,
        sociosActivos: sociosResult[0].socios_activos || 0,
      },
    });
  } catch (error) {
    logger.error("Error en getGeneralStats:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Obtener estadísticas completas del dashboard
 * GET /api/admin/dashboard/stats
 */
export const getDashboardStats = async (req, res) => {
  try {
    // Usuarios y socios
    const usersSql = `
      SELECT 
        COUNT(CASE WHEN role = 'basico' THEN 1 END) as total_usuarios_basicos,
        COUNT(CASE WHEN role = 'socio' THEN 1 END) as total_socios,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as total_admins,
        COUNT(CASE WHEN role = 'basico' AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as nuevos_usuarios_mes,
        COUNT(CASE WHEN role = 'socio' AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as nuevos_socios_mes
      FROM users
      WHERE activo = true
    `;
    const usersStats = await query(usersSql);

    const sociosSql = `
      SELECT 
        COUNT(*) as total_socios,
        COUNT(CASE WHEN estado = 'activo' THEN 1 END) as socios_activos,
        COUNT(CASE WHEN estado = 'moroso' THEN 1 END) as socios_morosos,
        COUNT(CASE WHEN estado = 'cancelado' THEN 1 END) as socios_baja
      FROM socios
    `;
    const sociosStats = await query(sociosSql);

    const solicitudesPendientes = await SolicitudSocio.countPendientes();

    // Eventos
    const eventosSql = `
      SELECT 
        COUNT(*) as total_eventos,
        COUNT(CASE WHEN estado = 'scheduled' THEN 1 END) as publicados,
        COUNT(CASE WHEN estado = 'draft' THEN 1 END) as borradores,
        COUNT(CASE WHEN estado = 'cancelled' THEN 1 END) as cancelados,
        COUNT(CASE WHEN fecha_evento >= CURDATE() AND estado = 'scheduled' THEN 1 END) as proximos,
        COUNT(CASE WHEN fecha_evento < CURDATE() AND estado = 'scheduled' THEN 1 END) as pasados,
        AVG(CASE WHEN aforo_maximo > 0 THEN (entradas_reservadas / aforo_maximo * 100) END) as ocupacion_promedio
      FROM events
    `;
    const eventosStats = await query(eventosSql);

    const topEventosSql = `
      SELECT 
        id, titulo, fecha_evento, aforo_maximo, entradas_reservadas,
        ROUND((entradas_reservadas / aforo_maximo * 100), 2) as porcentaje_ocupacion
      FROM events
      WHERE aforo_maximo > 0
        AND estado IN ('scheduled', 'completed')
      ORDER BY entradas_reservadas DESC
      LIMIT 5
    `;
    const topEventos = await query(topEventosSql);

    const proximosEventosSql = `
      SELECT 
        id, titulo, fecha_evento, hora_evento, aforo_maximo, 
        entradas_reservadas, entradas_disponibles
      FROM events
      WHERE fecha_evento >= CURDATE() AND estado = 'scheduled'
      ORDER BY fecha_evento ASC, hora_evento ASC
      LIMIT 5
    `;
    const proximosEventos = await query(proximosEventosSql);

    // Reservas
    const reservasSql = `
      SELECT 
        COUNT(*) as total_reservas,
        COUNT(CASE WHEN estado = 'confirmada' THEN 1 END) as confirmadas,
        COUNT(CASE WHEN estado = 'cancelada' THEN 1 END) as canceladas,
        COUNT(CASE WHEN asistencia = 1 THEN 1 END) as asistidas,
        COUNT(CASE WHEN DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as reservas_esta_semana,
        COUNT(CASE WHEN DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as reservas_este_mes,
        SUM(CASE WHEN estado = 'confirmada' THEN numero_entradas ELSE 0 END) as entradas_vendidas_total,
        SUM(CASE WHEN estado = 'confirmada' AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN numero_entradas ELSE 0 END) as entradas_vendidas_mes
      FROM bookings
    `;
    const reservasStats = await query(reservasSql);

    // Ingresos
    const ingresosSql = `
      SELECT 
        SUM(CASE WHEN MONTH(fecha_pago) = MONTH(CURDATE()) AND YEAR(fecha_pago) = YEAR(CURDATE()) THEN amount ELSE 0 END) as ingresos_mes_actual,
        SUM(CASE WHEN MONTH(fecha_pago) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND YEAR(fecha_pago) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) THEN amount ELSE 0 END) as ingresos_mes_anterior,
        SUM(CASE WHEN YEAR(fecha_pago) = YEAR(CURDATE()) THEN amount ELSE 0 END) as ingresos_año_actual,
        COUNT(CASE WHEN MONTH(fecha_pago) = MONTH(CURDATE()) AND YEAR(fecha_pago) = YEAR(CURDATE()) THEN 1 END) as pagos_mes_actual
      FROM payments
      WHERE estado = 'exitoso'
    `;
    const ingresosStats = await query(ingresosSql);

    const ingresosMesActual =
      parseFloat(ingresosStats[0].ingresos_mes_actual) || 0;
    const ingresosMesAnterior =
      parseFloat(ingresosStats[0].ingresos_mes_anterior) || 0;
    const comparativaMes =
      ingresosMesAnterior > 0
        ? (
            ((ingresosMesActual - ingresosMesAnterior) / ingresosMesAnterior) *
            100
          ).toFixed(2)
        : 0;

    const ingresosDiariosSql = `
      SELECT 
        DATE(fecha_pago) as fecha,
        SUM(amount) as total
      FROM payments
      WHERE fecha_pago >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        AND estado = 'exitoso'
      GROUP BY DATE(fecha_pago)
      ORDER BY fecha ASC
    `;
    const ingresosDiarios = await query(ingresosDiariosSql);

    // Galería
    let galeriaStats = [
      {
        total_folders: 0,
        total_imagenes: 0,
        espacio_usado_kb: 0,
        folders_visibles: 0,
        folders_destacados: 0,
      },
    ];

    try {
      const galeriaSql = `
        SELECT 
          COUNT(DISTINCT gf.id) as total_folders,
          COUNT(gi.id) as total_imagenes,
          SUM(gi.tamano_kb) as espacio_usado_kb,
          COUNT(CASE WHEN gf.visible = true THEN gf.id END) as folders_visibles,
          COUNT(CASE WHEN gf.destacado = true THEN gf.id END) as folders_destacados
        FROM gallery_folders gf
        LEFT JOIN gallery_images gi ON gf.id = gi.folder_id
      `;
      galeriaStats = await query(galeriaSql);
    } catch (err) {
      logger.debug("Tablas de galería no existen, usando valores por defecto");
    }

    // Salas y artistas
    let venuesStats = [{ total_venues: 0, venues_activos: 0 }];
    let artistsStats = [
      {
        total_artists: 0,
        artists_activos: 0,
        artists_verificados: 0,
        artists_destacados: 0,
      },
    ];

    try {
      const venuesSql = `
        SELECT 
          COUNT(*) as total_venues,
          COUNT(CASE WHEN activo = true THEN 1 END) as venues_activos
        FROM venues
      `;
      venuesStats = await query(venuesSql);
    } catch (err) {
      logger.debug("Tabla venues no existe");
    }

    try {
      const artistsSql = `
        SELECT 
          COUNT(*) as total_artists,
          COUNT(CASE WHEN activo = true THEN 1 END) as artists_activos,
          COUNT(CASE WHEN verificado = true THEN 1 END) as artists_verificados,
          COUNT(CASE WHEN destacado = true THEN 1 END) as artists_destacados
        FROM artists
      `;
      artistsStats = await query(artistsSql);
    } catch (err) {
      logger.debug("Tabla artists no existe");
    }

    // Actividad reciente
    const tableCheckSql = `SHOW TABLES LIKE 'activity_log'`;
    const tableExists = await query(tableCheckSql);

    let actividadReciente = [];

    if (tableExists.length > 0) {
      const actividadSql = `
        SELECT 
          a.accion, a.entidad_tipo AS entidad, a.descripcion, a.created_at,
          u.nombre
        FROM activity_log a
        LEFT JOIN users u ON a.user_id = u.id
        ORDER BY a.created_at DESC
        LIMIT 10
      `;
      actividadReciente = await query(actividadSql);
    }

    return res.status(200).json({
      success: true,
      data: {
        usuarios: {
          basicos: usersStats[0].total_usuarios_basicos,
          socios: usersStats[0].total_socios,
          admins: usersStats[0].total_admins,
          nuevos_usuarios_mes: usersStats[0].nuevos_usuarios_mes,
          nuevos_socios_mes: usersStats[0].nuevos_socios_mes,
        },
        socios: {
          total: sociosStats[0].total_socios,
          activos: sociosStats[0].socios_activos,
          morosos: sociosStats[0].socios_morosos,
          baja: sociosStats[0].socios_baja,
          solicitudes_pendientes: solicitudesPendientes,
        },
        eventos: {
          total: eventosStats[0].total_eventos,
          publicados: eventosStats[0].publicados,
          borradores: eventosStats[0].borradores,
          cancelados: eventosStats[0].cancelados,
          proximos: eventosStats[0].proximos,
          pasados: eventosStats[0].pasados,
          ocupacion_promedio: parseFloat(
            eventosStats[0].ocupacion_promedio || 0,
          ).toFixed(2),
          top_eventos: topEventos,
          proximos_eventos: proximosEventos,
        },
        reservas: {
          total: reservasStats[0].total_reservas,
          confirmadas: reservasStats[0].confirmadas,
          canceladas: reservasStats[0].canceladas,
          asistidas: reservasStats[0].asistidas,
          esta_semana: reservasStats[0].reservas_esta_semana,
          este_mes: reservasStats[0].reservas_este_mes,
          entradas_vendidas_total: parseInt(reservasStats[0].entradas_vendidas_total) || 0,
          entradas_vendidas_mes: parseInt(reservasStats[0].entradas_vendidas_mes) || 0,
        },
        ingresos: {
          mes_actual: ingresosMesActual,
          mes_anterior: ingresosMesAnterior,
          comparativa_mes: parseFloat(comparativaMes),
          año_actual: parseFloat(ingresosStats[0].ingresos_año_actual || 0),
          pagos_mes_actual: ingresosStats[0].pagos_mes_actual,
          grafica_diaria: ingresosDiarios.map((row) => ({
            fecha: row.fecha,
            total: parseFloat(row.total),
          })),
        },
        galeria: {
          total_folders: galeriaStats[0].total_folders,
          total_imagenes: galeriaStats[0].total_imagenes,
          espacio_usado_mb: (galeriaStats[0].espacio_usado_kb / 1024).toFixed(
            2,
          ),
          folders_visibles: galeriaStats[0].folders_visibles,
          folders_destacados: galeriaStats[0].folders_destacados,
        },
        venues: {
          total: venuesStats[0].total_venues,
          activos: venuesStats[0].venues_activos,
        },
        artists: {
          total: artistsStats[0].total_artists,
          activos: artistsStats[0].artists_activos,
          verificados: artistsStats[0].artists_verificados,
          destacados: artistsStats[0].artists_destacados,
        },
        actividad_reciente: actividadReciente,
      },
    });
  } catch (error) {
    logger.error("Error en getDashboardStats:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas del dashboard",
    });
  }
};

/**
 * Obtener estructura del menú del panel admin
 * GET /api/admin/menu
 */
export const getAdminMenu = async (req, res) => {
  try {
    const menu = {
      success: true,
      data: {
        modules: [
          {
            id: "dashboard",
            name: "Dashboard",
            icon: "dashboard",
            path: "/admin/dashboard",
            endpoint: "/api/admin/dashboard/stats",
            description: "Vista general y estadísticas del sistema",
          },
          {
            id: "users",
            name: "Gestión de Usuarios",
            icon: "users",
            path: "/admin/users",
            description: "Administrar usuarios básicos",
            actions: [
              {
                name: "Listar usuarios",
                method: "GET",
                endpoint: "/api/admin/users",
                filters: ["search", "role", "activo", "email_verified"],
              },
              {
                name: "Ver detalles",
                method: "GET",
                endpoint: "/api/admin/users/:id",
              },
              {
                name: "Desactivar usuario",
                method: "DELETE",
                endpoint: "/api/admin/users/:id",
              },
            ],
          },
          {
            id: "socios",
            name: "Gestión de Socios",
            icon: "badge",
            path: "/admin/socios",
            description: "Administrar membresías de socios",
            actions: [
              {
                name: "Listar socios",
                method: "GET",
                endpoint: "/api/admin/socios",
                filters: ["search", "estado"],
              },
              {
                name: "Socios morosos",
                method: "GET",
                endpoint: "/api/admin/socios/morosos",
              },
              {
                name: "Ver detalles",
                method: "GET",
                endpoint: "/api/admin/socios/:id",
              },
              {
                name: "Crear socio",
                method: "POST",
                endpoint: "/api/admin/socios",
              },
              {
                name: "Actualizar socio",
                method: "PUT",
                endpoint: "/api/admin/socios/:id",
              },
              {
                name: "Dar de baja",
                method: "DELETE",
                endpoint: "/api/admin/socios/:id",
              },
            ],
          },
          {
            id: "events",
            name: "Gestión de Eventos",
            icon: "calendar",
            path: "/admin/events",
            description: "Crear y administrar eventos del club",
            actions: [
              {
                name: "Listar eventos",
                method: "GET",
                endpoint: "/api/admin/events",
                filters: [
                  "search",
                  "estado",
                  "destacado",
                  "dateFrom",
                  "dateTo",
                ],
              },
              {
                name: "Estadísticas de eventos",
                method: "GET",
                endpoint: "/api/admin/events/stats",
              },
              {
                name: "Ver detalles",
                method: "GET",
                endpoint: "/api/admin/events/:id",
              },
              {
                name: "Crear evento",
                method: "POST",
                endpoint: "/api/admin/events",
              },
              {
                name: "Actualizar evento",
                method: "PUT",
                endpoint: "/api/admin/events/:id",
              },
              {
                name: "Eliminar evento",
                method: "DELETE",
                endpoint: "/api/admin/events/:id",
              },
              {
                name: "Cancelar evento",
                method: "PATCH",
                endpoint: "/api/admin/events/:id/cancel",
              },
              {
                name: "Publicar evento",
                method: "PATCH",
                endpoint: "/api/admin/events/:id/publish",
              },
            ],
          },
          {
            id: "bookings",
            name: "Gestión de Reservas",
            icon: "ticket",
            path: "/admin/bookings",
            description: "Administrar reservas de eventos",
            actions: [
              {
                name: "Listar reservas",
                method: "GET",
                endpoint: "/api/admin/bookings",
                filters: ["search", "estado", "event_id", "dateFrom", "dateTo"],
              },
              {
                name: "Estadísticas de reservas",
                method: "GET",
                endpoint: "/api/admin/bookings/stats",
              },
              {
                name: "Ver detalles",
                method: "GET",
                endpoint: "/api/admin/bookings/:id",
              },
              {
                name: "Reservas de un evento",
                method: "GET",
                endpoint: "/api/admin/bookings/event/:eventId",
              },
              {
                name: "Cancelar reserva",
                method: "PATCH",
                endpoint: "/api/admin/bookings/:id/cancel",
              },
              {
                name: "Verificar QR y check-in",
                method: "POST",
                endpoint: "/api/admin/bookings/verify-qr",
              },
            ],
          },
          {
            id: "gallery",
            name: "Gestión de Galería",
            icon: "image",
            path: "/admin/gallery",
            description: "Administrar álbumes y fotos",
            actions: [
              {
                name: "Estadísticas de galería",
                method: "GET",
                endpoint: "/api/admin/gallery/stats",
              },
              {
                name: "Listar álbumes",
                method: "GET",
                endpoint: "/api/gallery/folders",
              },
              {
                name: "Crear álbum",
                method: "POST",
                endpoint: "/api/gallery/folders",
              },
              {
                name: "Subir imagen",
                method: "POST",
                endpoint: "/api/gallery/folders/:folderId/images",
              },
              {
                name: "Eliminar imagen",
                method: "DELETE",
                endpoint: "/api/gallery/images/:id",
              },
            ],
          },
          {
            id: "artists",
            name: "Gestión de Artistas",
            icon: "mic",
            path: "/admin/artists",
            description: "Administrar DJs y artistas",
            actions: [
              {
                name: "Listar artistas",
                method: "GET",
                endpoint: "/api/artists",
                filters: [
                  "search",
                  "genero",
                  "sello",
                  "ciudad",
                  "pais_origen",
                  "verificado",
                  "destacado",
                ],
              },
              {
                name: "Crear artista",
                method: "POST",
                endpoint: "/api/artists",
              },
              {
                name: "Actualizar artista",
                method: "PUT",
                endpoint: "/api/artists/:id",
              },
              {
                name: "Marcar como destacado",
                method: "PATCH",
                endpoint: "/api/artists/:id/featured",
              },
            ],
          },
          {
            id: "venues",
            name: "Gestión de Venues",
            icon: "building",
            path: "/admin/venues",
            description: "Administrar locales y lugares",
            actions: [
              {
                name: "Listar venues",
                method: "GET",
                endpoint: "/api/venues",
                filters: ["search", "ciudad", "tipo_local", "activo"],
              },
              {
                name: "Crear venue",
                method: "POST",
                endpoint: "/api/venues",
              },
              {
                name: "Actualizar venue",
                method: "PUT",
                endpoint: "/api/venues/:id",
              },
            ],
          },
          {
            id: "payments",
            name: "Gestión de Pagos",
            icon: "dollar",
            path: "/admin/payments",
            description: "Administrar pagos e ingresos",
            actions: [
              {
                name: "Listar pagos",
                method: "GET",
                endpoint: "/api/admin/payments",
              },
              {
                name: "Ingresos mensuales",
                method: "GET",
                endpoint: "/api/admin/payments/monthly",
              },
              {
                name: "Estadísticas de pagos",
                method: "GET",
                endpoint: "/api/admin/payments/stats",
              },
            ],
          },
          {
            id: "activity",
            name: "Actividad y Logs",
            icon: "activity",
            path: "/admin/activity",
            description: "Historial de actividad del sistema",
            actions: [
              {
                name: "Actividad reciente",
                method: "GET",
                endpoint: "/api/admin/activity",
              },
            ],
          },
        ],
      },
    };

    return res.status(200).json(menu);
  } catch (error) {
    logger.error("Error en getAdminMenu:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener menú del panel",
    });
  }
};

// Gestión de usuarios

// Detalle de un usuario
export const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const userSql = `
      SELECT 
        u.id, u.email, u.nombre, u.apellidos, u.telefono,
        u.fecha_nacimiento, u.role, u.activo, u.email_verified, 
        u.created_at, u.updated_at,
        s.id as socio_id, s.numero_socio, s.estado as socio_estado,
        s.cuota_mensual, s.pagos_fallidos, s.ultimo_pago, s.proximo_pago
      FROM users u
      LEFT JOIN socios s ON u.id = s.user_id
      WHERE u.id = ?
    `;

    const users = await query(userSql, [id]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    const user = users[0];

    // Si es socio, añade sus estadísticas de reservas
    let bookingStats = null;
    if (user.socio_id) {
      const statsSql = `
        SELECT 
          COUNT(*) as total_reservas,
          COUNT(CASE WHEN estado = 'confirmada' THEN 1 END) as confirmadas,
          COUNT(CASE WHEN estado = 'cancelada' THEN 1 END) as canceladas,
          COUNT(CASE WHEN estado = 'asistida' THEN 1 END) as asistencias
        FROM bookings
        WHERE socio_id = ?
      `;
      const stats = await query(statsSql, [user.socio_id]);
      bookingStats = stats[0];
    }

    return res.status(200).json({
      success: true,
      data: {
        user,
        bookingStats,
      },
    });
  } catch (error) {
    logger.error("Error en getUserDetails:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener detalles del usuario",
    });
  }
};

// Gestión de socios

/**
 * Listar todos los socios
 * GET /api/admin/socios
 */
export const listSocios = async (req, res) => {
  try {
    const { page = 1, limit = 20, estado, filtro, search } = req.query;

    // Pestañas del panel; cualquier otro valor se ignora
    const filtrosValidos = ["socio", "inactivo", "admin", "all"];

    const result = await Socio.list({
      page,
      limit,
      filtro: filtrosValidos.includes(filtro) ? filtro : null,
      estado: estado || null,
      search: search || null,
    });

    return res.status(200).json({
      success: true,
      data: {
        socios: result.socios,
        pagination: {
          total: result.total,
          page: result.page,
          pages: result.pages,
          limit: result.limit,
        },
      },
    });
  } catch (error) {
    logger.error("Error en listSocios:", error);
    return res.status(500).json({
      success: false,
      message: "Error al listar socios",
    });
  }
};

/**
 * Listar usuarios (selector de "Crear Socio Manual" y gestión general)
 * GET /api/admin/users?role=basico&search=&page=1&limit=20
 */
export const listUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;

    const result = await User.list({
      page: parseInt(page),
      limit: parseInt(limit),
      role: role || null,
      search: search || null,
    });

    return res.status(200).json({
      success: true,
      data: {
        users: result.users,
        pagination: {
          total: result.total,
          page: result.page,
          pages: result.pages,
        },
      },
    });
  } catch (error) {
    logger.error("Error en listUsers:", error);
    return res.status(500).json({
      success: false,
      message: "Error al listar usuarios",
    });
  }
};

/**
 * Alta manual de socio a partir de un usuario básico, sin pago
 * POST /api/admin/socios
 * Body: { user_id, cuota_mensual?, notas_admin? }
 */
export const createSocioManual = async (req, res) => {
  try {
    const { user_id, cuota_mensual = 10.0, notas_admin } = req.body;

    // Solo usuarios básicos
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }
    if (user.role !== "basico") {
      return res.status(409).json({
        success: false,
        message: `Este usuario ya tiene rol '${user.role}', no se puede convertir en socio`,
      });
    }

    // user_id es UNIQUE en socios: se comprueba antes para dar un error claro
    const socioExistente = await Socio.findByUserId(user_id);
    if (socioExistente) {
      return res.status(409).json({
        success: false,
        message: "Este usuario ya tiene un registro de socio",
      });
    }

    // numero_socio se genera aquí: el trigger usa COUNT(*) y repetía números
    // tras bajas (Duplicate entry en producción)
    const numero_socio = await Socio.generarNumeroSocio();

    const insertResult = await query(
      `INSERT INTO socios (user_id, numero_socio, cuota_mensual, estado, notas_admin, fecha_alta)
       VALUES (?, ?, ?, 'activo', ?, CURDATE())`,
      [user_id, numero_socio, parseFloat(cuota_mensual), notas_admin || null],
    );

    await query("UPDATE users SET role = 'socio' WHERE id = ?", [user_id]);

    const nuevoSocio = await Socio.findById(insertResult.insertId);

    // Email de bienvenida sin bloquear la respuesta
    User.findById(user_id).then((updatedUser) => {
      EmailService.sendSolicitudAprobada(updatedUser).catch((emailError) => {
        logger.error(
          "Error al enviar email de bienvenida (socio manual):",
          emailError,
        );
      });
    });

    logger.info("Socio creado manualmente por admin", {
      userId: user_id,
      socioId: nuevoSocio.id,
      numeroSocio: nuevoSocio.numero_socio,
      adminId: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: `${user.nombre} ya es socio (${nuevoSocio.numero_socio}).`,
      data: nuevoSocio,
    });
  } catch (error) {
    logger.error("Error en createSocioManual:", error);
    return res.status(500).json({
      success: false,
      message: "Error al crear socio",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Obtener detalles de un socio específico
 * GET /api/admin/socios/:id
 */
export const getSocioDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const socio = await Socio.findById(id);
    if (!socio) {
      return res.status(404).json({
        success: false,
        message: "Socio no encontrado",
      });
    }

    const user = await User.findById(socio.user_id);

    const paymentsSql = `
      SELECT id, amount, estado, tipo_pago, fecha_pago, created_at
      FROM payments
      WHERE socio_id = ?
      ORDER BY fecha_pago DESC
      LIMIT 10
    `;
    const payments = await query(paymentsSql, [id]);

    const bookingsSql = `
      SELECT 
        b.id, b.codigo_reserva, b.estado, b.numero_entradas, 
        b.fecha_asistencia, b.created_at,
        e.titulo as evento_titulo, e.fecha_evento
      FROM bookings b
      JOIN events e ON b.event_id = e.id
      WHERE b.socio_id = ?
      ORDER BY b.created_at DESC
      LIMIT 10
    `;
    const bookings = await query(bookingsSql, [id]);

    // Respuestas del registro. La solicitud no guarda user_id: se enlaza por
    // email o DNI. Si falla, la ficha se muestra sin este bloque.
    let solicitud = null;
    if (user) {
      try {
        const solicitudRows = await query(
          `
          SELECT motivacion, invitado_por, evento_interes, created_at
          FROM solicitudes_socios
          WHERE estado = 'aprobada'
            AND (email = ? OR (? <> '' AND dni = ?))
          ORDER BY fecha_revision DESC, id DESC
          LIMIT 1
          `,
          [user.email, user.dni || "", user.dni || ""],
        );
        solicitud = solicitudRows[0] || null;
      } catch (solicitudError) {
        logger.warn("No se pudo cargar la solicitud de registro del socio", {
          socioId: id,
          error: solicitudError.message,
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        socio,
        user,
        payments,
        bookings,
        solicitud,
      },
    });
  } catch (error) {
    logger.error("Error en getSocioDetails:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener detalles del socio",
    });
  }
};

/**
 * Actualizar datos de un socio
 * PUT /api/admin/socios/:id
 */
export const updateSocio = async (req, res) => {
  try {
    const { id } = req.params;
    const { cuota_mensual, notas_admin } = req.body;

    const socio = await Socio.findById(id);
    if (!socio) {
      return res.status(404).json({
        success: false,
        message: "Socio no encontrado",
      });
    }

    const updates = {};
    if (cuota_mensual !== undefined)
      updates.cuota_mensual = parseFloat(cuota_mensual);
    if (notas_admin !== undefined) updates.notas_admin = notas_admin;

    if (Object.keys(updates).length > 0) {
      const fields = Object.keys(updates)
        .map((key) => `${key} = ?`)
        .join(", ");
      const values = Object.values(updates);
      values.push(id);

      await query(`UPDATE socios SET ${fields} WHERE id = ?`, values);
    }

    const updatedSocio = await Socio.findById(id);

    return res.status(200).json({
      success: true,
      message: "Socio actualizado exitosamente",
      data: updatedSocio,
    });
  } catch (error) {
    logger.error("Error en updateSocio:", error);
    return res.status(500).json({
      success: false,
      message: "Error al actualizar socio",
    });
  }
};

/**
 * Dar de baja a un socio
 * DELETE /api/admin/socios/:id
 */
export const deleteSocio = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    const socio = await Socio.findById(id);
    if (!socio) {
      return res.status(404).json({
        success: false,
        message: "Socio no encontrado",
      });
    }

    await Socio.darDeBaja(id, motivo || "Baja administrativa");

    // Redundante con Socio.darDeBaja(), por si esa lógica cambia
    if (socio.user_id) {
      try {
        await User.deactivate(socio.user_id);
      } catch (userError) {
        logger.warn("No se pudo desactivar user asociado, continua:", userError);
      }
    }

    // Un fallo aquí no detiene la baja
    try {
      await query(
        `
        UPDATE bookings 
        SET estado = 'cancelada', motivo_cancelacion = 'Membresía cancelada por administrador'
        WHERE socio_id = ? AND estado = 'confirmada'
          AND event_id IN (SELECT id FROM events WHERE fecha_evento > CURDATE())
      `,
        [id],
      );
    } catch (bookingError) {
      logger.warn("Error al cancelar reservas asociadas al socio:", bookingError);
    }

    return res.status(200).json({
      success: true,
      message: "Socio dado de baja exitosamente",
    });
  } catch (error) {
    logger.error("Error en deleteSocio:", error);
    return res.status(500).json({
      success: false,
      message: "Error al dar de baja al socio",
      ...(process.env.NODE_ENV === "development"
        ? { error: error.message }
        : {}),
    });
  }
};

/**
 * Eliminar permanentemente un socio y su usuario (soft delete si no es posible)
 * DELETE /api/admin/socios/:id/permanent
 */
export const deleteSocioPermanent = async (req, res) => {
  try {
    const { id } = req.params;

    const socio = await Socio.findById(id);
    if (!socio) {
      return res.status(404).json({
        success: false,
        message: "Socio no encontrado",
      });
    }

    // Borra el socio (cascade en pagos y reservas)
    await query("DELETE FROM socios WHERE id = ?", [id]);

    // Puede fallar por FK; entonces se hace soft delete
    try {
      await User.delete(socio.user_id);
    } catch (deleteError) {
      logger.warn("No se pudo eliminar el usuario, se aplicará soft delete:", deleteError);
      await User.softDelete(socio.user_id);
    }

    return res.status(200).json({
      success: true,
      message: "Socio eliminado permanentemente",
    });
  } catch (error) {
    logger.error("Error en deleteSocioPermanent:", error);
    return res.status(500).json({
      success: false,
      message: "Error al eliminar el socio",
    });
  }
};

/**
 * Reactivar a un socio dado de baja
 * PATCH /api/admin/socios/:id/reactivate
 */
export const reactivateSocio = async (req, res) => {
  try {
    const { id } = req.params;

    const socio = await Socio.findById(id);
    if (!socio) {
      return res.status(404).json({
        success: false,
        message: "Socio no encontrado",
      });
    }

    if (socio.estado !== "inactivo") {
      return res.status(400).json({
        success: false,
        message: "El socio ya está activo",
      });
    }

    await Socio.reactivar(id);

    return res.status(200).json({
      success: true,
      message: "Socio reactivado exitosamente",
    });
  } catch (error) {
    logger.error("Error en reactivateSocio:", error);
    return res.status(500).json({
      success: false,
      message: "Error al reactivar el socio",
    });
  }
};

/**
 * Listar socios morosos
 * GET /api/admin/socios/morosos?search=&severidad=leve|moderado|grave|all
 */
export const listMorosos = async (req, res) => {
  try {
    const { search, severidad } = req.query;

    const conditions = [
      "(s.estado = 'moroso' OR DATEDIFF(CURDATE(), s.ultimo_pago) > 30)",
    ];
    const params = [];

    if (search && search.trim()) {
      conditions.push(
        "(u.nombre LIKE ? OR u.apellidos LIKE ? OR u.email LIKE ? OR s.numero_socio LIKE ?)",
      );
      const searchPattern = `%${search.trim()}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    const whereClause = "WHERE " + conditions.join(" AND ");

    const sql = `
      SELECT 
        s.id, 
        s.numero_socio, 
        s.estado, 
        s.pagos_fallidos,
        s.ultimo_pago, 
        s.proximo_pago,
        s.cuota_mensual,
        COALESCE(DATEDIFF(CURDATE(), s.ultimo_pago), 0) as dias_morosidad,
        COALESCE(s.cuota_mensual * CEIL(DATEDIFF(CURDATE(), s.ultimo_pago) / 30), 0) as deuda_pendiente,
        u.id as user_id, 
        u.email, 
        u.nombre, 
        u.apellidos, 
        u.telefono
      FROM socios s
      JOIN users u ON s.user_id = u.id
      ${whereClause}
      ORDER BY dias_morosidad DESC
    `;

    let morosos = await query(sql, params);

    if (severidad && severidad !== "all") {
      morosos = morosos.filter((socio) => {
        const dias = socio.dias_morosidad || 0;

        if (severidad === "leve") {
          return dias < 15;
        } else if (severidad === "moderado") {
          return dias >= 15 && dias < 30;
        } else if (severidad === "grave") {
          return dias >= 30;
        }
        return true;
      });
    }

    return res.status(200).json({
      success: true,
      data: morosos,
    });
  } catch (error) {
    logger.error("Error en listMorosos:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener socios morosos",
      error: error.message,
    });
  }
};

// Gestión de eventos

/**
 * Obtener estadísticas de eventos
 * GET /api/admin/events/stats
 */
export const getEventsStats = async (req, res) => {
  try {
    const sql = `
      SELECT 
        COUNT(*) as total_eventos,
        COUNT(CASE WHEN estado = 'scheduled' THEN 1 END) as publicados,
        COUNT(CASE WHEN estado = 'draft' THEN 1 END) as borradores,
        COUNT(CASE WHEN estado = 'cancelled' THEN 1 END) as cancelados,
        COUNT(CASE WHEN fecha_evento >= CURDATE() THEN 1 END) as proximos,
        COUNT(CASE WHEN fecha_evento < CURDATE() THEN 1 END) as pasados,
        COALESCE(AVG(entradas_reservadas), 0) as promedio_reservas
      FROM events
    `;

    const result = await query(sql);
    const stats = result[0];

    return res.status(200).json({
      success: true,
      data: {
        total_eventos: stats.total_eventos,
        publicados: stats.publicados,
        borradores: stats.borradores,
        cancelados: stats.cancelados,
        proximos: stats.proximos,
        pasados: stats.pasados,
        promedio_reservas: parseFloat(stats.promedio_reservas).toFixed(2),
      },
    });
  } catch (error) {
    logger.error("Error en getEventsStats:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas de eventos",
    });
  }
};

/**
 * Listar todos los eventos, sin filtrar por estado
 * GET /api/admin/events
 */
export const listAllEvents = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, estado, destacado } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    const params = [];

    if (search && search.trim()) {
      conditions.push("(e.titulo LIKE ? OR e.descripcion LIKE ?)");
      const searchPattern = `%${search.trim()}%`;
      params.push(searchPattern, searchPattern);
    }

    if (estado) {
      conditions.push("e.estado = ?");
      params.push(estado);
    }

    if (destacado !== undefined) {
      const destacadoValue = destacado === "true" || destacado === true ? 1 : 0;
      conditions.push("e.destacado = ?");
      params.push(destacadoValue);
    }

    const whereClause =
      conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

    const sql = `
      SELECT 
        e.*,
        v.nombre as venue_nombre, v.ciudad as venue_ciudad,
        COUNT(DISTINCT b.id) as total_reservas,
        SUM(CASE WHEN b.estado = 'confirmada' THEN b.numero_entradas ELSE 0 END) as entradas_confirmadas
      FROM events e
      LEFT JOIN venues v ON e.venue_id = v.id
      LEFT JOIN bookings b ON e.id = b.event_id
      ${whereClause}
      GROUP BY e.id
      ORDER BY e.fecha_evento DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `;

    const events = await query(sql, params);

    const countSql = `SELECT COUNT(*) as total FROM events e ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    return res.status(200).json({
      success: true,
      data: {
        items: events,
        pagination: {
          total,
          page: pageNum,
          pages: Math.ceil(total / limitNum),
          limit: limitNum,
        },
        filters: { search, estado, destacado },
      },
    });
  } catch (error) {
    logger.error("Error en listAllEvents:", error);
    return res.status(500).json({
      success: false,
      message: "Error al listar eventos",
      error: error.message,
    });
  }
};

/**
 * Obtener detalles completos de un evento (admin)
 * GET /api/admin/events/:id
 */
export const getEventDetailsAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Evento no encontrado",
      });
    }

    const statsSql = `
      SELECT 
        COUNT(*) as total_reservas,
        COUNT(CASE WHEN estado = 'confirmada' THEN 1 END) as confirmadas,
        COUNT(CASE WHEN estado = 'cancelada' THEN 1 END) as canceladas,
        SUM(CASE WHEN estado = 'confirmada' THEN numero_entradas ELSE 0 END) as entradas_vendidas,
        COUNT(CASE WHEN estado = 'asistida' THEN 1 END) as asistencias
      FROM bookings
      WHERE event_id = ?
    `;
    const stats = await query(statsSql, [id]);

    const artistsSql = `
      SELECT 
        a.id, a.nombre_artistico, a.imagen_url,
        ea.es_headliner, ea.orden_aparicion
      FROM artists a
      JOIN event_artists ea ON a.id = ea.artist_id
      WHERE ea.event_id = ?
      ORDER BY ea.orden_aparicion ASC
    `;
    const artists = await query(artistsSql, [id]);

    return res.status(200).json({
      success: true,
      data: {
        event,
        stats: stats[0],
        artists,
      },
    });
  } catch (error) {
    logger.error("Error en getEventDetailsAdmin:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener detalles del evento",
    });
  }
};

// Gestión de reservas

/**
 * Listar todas las reservas
 * GET /api/admin/bookings
 */
export const listAllBookings = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, estado, event_id } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    const params = [];

    if (search && search.trim()) {
      conditions.push(
        "(b.codigo_reserva LIKE ? OR u.nombre LIKE ? OR u.apellidos LIKE ? OR u.email LIKE ? OR e.titulo LIKE ?)",
      );
      const searchPattern = `%${search.trim()}%`;
      params.push(
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
      );
    }

    if (estado) {
      conditions.push("b.estado = ?");
      params.push(estado);
    }

    if (event_id) {
      conditions.push("b.event_id = ?");
      params.push(parseInt(event_id));
    }

    const whereClause =
      conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

    const sql = `
      SELECT 
        b.id, b.codigo_reserva, b.estado, b.numero_entradas, 
        b.fecha_asistencia, b.fecha_reserva, b.created_at,
        u.id as user_id, u.nombre, u.apellidos, u.email,
        s.numero_socio,
        e.id as event_id, e.titulo as evento_titulo, e.fecha_evento
      FROM bookings b
      LEFT JOIN socios s ON b.socio_id = s.id
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN events e ON b.event_id = e.id
      ${whereClause}
      ORDER BY b.created_at DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `;

    const bookings = await query(sql, params);

    const countSql = `SELECT COUNT(*) as total FROM bookings b ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    return res.status(200).json({
      success: true,
      data: {
        items: bookings,
        pagination: {
          total,
          page: pageNum,
          pages: Math.ceil(total / limitNum),
          limit: limitNum,
        },
        filters: { search, estado, event_id },
      },
    });
  } catch (error) {
    logger.error("Error en listAllBookings:", error);
    return res.status(500).json({
      success: false,
      message: "Error al listar reservas",
      error: error.message,
    });
  }
};

/**
 * Obtener detalles de una reserva específica
 * GET /api/admin/bookings/:id
 */
export const getBookingDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const bookingSql = `
      SELECT 
        b.*,
        u.id as user_id, u.email, u.nombre, u.apellidos, u.telefono,
        s.numero_socio, s.estado as socio_estado,
        e.titulo as evento_titulo, e.fecha_evento, e.hora_evento, e.descripcion as evento_descripcion
      FROM bookings b
      LEFT JOIN socios s ON b.socio_id = s.id
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN events e ON b.event_id = e.id
      WHERE b.id = ?
    `;

    const bookings = await query(bookingSql, [id]);

    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Reserva no encontrada",
      });
    }

    return res.status(200).json({
      success: true,
      data: bookings[0],
    });
  } catch (error) {
    logger.error("Error en getBookingDetails:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener detalles de la reserva",
    });
  }
};

/**
 * Regenerar el QR en base64 y reenviar la entrada por email.
 * Para reservas antiguas cuyo PNG en disco borró Railway.
 * POST /api/admin/bookings/:id/reenviar
 */
export const resendBookingTicket = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Reserva no encontrada",
      });
    }

    if (booking.estado !== "confirmada") {
      return res.status(400).json({
        success: false,
        message: `Solo se puede reenviar una reserva confirmada (esta está "${booking.estado}")`,
      });
    }

    const event = await Event.findById(booking.event_id);
    const socio = await Socio.findById(booking.socio_id);
    const user = socio ? await User.findById(socio.user_id) : null;

    if (!event || !user) {
      return res.status(404).json({
        success: false,
        message: "No se encontró el evento o el socio de esta reserva",
      });
    }

    // Mismo formato que el check-in: LACLAVE-{bookingId}-{codigo_acceso}
    const qrData = `LACLAVE-${booking.id}-${booking.codigo_acceso}`;
    const qrCode = await generateQRCodeBase64(qrData, booking.id);
    await Booking.saveQRCode(booking.id, qrCode);

    const bookingActualizada = await Booking.findById(booking.id);

    await EmailService.sendBookingConfirmation(bookingActualizada, event, user);

    registrarActividad({
      userId: req.user?.id || null,
      accion: "reenviar",
      entidadTipo: "reserva",
      entidadId: booking.id,
      descripcion: `Entrada reenviada a ${user.email} (reserva #${booking.id}, QR regenerado)`,
      ipAddress: getIpFromRequest(req),
    });

    logger.info("Entrada reenviada con QR regenerado:", {
      bookingId: booking.id,
      userId: user.id,
    });

    return res.status(200).json({
      success: true,
      message: `Entrada reenviada a ${user.email}`,
    });
  } catch (error) {
    logger.error("Error en resendBookingTicket:", error);
    return res.status(500).json({
      success: false,
      message: "Error al reenviar la entrada",
    });
  }
};

/**
 * Invitación (0 €) para un socio: reserva confirmada normal, sin mirar el
 * aforo y sin restar plazas (es_invitacion=1, excluida en Event.js).
 * POST /api/admin/bookings/invitacion
 * Body: { socio_id, event_id, numero_entradas? }
 */
export const sendBookingInvitation = async (req, res) => {
  try {
    const { socio_id, event_id, numero_entradas = 1 } = req.body;

    if (!socio_id || !event_id) {
      return res.status(400).json({
        success: false,
        message: "socio_id y event_id son obligatorios",
      });
    }

    const socio = await Socio.findById(socio_id);
    if (!socio) {
      return res.status(404).json({
        success: false,
        message: "Socio no encontrado",
      });
    }

    const event = await Event.findById(event_id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Evento no encontrado",
      });
    }

    if (event.estado !== "scheduled") {
      return res.status(400).json({
        success: false,
        message: "Este evento no está disponible para enviar invitaciones",
      });
    }

    // Mismo fin de evento que createBooking: no se invita a eventos terminados
    const fechaEvento = new Date(event.fecha_evento);
    const [horaInicioH, horaInicioM] = (event.hora_evento || "00:00:00")
      .split(":")
      .map(Number);
    const [horaFinH, horaFinM] = (event.hora_fin || "23:59:59")
      .split(":")
      .map(Number);
    const cruzaMedianoche =
      horaFinH * 60 + horaFinM < horaInicioH * 60 + horaInicioM;
    const finEvento = new Date(
      fechaEvento.getFullYear(),
      fechaEvento.getMonth(),
      fechaEvento.getDate() + (cruzaMedianoche ? 1 : 0),
      horaFinH || 0,
      horaFinM || 0,
      0,
    );
    if (finEvento <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Este evento ya ha finalizado",
      });
    }

    // Una sola reserva activa por socio y evento
    const existingBooking = await Booking.findBySocioAndEvent(socio.id, event_id);
    if (existingBooking) {
      return res.status(409).json({
        success: false,
        message: "Este socio ya tiene una reserva para este evento",
      });
    }

    // Sin Event.checkAvailability: se puede invitar con el aforo completo

    // tier_id solo para saber la tanda; el precio es siempre 0
    const { tier_id: tierId } = await EventTicketTier.resolveActivePrice(
      event_id,
      event.precio_socio,
    );

    const booking = await transaction(async (conn) => {
      const codigo_acceso = `ACC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
      const codigo_reserva = `LCV-${year}${month}-${randomPart}`;

      const [result] = await conn.execute(
        `INSERT INTO bookings (
          socio_id, event_id, tier_id, numero_entradas, estado,
          codigo_reserva, codigo_acceso, precio_pagado, precio_unitario,
          es_invitacion, created_at
        ) VALUES (?, ?, ?, ?, 'confirmada', ?, ?, 0.00, 0.00, 1, NOW())`,
        [socio.id, event_id, tierId, numero_entradas, codigo_reserva, codigo_acceso],
      );

      const bookingId = result.insertId;

      // No se toca entradas_disponibles (la invitación no ocupa plaza);
      // entradas_reservadas es solo informativo
      try {
        await conn.execute(
          `UPDATE events
           SET entradas_reservadas = entradas_reservadas + ?
           WHERE id = ?`,
          [numero_entradas, event_id],
        );
      } catch (updateError) {
        logger.warn(
          "No se pudo actualizar entradas_reservadas (invitación):",
          updateError.message,
        );
      }

      const [rows] = await conn.execute(`SELECT * FROM bookings WHERE id = ?`, [
        bookingId,
      ]);
      return rows[0];
    });

    let bookingWithQR = booking;
    try {
      const qrData = `LACLAVE-${booking.id}-${booking.codigo_acceso}`;
      const qrCode = await generateQRCodeBase64(qrData, booking.id);
      await query(`UPDATE bookings SET qr_code_url = ? WHERE id = ?`, [
        qrCode,
        booking.id,
      ]);
    } catch (qrError) {
      logger.error("Error generando QR de invitación:", qrError);
    }
    bookingWithQR = await Booking.findById(booking.id);

    // Pago de 0 € para que cuadren las estadísticas. Se marca como invitación
    // en descripcion y metadata, sin cambiar el esquema.
    try {
      await query(
        `INSERT INTO payments (
          socio_id, stripe_payment_intent_id, amount, currency, tipo_pago,
          descripcion, estado, fecha_pago, metadata, created_at
        ) VALUES (?, ?, 0.00, 'EUR', 'entrada_evento', ?, 'exitoso', NOW(), ?, NOW())`,
        [
          socio.id,
          `invite-${booking.id}-${Date.now()}`,
          `Invitación de administrador a ${event.titulo}`,
          JSON.stringify({
            event_id,
            booking_id: booking.id,
            invitacion: true,
            otorgado_por: req.user?.id || null,
          }),
        ],
      );
    } catch (paymentErr) {
      logger.error("Error al registrar invitación:", paymentErr);
    }

    // Mismo email que una reserva, con textos de invitación
    try {
      const user = await User.findById(socio.user_id);
      if (user) {
        await EmailService.sendBookingConfirmation(bookingWithQR, event, user, true);
      }
    } catch (emailError) {
      logger.error("Error enviando email de invitación:", emailError);
    }

    registrarActividad({
      userId: req.user?.id || null,
      accion: "invitar",
      entidadTipo: "reserva",
      entidadId: booking.id,
      descripcion: `Invitación enviada al socio #${socio.id} para "${event.titulo}" (${numero_entradas} entrada${numero_entradas !== 1 ? "s" : ""})`,
      ipAddress: getIpFromRequest(req),
    });

    logger.info("Invitación enviada:", {
      bookingId: booking.id,
      socioId: socio.id,
      eventId: event_id,
    });

    return res.status(201).json({
      success: true,
      message: "Invitación enviada correctamente",
      data: bookingWithQR,
    });
  } catch (error) {
    logger.error("Error en sendBookingInvitation:", error);
    return res.status(500).json({
      success: false,
      message: "Error al enviar la invitación",
    });
  }
};

/**
 * Cancelar reserva (admin)
 * PATCH /api/admin/bookings/:id/cancel
 */
export const cancelBookingAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Reserva no encontrada",
      });
    }

    if (booking.estado === "cancelada") {
      return res.status(400).json({
        success: false,
        message: "La reserva ya está cancelada",
      });
    }

    await Booking.cancel(id, motivo || "Cancelada por administrador");

    return res.status(200).json({
      success: true,
      message: "Reserva cancelada exitosamente",
    });
  } catch (error) {
    logger.error("Error en cancelBookingAdmin:", error);
    return res.status(500).json({
      success: false,
      message: "Error al cancelar reserva",
    });
  }
};

/**
 * Estadísticas generales de reservas
 * GET /api/admin/bookings/stats
 */
export const getBookingsStats = async (req, res) => {
  try {
    const statsSql = `
      SELECT 
        COUNT(*) as total_reservas,
        COUNT(CASE WHEN estado = 'confirmada' THEN 1 END) as confirmadas,
        COUNT(CASE WHEN estado = 'cancelada' THEN 1 END) as canceladas,
        COUNT(CASE WHEN estado = 'asistida' THEN 1 END) as asistidas,
        COUNT(CASE WHEN estado = 'no_asistida' THEN 1 END) as no_asistidas,
        SUM(numero_entradas) as total_entradas,
        COUNT(CASE WHEN DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as esta_semana,
        COUNT(CASE WHEN DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as este_mes
      FROM bookings
    `;

    const stats = await query(statsSql);

    const topEventsSql = `
      SELECT 
        e.id, e.titulo, e.fecha_evento,
        COUNT(b.id) as total_reservas,
        SUM(b.numero_entradas) as total_entradas
      FROM events e
      LEFT JOIN bookings b ON e.id = b.event_id AND b.estado = 'confirmada'
      WHERE e.fecha_evento >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
      GROUP BY e.id
      ORDER BY total_reservas DESC
      LIMIT 5
    `;
    const topEvents = await query(topEventsSql);

    return res.status(200).json({
      success: true,
      data: {
        general: stats[0],
        top_eventos: topEvents,
      },
    });
  } catch (error) {
    logger.error("Error en getBookingsStats:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas de reservas",
    });
  }
};

// Gestión de pagos

/**
 * Entradas vendidas de un evento con sus pagos
 * GET /api/admin/events/:eventId/payments
 */
export const getEventPayments = async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId, 10);

    if (isNaN(eventId) || eventId <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID de evento inválido",
      });
    }

    const pageNum = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limitNum = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 50),
    );
    const offset = (pageNum - 1) * limitNum;
    const { estado, search } = req.query;

    logger.debug("[getEventPayments] Consultando evento", {
      eventId,
      search,
      estado,
      page: pageNum,
      limit: limitNum,
    });

    const eventResult = await query(
      "SELECT id, titulo, fecha_evento, precio_socio FROM events WHERE id = ?",
      [eventId],
    );

    if (eventResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Evento no encontrado",
      });
    }

    const event = eventResult[0];

    // Estadísticas del evento, sin filtros
    const allEntries = await query(
      `SELECT b.estado, b.numero_entradas, COALESCE(b.precio_pagado, 0) AS precio_pagado
       FROM bookings b
       WHERE b.event_id = ?`,
      [eventId],
    );

    // Confirmadas = confirmada + asistida, para que no baje al hacer check-in
    const entradasConfirmadas = allEntries.filter(
      (e) => e.estado === "confirmada" || e.estado === "asistida",
    );
    const entradasAsistidas = allEntries.filter((e) => e.estado === "asistida");

    const stats = {
      total_entradas: allEntries.reduce(
        (sum, e) => sum + (e.numero_entradas || 0),
        0,
      ),
      pagos_exitosos: entradasConfirmadas.reduce(
        (sum, e) => sum + (e.numero_entradas || 0),
        0,
      ),
      entradas_asistidas: entradasAsistidas.reduce(
        (sum, e) => sum + (e.numero_entradas || 0),
        0,
      ),
      pagos_fallidos: allEntries.filter((e) => e.estado === "cancelada").length,
      pagos_pendientes: allEntries.filter((e) => e.estado === "esperando_pago")
        .length,
      // Cobrado = precio_pagado de confirmadas y asistidas
      total_ingresos: entradasConfirmadas.reduce(
        (sum, e) => sum + parseFloat(e.precio_pagado || 0),
        0,
      ),
    };

    const conditions = ["b.event_id = ?"];
    const params = [eventId];

    // estado: confirmada | cancelada | esperando_pago | en_lista_espera
    if (estado && estado !== "all") {
      conditions.push("b.estado = ?");
      params.push(estado);
    }

    if (search && search.trim().length >= 2) {
      conditions.push(
        "(u.nombre LIKE ? OR u.apellidos LIKE ? OR u.email LIKE ? OR s.numero_socio LIKE ?)",
      );
      const term = "%" + search.trim() + "%";
      params.push(term, term, term, term);
    }

    const whereClause = conditions.join(" AND ");

    const entriesSql = `
      SELECT
        b.id               AS booking_id,
        b.numero_entradas,
        b.estado           AS payment_estado,
        b.codigo_acceso,
        b.qr_code,
        b.asistencia,
        b.fecha_asistencia,
        b.created_at,
        COALESCE(b.precio_pagado, 0) AS precio_pagado,
        s.id               AS socio_id,
        s.numero_socio,
        s.estado           AS socio_estado,
        u.id               AS user_id,
        u.nombre           AS socio_nombre,
        u.apellidos        AS socio_apellidos,
        u.email            AS socio_email,
        u.telefono         AS socio_telefono
      FROM bookings b
      INNER JOIN socios s ON b.socio_id = s.id
      INNER JOIN users  u ON s.user_id  = u.id
      WHERE ${whereClause}
      ORDER BY b.created_at DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `;
    const entries = await query(entriesSql, params);
    logger.debug("[getEventPayments] Entradas encontradas", { total: entries.length });

    return res.status(200).json({
      success: true,
      data: {
        event,
        stats,
        entries,
        pagination: {
          total: allEntries.length,
          page: pageNum,
          pages: Math.ceil(allEntries.length / limitNum),
          limit: limitNum,
        },
        filters: { search, estado },
      },
    });
  } catch (error) {
    logger.error("[getEventPayments] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener pagos del evento",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const getMonthlyRevenue = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const yearNum = parseInt(year, 10);
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();

    const sqlMonthly = `
      SELECT
        DATE_FORMAT(fecha_pago, '%Y-%m-01') as mes,
        SUM(COALESCE(amount, 0)) as total_ingresos,
        COUNT(*) as total_pagos
      FROM payments
      WHERE YEAR(fecha_pago) = ? AND estado = 'exitoso'
      GROUP BY DATE_FORMAT(fecha_pago, '%Y-%m-01')
      ORDER BY mes ASC
    `;
    const monthly_data = await query(sqlMonthly, [yearNum]);

    // Mes actual
    const sqlCurrentMonth = `
      SELECT
        SUM(COALESCE(amount, 0)) as total_ingresos,
        COUNT(*) as total_pagos
      FROM payments
      WHERE MONTH(fecha_pago) = ? AND YEAR(fecha_pago) = ? AND estado = 'exitoso'
    `;
    const [current_month] = await query(sqlCurrentMonth, [
      currentMonth,
      currentYear,
    ]);

    // Mes anterior
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const [previous_month] = await query(sqlCurrentMonth, [
      prevMonth,
      prevYear,
    ]);

    // Desglose por tipo de pago
    const sqlByType = `
      SELECT
        tipo_pago,
        SUM(COALESCE(amount, 0)) as total_ingresos,
        COUNT(*) as total_pagos
      FROM payments
      WHERE YEAR(fecha_pago) = ? AND estado = 'exitoso'
      GROUP BY tipo_pago
      ORDER BY total_ingresos DESC
    `;
    const by_payment_type = await query(sqlByType, [yearNum]);

    return res.status(200).json({
      success: true,
      data: {
        monthly_data,
        current_month: current_month || { total_ingresos: 0, total_pagos: 0 },
        previous_month: previous_month || { total_ingresos: 0, total_pagos: 0 },
        by_payment_type,
      },
    });
  } catch (error) {
    logger.error("Error en getMonthlyRevenue:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener ingresos mensuales",
    });
  }
};

/**
 * Obtener estadísticas de pagos
 * GET /api/admin/payments/stats
 */
export const getPaymentsStats = async (req, res) => {
  try {
    const summary = await Payment.getMonthlySummary(12);
    const desde = new Date();
    desde.setFullYear(desde.getFullYear() - 1);
    const hasta = new Date();

    const incomeSummary = await Payment.getIncomeSummary(desde, hasta);

    return res.status(200).json({
      success: true,
      data: {
        ingresos_mensuales: summary,
        resumen_12m: incomeSummary,
      },
    });
  } catch (error) {
    logger.error("Error en getPaymentsStats:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas de pagos",
    });
  }
};

/**
 * Listar todos los pagos
 * GET /api/admin/payments
 */
export const listPayments = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, estado, tipo_pago } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    const params = [];

    // Busca en payment intent, factura, nombre y email
    if (search && search.trim()) {
      conditions.push(
        "(p.stripe_payment_intent_id LIKE ? OR p.stripe_invoice_id LIKE ? OR u.nombre LIKE ? OR u.apellidos LIKE ? OR u.email LIKE ?)",
      );
      const searchPattern = `%${search.trim()}%`;
      params.push(
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
      );
    }

    if (estado) {
      conditions.push("p.estado = ?");
      params.push(estado);
    }

    if (tipo_pago) {
      conditions.push("p.tipo_pago = ?");
      params.push(tipo_pago);
    }

    const whereClause =
      conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

    const sql = `
      SELECT 
        p.id, 
        p.amount,
        p.estado, 
        p.tipo_pago,
        p.fecha_pago,
        p.stripe_payment_intent_id,
        p.stripe_invoice_id,
        p.payment_method,
        COALESCE(p.currency, 'EUR') as currency,
        p.descripcion,
        p.created_at,
        u.nombre, 
        u.apellidos, 
        u.email,
        s.numero_socio
      FROM payments p
      LEFT JOIN socios s ON p.socio_id = s.id
      LEFT JOIN users u ON s.user_id = u.id
      ${whereClause}
      ORDER BY p.fecha_pago DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `;

    const payments = await query(sql, params);

    const countSql = `SELECT COUNT(*) as total FROM payments p ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    return res.status(200).json({
      success: true,
      data: {
        items: payments,
        pagination: {
          total,
          page: pageNum,
          pages: Math.ceil(total / limitNum),
          limit: limitNum,
        },
        filters: { search, estado, tipo_pago },
      },
    });
  } catch (error) {
    logger.error("Error en listPayments:", error);
    return res.status(500).json({
      success: false,
      message: "Error al listar pagos",
      error: error.message,
    });
  }
};

// Galería y actividad

/**
 * Obtener estadísticas de galería
 * GET /api/admin/gallery/stats
 */
export const getGalleryStats = async (req, res) => {
  try {
    const stats = await Gallery.getStats();

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error("Error en getGalleryStats:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas de galería",
    });
  }
};

/**
 * Obtener actividad reciente
 * GET /api/admin/activity
 */
export const getRecentActivity = async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    // limit entre 1 y 200
    const limitNum = Math.min(200, Math.max(1, parseInt(limit) || 50));

    const sql = `
      SELECT 
        a.accion, 
        a.entidad_tipo AS entidad, 
        a.entidad_id, 
        a.descripcion, 
        a.created_at,
        CONCAT(u.nombre, ' ', u.apellidos) as usuario
      FROM activity_log a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT ${limitNum}
    `;

    const activity = await query(sql);

    return res.status(200).json({
      success: true,
      data: activity,
    });
  } catch (error) {
    logger.error("Error en getRecentActivity:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener actividad reciente",
    });
  }
};

// Exportaciones PDF

/**
 * Eventos para el selector de la exportación de reservas, sin paginar
 * GET /api/admin/export/events-selector
 */
export const getEventsForExportSelector = async (req, res) => {
  try {
    const sql = `
      SELECT id, titulo, fecha_evento
      FROM events
      ORDER BY fecha_evento DESC
      LIMIT 500
    `;
    const events = await query(sql);
    return res.status(200).json({ success: true, data: events });
  } catch (error) {
    logger.error('Error en getEventsForExportSelector:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener eventos' });
  }
};

/**
 * Exportar lista de socios en formato PDF
 * GET /api/admin/export/socios
 */
export const exportSocios = async (req, res) => {
  try {
    const sql = `
      SELECT 
        s.numero_socio,
        CONCAT_WS(' ', u.nombre, u.apellidos) as nombre_completo,
        u.email,
        u.telefono,
        u.dni,
        DATE_FORMAT(u.fecha_nacimiento, '%d/%m/%Y') as fecha_nacimiento,
        DATE_FORMAT(s.fecha_alta, '%d/%m/%Y') as fecha_alta
      FROM socios s
      INNER JOIN users u ON s.user_id = u.id
      WHERE u.activo = true
      ORDER BY s.numero_socio ASC
    `;

    const socios = await query(sql);

    if (!socios || socios.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No hay socios registrados para exportar",
      });
    }

    const doc = createListPdf({
      res,
      filename: "socios",
      title: "Lista de Socios - La Clave Asociación",
      lines: [`Total de socios: ${socios.length}`],
    });

    drawTable(doc, {
      rows: socios,
      columns: [
        { header: "Nº Socio", width: 55, align: "center", bold: true, value: (s) => s.numero_socio },
        { header: "Nombre completo", width: 150, value: (s) => s.nombre_completo },
        { header: "Email", width: 175, value: (s) => s.email },
        { header: "Teléfono", width: 85, value: (s) => s.telefono },
        { header: "DNI", width: 80, align: "center", value: (s) => s.dni },
        { header: "F. Nacimiento", width: 75, align: "center", value: (s) => s.fecha_nacimiento },
        { header: "F. Alta", width: 70, align: "center", value: (s) => s.fecha_alta },
      ],
    });

    finishPdf(doc);
  } catch (error) {
    logger.error("Error al exportar socios a PDF:", error);

    if (res.headersSent) {
      return res.end();
    }

    return res.status(500).json({
      success: false,
      message: "Error al generar el PDF de socios",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Exportar lista de reservas en formato PDF
 * GET /api/admin/export/reservas?event_id=X
 */
export const exportReservas = async (req, res) => {
  try {
    const { event_id } = req.query;

    // Con event_id, el título del evento va en la cabecera
    let eventTitle = null;
    if (event_id) {
      const eventRows = await query('SELECT titulo FROM events WHERE id = ?', [event_id]);
      if (eventRows && eventRows.length > 0) {
        eventTitle = eventRows[0].titulo;
      }
    }

    // Una fila por socio y evento: asistida > confirmada > pendiente > cancelada;
    // si empatan, la más reciente
    let sql = `
      SELECT 
        b.codigo_acceso as codigo_reserva,
        CONCAT_WS(' ', u.nombre, u.apellidos) as nombre_socio,
        u.email as email_socio,
        u.telefono as telefono_contacto,
        b.estado,
        DATE_FORMAT(b.created_at, '%d/%m/%Y') as fecha_reserva
      FROM bookings b
      INNER JOIN events e ON b.event_id = e.id
      INNER JOIN socios s ON b.socio_id = s.id
      INNER JOIN users u ON s.user_id = u.id
      WHERE NOT EXISTS (
        SELECT 1 FROM bookings b2
        WHERE b2.socio_id = b.socio_id
          AND b2.event_id = b.event_id
          AND (
            CASE b2.estado
              WHEN 'asistida'   THEN 3
              WHEN 'confirmada' THEN 2
              WHEN 'pendiente'  THEN 1
              ELSE 0
            END
            >
            CASE b.estado
              WHEN 'asistida'   THEN 3
              WHEN 'confirmada' THEN 2
              WHEN 'pendiente'  THEN 1
              ELSE 0
            END
            OR (
              CASE b2.estado
                WHEN 'asistida'   THEN 3
                WHEN 'confirmada' THEN 2
                WHEN 'pendiente'  THEN 1
                ELSE 0
              END
              =
              CASE b.estado
                WHEN 'asistida'   THEN 3
                WHEN 'confirmada' THEN 2
                WHEN 'pendiente'  THEN 1
                ELSE 0
              END
              AND b2.id > b.id
            )
          )
      )
    `;

    const params = [];

    if (event_id) {
      sql += " AND b.event_id = ?";
      params.push(event_id);
    }

    // Activas primero, canceladas al final; por fecha descendente
    sql += " ORDER BY CASE b.estado WHEN 'cancelada' THEN 1 ELSE 0 END ASC, e.fecha_evento DESC, b.created_at DESC";

    const reservas = await query(sql, params);

    if (!reservas || reservas.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No hay reservas para exportar con los filtros aplicados",
      });
    }

    const doc = createListPdf({
      res,
      filename: "reservas",
      title: eventTitle
        ? `Reservas - ${eventTitle}`
        : "Lista de Reservas - La Clave Asociación",
      lines: [`Total de reservas: ${reservas.length}`],
    });

    const estadoColor = (r) =>
      r.estado === "confirmada"
        ? STATUS_COLORS.ok
        : r.estado === "cancelada"
          ? STATUS_COLORS.danger
          : r.estado === "asistida"
            ? STATUS_COLORS.info
            : STATUS_COLORS.neutral;

    drawTable(doc, {
      rows: reservas,
      columns: [
        { header: "Código reserva", width: 120, align: "center", value: (r) => r.codigo_reserva },
        { header: "Nombre socio", width: 150, value: (r) => r.nombre_socio },
        { header: "Email", width: 175, value: (r) => r.email_socio },
        { header: "Teléfono", width: 85, align: "center", value: (r) => r.telefono_contacto },
        { header: "F. Reserva", width: 75, align: "center", value: (r) => r.fecha_reserva },
        { header: "Estado", width: 75, align: "center", bold: true, color: estadoColor, value: (r) => r.estado },
      ],
    });

    finishPdf(doc);
  } catch (error) {
    logger.error("Error al exportar reservas a PDF:", error);

    if (res.headersSent) {
      return res.end();
    }

    return res.status(500).json({
      success: false,
      message: "Error al generar el PDF de reservas",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Exportar lista de usuarios en formato PDF
 * GET /api/admin/export/usuarios
 */
export const exportUsuarios = async (req, res) => {
  try {
    const sql = `
      SELECT 
        CONCAT_WS(' ', u.nombre, u.apellidos) as nombre,
        u.email,
        u.telefono,
        u.role,
        CASE 
          WHEN u.activo = true THEN 'Activo'
          ELSE 'Inactivo'
        END as estado,
        CASE 
          WHEN u.email_verified = true THEN 'Sí'
          ELSE 'No'
        END as email_verificado,
        DATE_FORMAT(u.created_at, '%d/%m/%Y') as fecha_registro
      FROM users u
      ORDER BY u.created_at DESC
    `;

    const usuarios = await query(sql);

    if (!usuarios || usuarios.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No hay usuarios registrados para exportar",
      });
    }

    const activos = usuarios.filter((u) => u.estado === "Activo").length;
    const socios = usuarios.filter((u) => u.role === "socio").length;
    const admins = usuarios.filter((u) => u.role === "admin").length;

    const doc = createListPdf({
      res,
      filename: "usuarios",
      title: "Lista de Usuarios - La Clave Asociación",
      lines: [
        `Total: ${usuarios.length} usuarios | Activos: ${activos} | Socios: ${socios} | Admins: ${admins}`,
      ],
    });

    drawTable(doc, {
      rows: usuarios,
      columns: [
        { header: "Nombre", width: 150, value: (u) => u.nombre },
        { header: "Email", width: 180, value: (u) => u.email },
        { header: "Teléfono", width: 85, align: "center", value: (u) => u.telefono },
        {
          header: "Rol",
          width: 60,
          align: "center",
          bold: true,
          color: (u) =>
            u.role === "admin"
              ? STATUS_COLORS.danger
              : u.role === "socio"
                ? STATUS_COLORS.info
                : STATUS_COLORS.neutral,
          value: (u) => u.role,
        },
        {
          header: "Estado",
          width: 60,
          align: "center",
          color: (u) => (u.estado === "Activo" ? STATUS_COLORS.ok : STATUS_COLORS.danger),
          value: (u) => u.estado,
        },
        {
          header: "Verif.",
          width: 50,
          align: "center",
          color: (u) => (u.email_verificado === "Sí" ? STATUS_COLORS.ok : STATUS_COLORS.warning),
          value: (u) => u.email_verificado,
        },
        { header: "Registro", width: 70, align: "center", value: (u) => u.fecha_registro },
      ],
    });

    finishPdf(doc);
  } catch (error) {
    logger.error("Error al exportar usuarios a PDF:", error);

    if (res.headersSent) {
      return res.end();
    }

    return res.status(500).json({
      success: false,
      message: "Error al generar el PDF de usuarios",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Exportar lista de eventos en formato PDF
 * GET /api/admin/export/eventos
 */
export const exportEventos = async (req, res) => {
  try {
    // Se suman entradas, no reservas. Reservadas = confirmadas + asistidas.
    const sql = `
      SELECT 
        e.titulo,
        DATE_FORMAT(e.fecha_evento, '%d/%m/%Y') as fecha_evento,
        TIME_FORMAT(e.hora_evento, '%H:%i') as hora_evento,
        e.ubicacion,
        e.aforo_maximo,
        COALESCE((
          SELECT SUM(b.numero_entradas) FROM bookings b 
          WHERE b.event_id = e.id AND b.estado IN ('confirmada', 'asistida')
        ), 0) as entradas_reservadas,
        COALESCE((
          SELECT SUM(b.numero_entradas) FROM bookings b 
          WHERE b.event_id = e.id AND b.estado = 'asistida'
        ), 0) as entradas_asistidas,
        COALESCE((
          SELECT SUM(b.numero_entradas) FROM bookings b 
          WHERE b.event_id = e.id AND b.estado = 'cancelada'
        ), 0) as entradas_canceladas
      FROM events e
      ORDER BY e.fecha_evento DESC
    `;

    const eventos = await query(sql);

    if (!eventos || eventos.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No hay eventos registrados para exportar",
      });
    }

    const doc = createListPdf({
      res,
      filename: "eventos",
      title: "Lista de Eventos - La Clave Asociación",
      lines: [`Total: ${eventos.length} eventos`],
    });

    drawTable(doc, {
      rows: eventos,
      columns: [
        { header: "Nombre evento", width: 190, bold: true, value: (e) => e.titulo },
        { header: "Fecha", width: 70, align: "center", value: (e) => e.fecha_evento },
        { header: "Hora", width: 45, align: "center", value: (e) => e.hora_evento },
        { header: "Ubicación", width: 135, value: (e) => e.ubicacion },
        { header: "Aforo", width: 50, align: "center", value: (e) => e.aforo_maximo },
        { header: "Reservadas", width: 65, align: "center", value: (e) => e.entradas_reservadas },
        {
          header: "Asistidas",
          width: 60,
          align: "center",
          color: () => STATUS_COLORS.info,
          value: (e) => e.entradas_asistidas,
        },
        {
          header: "Canceladas",
          width: 65,
          align: "center",
          color: () => STATUS_COLORS.danger,
          value: (e) => e.entradas_canceladas,
        },
      ],
    });

    finishPdf(doc);
  } catch (error) {
    logger.error("Error al exportar eventos a PDF:", error);

    if (res.headersSent) {
      return res.end();
    }

    return res.status(500).json({
      success: false,
      message: "Error al generar el PDF de eventos",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Gestión de solicitudes de socio

/**
 * Listar solicitudes con filtros y paginación
 * GET /api/admin/solicitudes?estado=pendiente&search=&page=1&limit=20
 */
export const listSolicitudes = async (req, res) => {
  try {
    const { estado = "all", search = "", page = 1, limit = 20 } = req.query;

    const result = await SolicitudSocio.findAll({
      estado,
      search,
      page: parseInt(page),
      limit: parseInt(limit),
    });

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error("Error en listSolicitudes:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener solicitudes",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Detalle de una solicitud
 * GET /api/admin/solicitudes/:id
 */
export const getSolicitudDetails = async (req, res) => {
  try {
    const solicitud = await SolicitudSocio.findById(parseInt(req.params.id));
    if (!solicitud) {
      return res
        .status(404)
        .json({ success: false, message: "Solicitud no encontrada" });
    }
    return res.status(200).json({ success: true, data: solicitud });
  } catch (error) {
    logger.error("Error en getSolicitudDetails:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener la solicitud",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Aprobar solicitud: crea el usuario y su fila en socios
 * PUT /api/admin/solicitudes/:id/aprobar
 */
export const aprobarSolicitud = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const solicitud = await SolicitudSocio.findById(parseInt(id));
    if (!solicitud) {
      return res
        .status(404)
        .json({ success: false, message: "Solicitud no encontrada" });
    }
    if (solicitud.estado !== "pendiente") {
      return res.status(400).json({
        success: false,
        message: `La solicitud ya fue ${solicitud.estado}`,
      });
    }

    const emailExiste = await User.emailExists(solicitud.email);
    if (emailExiste) {
      return res.status(409).json({
        success: false,
        message:
          "Ya existe un usuario con ese email. Revisa la solicitud manualmente.",
      });
    }

    // username es NOT NULL UNIQUE: se genera del email, como en User.create()
    const username = `${solicitud.email.split('@')[0]}_${Date.now().toString(36)}`;

    // La solicitud ya trae el password_hash
    const createUserSql = `
      INSERT INTO users (
        username, email, password_hash, nombre, apellidos,
        telefono, fecha_nacimiento, dni, dni_front_url, dni_back_url,
        role, activo, ip_registro, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'socio', TRUE, ?, NOW())
    `;
    const userResult = await query(createUserSql, [
      username,
      solicitud.email,
      solicitud.password_hash,
      solicitud.nombre,
      solicitud.apellidos,
      solicitud.telefono,
      solicitud.fecha_nacimiento,
      solicitud.dni,
      solicitud.dni_front_url,
      solicitud.dni_back_url,
      solicitud.ip_solicitud,
    ]);

    const newUserId = userResult.insertId;

    // Membresía gratuita; numero_socio generado aquí (ver Socio.generarNumeroSocio)
    const numeroSocioNuevo = await Socio.generarNumeroSocio();
    await query(
      `INSERT INTO socios (user_id, numero_socio, stripe_customer_id, estado, cuota_mensual, fecha_alta)
       VALUES (?, ?, NULL, 'activo', 0.00, CURDATE())`,
      [newUserId, numeroSocioNuevo],
    );

    await SolicitudSocio.aprobar(parseInt(id), adminId);

    // Email de bienvenida sin bloquear la respuesta
    const newUser = await User.findById(newUserId);
    EmailService.sendSolicitudAprobada(newUser).catch((emailError) => {
      logger.error("Error al enviar email solicitud-aprobada:", emailError);
    });

    logger.info("Solicitud aprobada y socio creado", {
      solicitudId: id,
      newUserId,
      adminId,
    });

    registrarActividad({
      userId: adminId,
      accion: "aprobar",
      entidadTipo: "socio",
      entidadId: newUserId,
      descripcion: `Solicitud de ${solicitud.nombre} ${solicitud.apellidos} aprobada`,
      ipAddress: getIpFromRequest(req),
    });

    return res.status(200).json({
      success: true,
      message: `Solicitud aprobada. ${solicitud.nombre} ya es socio.`,
      data: { userId: newUserId, email: newUser.email },
    });
  } catch (error) {
    logger.error("Error en aprobarSolicitud:", error);
    return res.status(500).json({
      success: false,
      message: "Error al aprobar la solicitud",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Rechazar solicitud
 * PUT /api/admin/solicitudes/:id/rechazar
 * Body: { motivo_rechazo }
 */
export const rechazarSolicitud = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo_rechazo } = req.body;
    const adminId = req.user.id;

    if (!motivo_rechazo?.trim()) {
      return res.status(400).json({
        success: false,
        message: "El motivo de rechazo es obligatorio",
      });
    }

    const solicitud = await SolicitudSocio.findById(parseInt(id));
    if (!solicitud) {
      return res
        .status(404)
        .json({ success: false, message: "Solicitud no encontrada" });
    }
    if (solicitud.estado !== "pendiente") {
      return res.status(400).json({
        success: false,
        message: `La solicitud ya fue ${solicitud.estado}`,
      });
    }

    const updated = await SolicitudSocio.rechazar(
      parseInt(id),
      adminId,
      motivo_rechazo.trim(),
    );

    try {
      await EmailService.sendSolicitudRechazada(
        solicitud,
        motivo_rechazo.trim(),
      );
    } catch (emailError) {
      logger.error("Error al enviar email solicitud-rechazada:", emailError);
    }

    logger.info("Solicitud rechazada", { solicitudId: id, adminId });

    registrarActividad({
      userId: adminId,
      accion: "rechazar",
      entidadTipo: "socio",
      entidadId: parseInt(id),
      descripcion: `Solicitud de ${solicitud.nombre} ${solicitud.apellidos} rechazada: ${motivo_rechazo.trim()}`,
      ipAddress: getIpFromRequest(req),
    });

    return res.status(200).json({
      success: true,
      message: "Solicitud rechazada correctamente",
      data: updated,
    });
  } catch (error) {
    logger.error("Error en rechazarSolicitud:", error);
    return res.status(500).json({
      success: false,
      message: "Error al rechazar la solicitud",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Eliminar solicitud definitivamente
 * DELETE /api/admin/solicitudes/:id
 */
export const deleteSolicitud = async (req, res) => {
  try {
    const solicitud = await SolicitudSocio.findById(parseInt(req.params.id));
    if (!solicitud) {
      return res
        .status(404)
        .json({ success: false, message: "Solicitud no encontrada" });
    }
    await SolicitudSocio.delete(parseInt(req.params.id));
    logger.info("Solicitud eliminada", {
      solicitudId: req.params.id,
      adminId: req.user.id,
    });
    return res
      .status(200)
      .json({ success: true, message: "Solicitud eliminada correctamente" });
  } catch (error) {
    logger.error("Error en deleteSolicitud:", error);
    return res.status(500).json({
      success: false,
      message: "Error al eliminar la solicitud",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Solicitudes pendientes (contador del menú)
 * GET /api/admin/solicitudes/pendientes/count
 */
export const getPendientesCount = async (req, res) => {
  try {
    const total = await SolicitudSocio.countPendientes();
    return res.status(200).json({ success: true, data: { total } });
  } catch (error) {
    logger.error("Error en getPendientesCount:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener el contador",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Cambiar el rol de un usuario
 * PATCH /api/admin/users/:id/role
 */
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !["admin", "socio"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Rol no válido. Debe ser 'admin' o 'socio'",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    // Un admin también es socio: al promocionarlo se le crea la fila en
    // socios si no la tiene; si ya existe, no se toca
    if (role === "admin") {
      const socioExistente = await Socio.findByUserId(id);
      if (!socioExistente) {
        const numeroSocioAdmin = await Socio.generarNumeroSocio();
        await query(
          `INSERT INTO socios (user_id, numero_socio, cuota_mensual, estado, fecha_alta)
           VALUES (?, ?, 0.00, 'activo', CURDATE())`,
          [id, numeroSocioAdmin],
        );
        logger.info(
          "Fila de socio creada automáticamente al promocionar a admin",
          { userId: id },
        );
      }
    }

    await query(`UPDATE users SET role = ? WHERE id = ?`, [role, id]);

    return res.status(200).json({
      success: true,
      message: `Rol actualizado a '${role}' correctamente`,
    });
  } catch (error) {
    logger.error("Error en updateUserRole:", error);
    return res.status(500).json({
      success: false,
      message: "Error al actualizar el rol del usuario",
      ...(process.env.NODE_ENV === "development" ? { error: error.message } : {}),
    });
  }
};

/**
 * Exportar informe de ingresos mensuales en formato PDF
 * GET /api/admin/export/ingresos-mensuales?year=2026&month=4
 */
export const exportIngresosMensuales = async (req, res) => {
  try {
    const now   = new Date();
    const year  = parseInt(req.query.year  || now.getFullYear(),  10);
    const month = parseInt(req.query.month || (now.getMonth() + 1), 10);

    // Resumen del mes
    const sqlResumen = `
      SELECT
        SUM(COALESCE(amount, 0)) as total_ingresos,
        COUNT(*)                  as total_pagos
      FROM payments
      WHERE MONTH(fecha_pago) = ? AND YEAR(fecha_pago) = ? AND estado = 'exitoso'
    `;
    const [resumen] = await query(sqlResumen, [month, year]);

    // Desglose por evento
    const sqlEventos = `
      SELECT
        e.titulo,
        DATE_FORMAT(e.fecha_evento, '%d/%m/%Y') as fecha_evento,
        SUM(COALESCE(p.amount, 0))              as total_ingresos,
        COUNT(p.id)                             as total_pagos
      FROM payments p
      INNER JOIN bookings b ON p.booking_id = b.id
      INNER JOIN events   e ON b.event_id   = e.id
      WHERE MONTH(p.fecha_pago) = ? AND YEAR(p.fecha_pago) = ? AND p.estado = 'exitoso'
      GROUP BY e.id, e.titulo, e.fecha_evento
      ORDER BY total_ingresos DESC
    `;
    const eventos = await query(sqlEventos, [month, year]);

    const monthNames = [
      'Enero','Febrero','Marzo','Abril','Mayo','Junio',
      'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
    ];
    const monthLabel = `${monthNames[month - 1]} ${year}`;

    const formatCurrency = (v) =>
      new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(parseFloat(v) || 0);

    const doc = new PDFDocument({
      size: 'A4',
      layout: 'portrait',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=ingresos_${year}_${String(month).padStart(2, '0')}.pdf`,
    );
    doc.pipe(res);

    const pageWidth = doc.page.width - 100; // márgenes de 50

    // Cabecera
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .fillColor('#6366f1')
      .text('La Clave Asociación', { align: 'center' });

    doc.moveDown(0.3);
    doc
      .fontSize(16)
      .fillColor('#111111')
      .text(`Informe de Ingresos — ${monthLabel}`, { align: 'center' });

    doc.moveDown(0.4);
    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#6b7280')
      .text(
        `Generado el: ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}`,
        { align: 'center' },
      );

    doc.moveDown(0.8);
    const lineY = doc.y;
    doc.moveTo(50, lineY).lineTo(50 + pageWidth, lineY).strokeColor('#6366f1').lineWidth(1.5).stroke();
    doc.moveDown(1.2);

    // Resumen
    doc
      .fontSize(13)
      .font('Helvetica-Bold')
      .fillColor('#6366f1')
      .text('Resumen del mes');

    doc.moveDown(0.6);

    const boxY = doc.y;
    const boxH = 54;
    doc.rect(50, boxY, pageWidth, boxH).fill('#f5f3ff');
    doc.rect(50, boxY, pageWidth, boxH).stroke('#6366f1');

    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#374151')
      .text('Total ingresos:', 68, boxY + 12)
      .font('Helvetica')
      .fillColor('#111111')
      .text(formatCurrency(resumen?.total_ingresos), 200, boxY + 12);

    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#374151')
      .text('Total transacciones:', 68, boxY + 32)
      .font('Helvetica')
      .fillColor('#111111')
      .text(String(resumen?.total_pagos || 0), 200, boxY + 32);

    doc.y = boxY + boxH + 20;
    doc.moveDown(0.8);

    // Tabla por evento
    doc
      .fontSize(13)
      .font('Helvetica-Bold')
      .fillColor('#6366f1')
      .text('Desglose por evento');

    doc.moveDown(0.6);

    if (!eventos || eventos.length === 0) {
      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#6b7280')
        .text('No hay pagos asociados a eventos en este período.', { align: 'center' });
    } else {
      const tableTop   = doc.y;
      const tableLeft  = 50;
      const colWidths  = { evento: 240, fecha: 100, pagos: 80, ingresos: 100 };
      const totalWidth = Object.values(colWidths).reduce((a, b) => a + b, 0);

      doc
        .rect(tableLeft, tableTop - 4, totalWidth, 22)
        .fillAndStroke('#6366f1', '#6366f1');

      doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff');
      let cx = tableLeft;
      doc.text('Evento',       cx + 5, tableTop, { width: colWidths.evento,   align: 'left'   }); cx += colWidths.evento;
      doc.text('Fecha evento', cx + 5, tableTop, { width: colWidths.fecha,    align: 'center' }); cx += colWidths.fecha;
      doc.text('Pagos',        cx + 5, tableTop, { width: colWidths.pagos,    align: 'center' }); cx += colWidths.pagos;
      doc.text('Ingresos',     cx + 5, tableTop, { width: colWidths.ingresos, align: 'right'  });

      doc.moveDown(1.4);

      doc.font('Helvetica').fontSize(9).fillColor('#111111');

      let totalEventos = 0;
      eventos.forEach((ev, i) => {
        const rowY = doc.y;

        if (rowY > 700) {
          doc.addPage();
          doc.y = 50;
        }

        if (i % 2 === 0) {
          doc.rect(tableLeft, rowY - 3, totalWidth, 18).fill('#f3f4f6');
          doc.fillColor('#111111');
        }

        cx = tableLeft;
        const titulo = (ev.titulo || '—').length > 38
          ? ev.titulo.substring(0, 35) + '...'
          : (ev.titulo || '—');

        doc.text(titulo,                       cx + 5, rowY, { width: colWidths.evento,   align: 'left'   }); cx += colWidths.evento;
        doc.text(ev.fecha_evento || '—',       cx + 5, rowY, { width: colWidths.fecha,    align: 'center' }); cx += colWidths.fecha;
        doc.text(String(ev.total_pagos || 0),  cx + 5, rowY, { width: colWidths.pagos,    align: 'center' }); cx += colWidths.pagos;
        doc
          .font('Helvetica-Bold')
          .text(formatCurrency(ev.total_ingresos), cx + 5, rowY, { width: colWidths.ingresos, align: 'right' })
          .font('Helvetica');

        totalEventos += parseFloat(ev.total_ingresos) || 0;
        doc.moveDown(0.8);
      });

      const totalRowY = doc.y + 4;
      doc.rect(tableLeft, totalRowY - 4, totalWidth, 22).fill('#6366f1');
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff');
      cx = tableLeft;
      doc.text(
        'TOTAL',
        cx + 5, totalRowY,
        { width: colWidths.evento + colWidths.fecha + colWidths.pagos, align: 'left' },
      );
      cx += colWidths.evento + colWidths.fecha + colWidths.pagos;
      doc.text(formatCurrency(totalEventos), cx + 5, totalRowY, { width: colWidths.ingresos, align: 'right' });
    }

    // Pie
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#9ca3af')
      .text(
        '© La Clave Asociación — Documento generado automáticamente',
        50,
        doc.page.height - 40,
        { align: 'center', width: pageWidth },
      );

    doc.end();
  } catch (error) {
    logger.error('Error al exportar ingresos mensuales a PDF:', error);
    if (res.headersSent) return res.end();
    return res.status(500).json({
      success: false,
      message: 'Error al generar el PDF de ingresos mensuales',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};


export default {
  getGeneralStats,
  getDashboardStats,
  getAdminMenu,
  getUserDetails,
  listSocios,
  getSocioDetails,
  updateSocio,
  deleteSocio,
  deleteSocioPermanent,
  reactivateSocio,
  listMorosos,
  getEventsStats,
  listAllEvents,
  getEventDetailsAdmin,
  listAllBookings,
  getBookingDetails,
  cancelBookingAdmin,
  sendBookingInvitation,
  getBookingsStats,
  getEventPayments,
  getMonthlyRevenue,
  getPaymentsStats,
  listPayments,
  getGalleryStats,
  getRecentActivity,
  getEventsForExportSelector,
  exportSocios,
  exportReservas,
  exportUsuarios,
  exportEventos,
  exportIngresosMensuales,
  listSolicitudes,
  getSolicitudDetails,
  aprobarSolicitud,
  rechazarSolicitud,
  deleteSolicitud,
  getPendientesCount,
  updateUserRole,
};