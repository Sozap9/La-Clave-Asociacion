import { query } from "../config/database.js";
import User from "../models/User.js";
import Socio from "../models/Socio.js";
import SolicitudSocio from "../models/SolicitudSocio.js"; 
import Event from "../models/Event.js";
import Booking from "../models/Booking.js";
import Payment from "../models/Payment.js";
import Gallery from "../models/Gallery.js";
import PDFDocument from "pdfkit";
import EmailService from "../services/emailService.js"; 
import logger from "../config/logger.js"; 

/**
 * ========================================
 * ESTADÍSTICAS Y DASHBOARD
 * ========================================
 */

/**
 * Obtener estadísticas generales del sistema
 * GET /api/admin/stats
 */
export const getGeneralStats = async (req, res) => {
  try {
    // Contar usuarios (SIN el admin — totalUsuarios solo cuenta básicos + socios)
    const usersSql = `
      SELECT 
        COUNT(CASE WHEN role = 'basico' THEN 1 END) as total_usuarios_basicos,
        COUNT(CASE WHEN role = 'socio' THEN 1 END) as total_socios_role
      FROM users
      WHERE activo = true
    `;
    const usersResult = await query(usersSql);

    // Contar eventos
    // ── Arreglado: CCOUNT (typo) → COUNT, y fecha → fecha_evento
    //    (la columna real en la tabla events se llama fecha_evento)
    const eventosSql = `
      SELECT 
        COUNT(CASE WHEN fecha_evento >= CURDATE() THEN 1 END) as eventos_proximos,
        COUNT(CASE WHEN fecha_evento < CURDATE() THEN 1 END) as eventos_realizados
      FROM events
    `;
    const eventosResult = await query(eventosSql);

    // Contar reservas
    const reservasSql = `
      SELECT 
        COUNT(CASE WHEN estado = 'confirmada' THEN 1 END) as reservas_activas
      FROM bookings
    `;
    const reservasResult = await query(reservasSql);

    // Total de socios y socios activos — se leen de la tabla `socios`,
    // que es la fuente de verdad de la membresía, INDEPENDIENTEMENTE
    // del role actual del usuario. En La Clave un admin puede seguir
    // siendo socio a la vez (jerarquía de permisos, no exclusión de
    // membresía) — por eso NO se filtra por role aquí. Ver updateUserRole:
    // al promocionar a alguien a admin, se garantiza que conserve (o se
    // le cree) su fila en `socios`, así nunca deja de contar como socio.
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
        // Excluye admins a propósito — solo cuenta usuarios básicos y socios
        totalUsuarios:
          usersResult[0].total_usuarios_basicos +
          usersResult[0].total_socios_role,
        totalReservas: reservasResult[0].reservas_activas || 0,
        totalSocios: sociosResult[0].total_socios || 0,
        sociosActivos: sociosResult[0].socios_activos || 0,
      },
    });
  } catch (error) {
    console.error("Error en getGeneralStats:", error);
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
    // 1. USUARIOS Y SOCIOS
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
        COUNT(CASE WHEN estado = 'inactivo' THEN 1 END) as socios_baja
      FROM socios
    `;
    const sociosStats = await query(sociosSql);

    // 2. EVENTOS
    const eventosSql = `
      SELECT 
        COUNT(*) as total_eventos,
        COUNT(CASE WHEN estado = 'publicado' THEN 1 END) as publicados,
        COUNT(CASE WHEN estado = 'borrador' THEN 1 END) as borradores,
        COUNT(CASE WHEN estado = 'cancelado' THEN 1 END) as cancelados,
        COUNT(CASE WHEN fecha_evento >= CURDATE() AND estado = 'publicado' THEN 1 END) as proximos,
        COUNT(CASE WHEN fecha_evento < CURDATE() AND estado = 'publicado' THEN 1 END) as pasados,
        AVG(CASE WHEN aforo_maximo > 0 THEN (entradas_reservadas / aforo_maximo * 100) END) as ocupacion_promedio
      FROM events
    `;
    const eventosStats = await query(eventosSql);

    const topEventosSql = `
      SELECT 
        id, titulo, fecha_evento, aforo_maximo, entradas_reservadas,
        ROUND((entradas_reservadas / aforo_maximo * 100), 2) as porcentaje_ocupacion
      FROM events
      WHERE fecha_evento >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
        AND aforo_maximo > 0
        AND estado = 'publicado'
      ORDER BY porcentaje_ocupacion DESC
      LIMIT 5
    `;
    const topEventos = await query(topEventosSql);

    const proximosEventosSql = `
      SELECT 
        id, titulo, fecha_evento, hora_evento, aforo_maximo, 
        entradas_reservadas, entradas_disponibles
      FROM events
      WHERE fecha_evento >= CURDATE() AND estado = 'publicado'
      ORDER BY fecha_evento ASC, hora_evento ASC
      LIMIT 5
    `;
    const proximosEventos = await query(proximosEventosSql);

    // 3. RESERVAS
    const reservasSql = `
      SELECT 
        COUNT(*) as total_reservas,
        COUNT(CASE WHEN estado = 'confirmada' THEN 1 END) as confirmadas,
        COUNT(CASE WHEN estado = 'cancelada' THEN 1 END) as canceladas,
        COUNT(CASE WHEN estado = 'asistida' THEN 1 END) as asistidas,
        COUNT(CASE WHEN DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as reservas_esta_semana,
        COUNT(CASE WHEN DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as reservas_este_mes
      FROM bookings
    `;
    const reservasStats = await query(reservasSql);

    // 4. INGRESOS
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

    // 5. GALERÍA
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
      console.log("Tablas de galería no existen, usando valores por defecto");
    }

    // 6. VENUES Y ARTISTS
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
      console.log("Tabla venues no existe");
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
      console.log("Tabla artists no existe");
    }

    // 7. ACTIVIDAD RECIENTE
    const tableCheckSql = `SHOW TABLES LIKE 'audit_log'`;
    const tableExists = await query(tableCheckSql);

    let actividadReciente = [];

    if (tableExists.length > 0) {
      const actividadSql = `
        SELECT 
          a.accion, a.entidad, a.descripcion, a.created_at,
          u.nombre
        FROM audit_log a
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
    console.error("Error en getDashboardStats:", error);
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
    console.error("Error en getAdminMenu:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener menú del panel",
    });
  }
};

/**
 * ========================================
 * GESTIÓN DE USUARIOS
 * ========================================
 */

/**
 * Obtener detalles de un usuario específico
 */
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

    // Si es socio, obtener estadísticas de reservas
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
    console.error("Error en getUserDetails:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener detalles del usuario",
    });
  }
};

/**
 * ========================================
 * GESTIÓN DE SOCIOS
 * ========================================
 */

/**
 * Listar todos los socios
 * GET /api/admin/socios
 */
export const listSocios = async (req, res) => {
  try {
    const { page = 1, limit = 20, estado, search } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
    };

    if (estado) options.estado = estado;

    const result = await Socio.list(
      options.page,
      options.limit,
      options.estado,
    );

    if (search) {
      const searchResults = await Socio.search(search);
      return res.status(200).json({
        success: true,
        data: {
          socios: searchResults,
          pagination: {
            total: searchResults.length,
            page: 1,
            pages: 1,
          },
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        socios: result.socios,
        pagination: {
          total: result.total,
          page: result.page,
          pages: result.pages,
        },
      },
    });
  } catch (error) {
    console.error("Error en listSocios:", error);
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
    console.error("Error en listUsers:", error);
    return res.status(500).json({
      success: false,
      message: "Error al listar usuarios",
    });
  }
};

/**
 * Crear socio manualmente a partir de un usuario básico existente
 * Sin pago previo — pensado para altas administrativas (invitados,
 * casos especiales, etc.)
 *
 * numero_socio y fecha_alta los rellena automáticamente el trigger
 * before_socio_insert de la tabla `socios` — aquí NO se generan a mano
 * para no duplicar esa lógica ni arriesgarnos a que choquen.
 *
 * POST /api/admin/socios
 * Body: { user_id, cuota_mensual?, notas_admin? }
 */
export const createSocioManual = async (req, res) => {
  try {
    const { user_id, cuota_mensual = 10.0, notas_admin } = req.body;

    // El usuario debe existir y ser 'basico' — no tiene sentido
    // "convertir en socio" a alguien que ya es socio o admin
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

    // user_id es UNIQUE en socios — comprobar antes para dar un mensaje
    // claro en vez de un error crudo de MySQL
    const socioExistente = await Socio.findByUserId(user_id);
    if (socioExistente) {
      return res.status(409).json({
        success: false,
        message: "Este usuario ya tiene un registro de socio",
      });
    }

    // Crear el registro de socio. numero_socio y fecha_alta quedan
    // en NULL a propósito — el trigger before_socio_insert los rellena.
    // stripe_customer_id no se manda: es nullable (migración 003) porque
    // un alta manual/gratuita no tiene cliente de Stripe.
    const insertResult = await query(
      `INSERT INTO socios (user_id, cuota_mensual, estado, notas_admin)
       VALUES (?, ?, 'activo', ?)`,
      [user_id, parseFloat(cuota_mensual), notas_admin || null],
    );

    // Cambiar el rol del usuario a 'socio'
    await query("UPDATE users SET role = 'socio' WHERE id = ?", [user_id]);

    const nuevoSocio = await Socio.findById(insertResult.insertId);

    // Email de bienvenida (no bloquea la respuesta si falla ni si tarda)
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
    console.error("Error en createSocioManual:", error);
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

    return res.status(200).json({
      success: true,
      data: {
        socio,
        user,
        payments,
        bookings,
      },
    });
  } catch (error) {
    console.error("Error en getSocioDetails:", error);
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
    console.error("Error en updateSocio:", error);
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

    // El usuario ya se inactiva dentro de Socio.darDeBaja(); este paso es redundante
    // pero lo dejamos con muro de protección por si la lógica cambia.
    if (socio.user_id) {
      try {
        await User.deactivate(socio.user_id);
      } catch (userError) {
        console.warn(
          "No se pudo desactivar user asociado, continua:",
          userError,
        );
      }
    }

    // No detener la desactivación si no hay reservas o hay problema de consulta
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
      console.warn(
        "Error al cancelar reservas asociadas al socio:",
        bookingError,
      );
    }

    return res.status(200).json({
      success: true,
      message: "Socio dado de baja exitosamente",
    });
  } catch (error) {
    console.error("Error en deleteSocio:", error);
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

    // Eliminar el registro de socio (cascade en pagos/reservas)
    await query("DELETE FROM socios WHERE id = ?", [id]);

    // Intentar eliminar el usuario completo (puede fallar por FK)
    try {
      await User.delete(socio.user_id);
    } catch (deleteError) {
      console.warn(
        "No se pudo eliminar el usuario, se aplicará soft delete:",
        deleteError,
      );
      await User.softDelete(socio.user_id);
    }

    return res.status(200).json({
      success: true,
      message: "Socio eliminado permanentemente",
    });
  } catch (error) {
    console.error("Error en deleteSocioPermanent:", error);
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
    console.error("Error en reactivateSocio:", error);
    return res.status(500).json({
      success: false,
      message: "Error al reactivar el socio",
    });
  }
};

/**
 * Listar socios morosos con filtros
 * GET /api/admin/socios/morosos
 *
 * Query params:
 * - search: búsqueda por nombre, apellidos, email, número socio
 * - severidad: 'leve' | 'moderado' | 'grave' | 'all'
 */
export const listMorosos = async (req, res) => {
  try {
    const { search, severidad } = req.query;

    // Construir condiciones WHERE
    const conditions = [
      "(s.estado = 'moroso' OR DATEDIFF(CURDATE(), s.ultimo_pago) > 30)",
    ];
    const params = [];

    // Filtro por búsqueda (nombre, email, número socio)
    if (search && search.trim()) {
      conditions.push(
        "(u.nombre LIKE ? OR u.apellidos LIKE ? OR u.email LIKE ? OR s.numero_socio LIKE ?)",
      );
      const searchPattern = `%${search.trim()}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    // Construir WHERE clause
    const whereClause = "WHERE " + conditions.join(" AND ");

    // Query principal con TODOS los campos necesarios
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

    // Filtro por severidad
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
    console.error("Error en listMorosos:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener socios morosos",
      error: error.message,
    });
  }
};

/**
 * ========================================
 * GESTIÓN DE EVENTOS
 * ========================================
 */

/**
 * Obtener estadísticas de eventos
 * GET /api/admin/events/stats
 */
export const getEventsStats = async (req, res) => {
  try {
    const sql = `
      SELECT 
        COUNT(*) as total_eventos,
        COUNT(CASE WHEN estado = 'publicado' THEN 1 END) as publicados,
        COUNT(CASE WHEN estado = 'borrador' THEN 1 END) as borradores,
        COUNT(CASE WHEN estado = 'cancelado' THEN 1 END) as cancelados,
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
    console.error("Error en getEventsStats:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas de eventos",
    });
  }
};

/**
 * Listar TODOS los eventos (admin - sin filtro de estado)
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
    console.error("Error en listAllEvents:", error);
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
    console.error("Error en getEventDetailsAdmin:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener detalles del evento",
    });
  }
};

/**
 * ========================================
 * GESTIÓN DE RESERVAS
 * ========================================
 */

/**
 * Listar TODAS las reservas (admin)
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
    console.error("Error en listAllBookings:", error);
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
    console.error("Error en getBookingDetails:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener detalles de la reserva",
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
    console.error("Error en cancelBookingAdmin:", error);
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
    console.error("Error en getBookingsStats:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas de reservas",
    });
  }
};

/**
 * ========================================
 * GESTIÓN DE PAGOS
 * ========================================
 */

/**
 * Obtener pagos (entradas) de un evento específico
 * GET /api/admin/events/:eventId/payments
 *
 * Nueva lógica: lista todas las entradas vendidas del evento con sus pagos
 */
/**
 * Obtener pagos (entradas) de un evento específico
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

    // Paginación y filtros
    const pageNum = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limitNum = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 50),
    );
    const offset = (pageNum - 1) * limitNum;
    const { estado, search } = req.query;

    console.log("📍 [getEventPayments] Consultando evento:", eventId);
    console.log("   Filtros:", {
      search,
      estado,
      page: pageNum,
      limit: limitNum,
    });

    // 1. Verificar que el evento existe
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
    console.log("✅ Evento encontrado:", event.titulo);

    // 2. Stats globales del evento (sin filtros)
    const allEntries = await query(
      `SELECT b.estado, b.numero_entradas
       FROM bookings b
       WHERE b.event_id = ?`,
      [eventId],
    );

    const stats = {
      total_entradas: allEntries.length,
      pagos_exitosos: allEntries.filter((e) => e.estado === "confirmada")
        .length,
      pagos_fallidos: allEntries.filter((e) => e.estado === "cancelada").length,
      pagos_pendientes: allEntries.filter((e) => e.estado === "esperando_pago")
        .length,
      total_ingresos: 0,
    };

    // 3. Query con filtros
    const conditions = ["b.event_id = ?"];
    const params = [eventId];

    // El frontend manda directamente el estado del booking:
    //   "confirmada" | "cancelada" | "esperando_pago" | "en_lista_espera"
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

    console.log("📍 Ejecutando query de bookings con filtros");
    const entries = await query(entriesSql, params);
    console.log("✅ Bookings encontrados:", entries.length);

    console.log(
      "✅ [getEventPayments] Éxito - Retornando",
      entries.length,
      "entradas",
    );

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
    console.error("❌ [getEventPayments] Error:", error.message);
    console.error("Stack:", error.stack);
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

    // Datos mensuales del año solicitado
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
    console.error("Error en getMonthlyRevenue:", error);
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
    console.error("Error en getPaymentsStats:", error);
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

    // Validar paginación
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    // Construir condiciones WHERE
    const conditions = [];
    const params = [];

    // Búsqueda general (payment intent ID, invoice ID, nombre, email)
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

    // Filtro por estado (exitoso, fallido, pendiente)
    if (estado) {
      conditions.push("p.estado = ?");
      params.push(estado);
    }

    // Filtro por tipo_pago/tipo (cuota_mensual, renovacion, evento, etc.)
    if (tipo_pago) {
      conditions.push("p.tipo_pago = ?");
      params.push(tipo_pago);
    }

    const whereClause =
      conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

    // SQL con columnas CORRECTAS según tu BD
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

    // Contar total con los mismos filtros
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
    console.error("Error en listPayments:", error);
    return res.status(500).json({
      success: false,
      message: "Error al listar pagos",
      error: error.message,
    });
  }
};

/**
 * ========================================
 * GALERÍA Y ACTIVIDAD
 * ========================================
 */

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
    console.error("Error en getGalleryStats:", error);
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

    // Validar y sanitizar el limit (entre 1 y 200)
    const limitNum = Math.min(200, Math.max(1, parseInt(limit) || 50));

    const sql = `
      SELECT 
        a.accion, 
        a.entidad, 
        a.entidad_id, 
        a.descripcion, 
        a.ip_address, 
        a.created_at,
        CONCAT(u.nombre, ' ', u.apellidos) as usuario
      FROM audit_log a
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
    console.error("Error en getRecentActivity:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener actividad reciente",
    });
  }
};

/**
 * ========================================
 * EXPORTACIONES CSV
 * ========================================
 */

/**
 * Obtener lista de eventos para el selector del export de reservas
 * GET /api/admin/export/events-selector
 * Devuelve id, titulo, fecha_evento ordenados por fecha_evento DESC sin cap de paginación
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
    console.error('Error en getEventsForExportSelector:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener eventos' });
  }
};

/**
 * Exportar lista de socios en formato PDF
 * GET /api/admin/export/socios
 */
export const exportSocios = async (req, res) => {
  try {
    // Nº socio, nombre completo, email, teléfono, DNI, fecha nacimiento, fecha alta
    const sql = `
      SELECT 
        s.numero_socio,
        CONCAT(u.nombre, ' ', u.apellidos) as nombre_completo,
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

    // Crear documento PDF en landscape para 7 columnas
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margins: { top: 50, bottom: 50, left: 40, right: 40 },
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=socios_${new Date().toISOString().split("T")[0]}.pdf`,
    );

    doc.pipe(res);

    // === ENCABEZADO ===
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("Lista de Socios - La Clave Asociación", { align: "center" });

    doc.moveDown(0.5);
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`Fecha de generación: ${new Date().toLocaleDateString("es-ES")}`, {
        align: "center",
      });

    doc.moveDown(1);
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text(`Total de socios: ${socios.length}`, { align: "center" });

    doc.moveDown(2);

    // === TABLA DE SOCIOS ===
    const tableTop = doc.y;
    const tableLeft = 40;
    const colWidths = {
      numero:    65,
      nombre:   135,
      email:    145,
      telefono:  75,
      dni:       75,
      nacimiento: 75,
      alta:       62,
    };

    const totalWidth = Object.values(colWidths).reduce((a, b) => a + b, 0);

    // Encabezado de tabla
    doc.fontSize(9).font("Helvetica-Bold");
    let currentX = tableLeft;

    doc
      .rect(currentX, tableTop - 5, totalWidth, 20)
      .fillAndStroke("#6366f1", "#6366f1");

    doc.fillColor("#ffffff").text("Nº Socio", currentX + 5, tableTop, { width: colWidths.numero, align: "center" });
    currentX += colWidths.numero;
    doc.text("Nombre completo", currentX + 5, tableTop, { width: colWidths.nombre, align: "left" });
    currentX += colWidths.nombre;
    doc.text("Email", currentX + 5, tableTop, { width: colWidths.email, align: "left" });
    currentX += colWidths.email;
    doc.text("Teléfono", currentX + 5, tableTop, { width: colWidths.telefono, align: "left" });
    currentX += colWidths.telefono;
    doc.text("DNI", currentX + 5, tableTop, { width: colWidths.dni, align: "center" });
    currentX += colWidths.dni;
    doc.text("F. Nacimiento", currentX + 5, tableTop, { width: colWidths.nacimiento, align: "center" });
    currentX += colWidths.nacimiento;
    doc.text("F. Alta", currentX + 5, tableTop, { width: colWidths.alta, align: "center" });

    doc.moveDown(1.5);

    // Filas de datos
    doc.font("Helvetica").fontSize(8).fillColor("#000000");

    socios.forEach((socio, index) => {
      const rowY = doc.y;

      if (rowY > 500) {
        doc.addPage();
        doc.y = 50;
      }

      if (index % 2 === 0) {
        doc.rect(tableLeft, rowY - 3, totalWidth, 18).fill("#f3f4f6");
        doc.fillColor("#000000");
      }

      currentX = tableLeft;

      doc.text(socio.numero_socio || "-", currentX + 5, rowY, { width: colWidths.numero, align: "center" });
      currentX += colWidths.numero;

      const nombre = socio.nombre_completo || "-";
      doc.text(nombre.length > 22 ? nombre.substring(0, 19) + "..." : nombre, currentX + 5, rowY, { width: colWidths.nombre, align: "left" });
      currentX += colWidths.nombre;

      const email = socio.email || "-";
      doc.text(email.length > 24 ? email.substring(0, 21) + "..." : email, currentX + 5, rowY, { width: colWidths.email, align: "left" });
      currentX += colWidths.email;

      doc.text(socio.telefono || "-", currentX + 5, rowY, { width: colWidths.telefono, align: "left" });
      currentX += colWidths.telefono;

      doc.text(socio.dni || "-", currentX + 5, rowY, { width: colWidths.dni, align: "center" });
      currentX += colWidths.dni;

      doc.text(socio.fecha_nacimiento || "-", currentX + 5, rowY, { width: colWidths.nacimiento, align: "center" });
      currentX += colWidths.nacimiento;

      doc.text(socio.fecha_alta || "-", currentX + 5, rowY, { width: colWidths.alta, align: "center" });

      doc.moveDown(0.8);
    });

    // === PIE DE PÁGINA ===
    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor("#6b7280")
      .text(
        "© La Clave Asociación - Documento generado automáticamente",
        40,
        540,
        { align: "center", width: totalWidth },
      );

    doc.end();
  } catch (error) {
    console.error("Error al exportar socios a PDF:", error);

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

    // Si hay event_id, obtener el título del evento para el encabezado del PDF
    let eventTitle = null;
    if (event_id) {
      const eventRows = await query('SELECT titulo FROM events WHERE id = ?', [event_id]);
      if (eventRows && eventRows.length > 0) {
        eventTitle = eventRows[0].titulo;
      }
    }

    // Una única línea por socio+evento: la de mayor prioridad de estado.
    // Prioridad: asistida(3) > confirmada(2) > pendiente(1) > cancelada(0).
    // Si hay empate de prioridad, se toma la reserva más reciente (mayor id).
    // Orden final del PDF: activas primero, canceladas al final.
    let sql = `
      SELECT 
        b.codigo_acceso as codigo_reserva,
        CONCAT(u.nombre, ' ', u.apellidos) as nombre_socio,
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

    // Activas primero, canceladas al final; dentro de cada grupo por fecha evento desc
    sql += " ORDER BY CASE b.estado WHEN 'cancelada' THEN 1 ELSE 0 END ASC, e.fecha_evento DESC, b.created_at DESC";

    const reservas = await query(sql, params);

    if (!reservas || reservas.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No hay reservas para exportar con los filtros aplicados",
      });
    }

    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=reservas_${new Date().toISOString().split("T")[0]}.pdf`,
    );

    doc.pipe(res);

    // === ENCABEZADO ===
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text(eventTitle ? `Reservas - ${eventTitle}` : "Lista de Reservas - La Clave Asociación", { align: "center" });

    doc.moveDown(0.5);
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`Fecha de generación: ${new Date().toLocaleDateString("es-ES")}`, {
        align: "center",
      });

    doc.moveDown(1);
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text(`Total de reservas: ${reservas.length}`, { align: "center" });

    doc.moveDown(2);

    // === TABLA DE RESERVAS ===
    const tableTop = doc.y;
    const tableLeft = 50;
    const colWidths = {
      codigo:        140,
      nombre_socio:  145,
      email:         170,
      telefono:       90,
      fecha_reserva:  80,
      estado:         87,
    };

    const totalWidth = Object.values(colWidths).reduce((a, b) => a + b, 0);

    // Encabezado de tabla
    doc.fontSize(9).font("Helvetica-Bold");
    let currentX = tableLeft;

    doc
      .rect(currentX, tableTop - 5, totalWidth, 20)
      .fillAndStroke("#6366f1", "#6366f1");

    doc.fillColor("#ffffff").text("Código reserva", currentX + 5, tableTop, { width: colWidths.codigo, align: "center" });
    currentX += colWidths.codigo;
    doc.text("Nombre socio", currentX + 5, tableTop, { width: colWidths.nombre_socio, align: "left" });
    currentX += colWidths.nombre_socio;
    doc.text("Email", currentX + 5, tableTop, { width: colWidths.email, align: "left" });
    currentX += colWidths.email;
    doc.text("Teléfono", currentX + 5, tableTop, { width: colWidths.telefono, align: "center" });
    currentX += colWidths.telefono;
    doc.text("F. Reserva", currentX + 5, tableTop, { width: colWidths.fecha_reserva, align: "center" });
    currentX += colWidths.fecha_reserva;
    doc.text("Estado", currentX + 5, tableTop, { width: colWidths.estado, align: "center" });

    doc.moveDown(1.5);

    // Filas de datos
    doc.font("Helvetica").fontSize(8).fillColor("#000000");

    reservas.forEach((reserva, index) => {
      const rowY = doc.y;

      if (rowY > 500) {
        doc.addPage();
        doc.y = 50;
      }

      if (index % 2 === 0) {
        doc.rect(tableLeft, rowY - 3, totalWidth, 18).fill("#f3f4f6");
        doc.fillColor("#000000");
      }

      currentX = tableLeft;

      // Código reserva
      const codigo = reserva.codigo_reserva || "-";
      doc.text(codigo.length > 22 ? codigo.substring(0, 19) + "..." : codigo, currentX + 5, rowY, { width: colWidths.codigo, align: "center" });
      currentX += colWidths.codigo;

      // Nombre socio
      const nombre = reserva.nombre_socio || "-";
      doc.text(nombre.length > 20 ? nombre.substring(0, 17) + "..." : nombre, currentX + 5, rowY, { width: colWidths.nombre_socio, align: "left" });
      currentX += colWidths.nombre_socio;

      // Email
      const email = reserva.email_socio || "-";
      doc.text(email.length > 22 ? email.substring(0, 19) + "..." : email, currentX + 5, rowY, { width: colWidths.email, align: "left" });
      currentX += colWidths.email;

      // Teléfono
      doc.text(reserva.telefono_contacto || "-", currentX + 5, rowY, { width: colWidths.telefono, align: "center" });
      currentX += colWidths.telefono;

      // Fecha reserva
      doc.text(reserva.fecha_reserva || "-", currentX + 5, rowY, { width: colWidths.fecha_reserva, align: "center" });
      currentX += colWidths.fecha_reserva;

      // Estado con color
      const estadoColor =
        reserva.estado === "confirmada"
          ? "#10b981"
          : reserva.estado === "cancelada"
            ? "#ef4444"
            : reserva.estado === "asistida"
              ? "#3b82f6"
              : "#6b7280";
      doc
        .fillColor(estadoColor)
        .text(reserva.estado || "-", currentX + 5, rowY, { width: colWidths.estado, align: "center" })
        .fillColor("#000000");

      doc.moveDown(0.8);
    });

    // === PIE DE PÁGINA ===
    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor("#6b7280")
      .text(
        "© La Clave Asociación - Documento generado automáticamente",
        50,
        540,
        { align: "center", width: totalWidth },
      );

    doc.end();
  } catch (error) {
    console.error("Error al exportar reservas a PDF:", error);

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
 * Exportar lista de usuarios en formato CSV
 * GET /api/admin/export/usuarios?format=csv
 */
export const exportUsuarios = async (req, res) => {
  try {
    // Consulta para obtener todos los usuarios
    const sql = `
      SELECT 
        u.nombre,
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

    // Crear documento PDF
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    // Configurar headers para descarga
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=usuarios_${new Date().toISOString().split("T")[0]}.pdf`,
    );

    // Pipe el PDF directamente a la respuesta
    doc.pipe(res);

    // === ENCABEZADO ===
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("Lista de Usuarios - La Clave Asociación", { align: "center" });

    doc.moveDown(0.5);
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`Fecha de generación: ${new Date().toLocaleDateString("es-ES")}`, {
        align: "center",
      });

    doc.moveDown(1);

    // Estadísticas rápidas
    const activos = usuarios.filter((u) => u.estado === "Activo").length;
    const socios = usuarios.filter((u) => u.role === "socio").length;
    const admins = usuarios.filter((u) => u.role === "admin").length;

    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text(
        `Total: ${usuarios.length} usuarios | Activos: ${activos} | Socios: ${socios} | Admins: ${admins}`,
        { align: "center" },
      );

    doc.moveDown(2);

    // === TABLA DE USUARIOS ===
    const tableTop = doc.y;
    const tableLeft = 50;
    const colWidths = {
      nombre: 130,
      email: 170,
      telefono: 90,
      rol: 60,
      estado: 60,
      verificado: 60,
      fecha: 80,
    };

    // Dibuja encabezados de columnas
    doc.fontSize(9).font("Helvetica-Bold");

    let currentX = tableLeft;
    const totalWidth = Object.values(colWidths).reduce((a, b) => a + b, 0);

    doc
      .rect(currentX, tableTop - 5, totalWidth, 20)
      .fillAndStroke("#6366f1", "#6366f1");

    doc.fillColor("#ffffff").text("Nombre", currentX + 5, tableTop, {
      width: colWidths.nombre,
      align: "left",
    });
    currentX += colWidths.nombre;

    doc.text("Email", currentX + 5, tableTop, {
      width: colWidths.email,
      align: "left",
    });
    currentX += colWidths.email;

    doc.text("Teléfono", currentX + 5, tableTop, {
      width: colWidths.telefono,
      align: "center",
    });
    currentX += colWidths.telefono;

    doc.text("Rol", currentX + 5, tableTop, {
      width: colWidths.rol,
      align: "center",
    });
    currentX += colWidths.rol;

    doc.text("Estado", currentX + 5, tableTop, {
      width: colWidths.estado,
      align: "center",
    });
    currentX += colWidths.estado;

    doc.text("Verif.", currentX + 5, tableTop, {
      width: colWidths.verificado,
      align: "center",
    });
    currentX += colWidths.verificado;

    doc.text("Registro", currentX + 5, tableTop, {
      width: colWidths.fecha,
      align: "center",
    });

    doc.moveDown(1.5);

    // Dibuja filas de datos
    doc.font("Helvetica").fontSize(8).fillColor("#000000");

    usuarios.forEach((usuario, index) => {
      const rowY = doc.y;

      // Verifica si necesita nueva página
      if (rowY > 500) {
        doc.addPage();
        doc.y = 50;
      }

      // Alterna colores de fila
      if (index % 2 === 0) {
        doc.rect(tableLeft, rowY - 3, totalWidth, 18).fill("#f3f4f6");
        doc.fillColor("#000000");
      }

      currentX = tableLeft;

      // Nombre (truncar si es muy largo)
      const nombre = usuario.nombre || "-";
      doc.text(
        nombre.length > 20 ? nombre.substring(0, 17) + "..." : nombre,
        currentX + 5,
        rowY,
        { width: colWidths.nombre, align: "left" },
      );
      currentX += colWidths.nombre;

      // Email (truncar si es muy largo)
      const email = usuario.email || "-";
      doc.text(
        email.length > 26 ? email.substring(0, 23) + "..." : email,
        currentX + 5,
        rowY,
        { width: colWidths.email, align: "left" },
      );
      currentX += colWidths.email;

      // Teléfono
      doc.text(usuario.telefono || "-", currentX + 5, rowY, {
        width: colWidths.telefono,
        align: "center",
      });
      currentX += colWidths.telefono;

      // Rol
      const rolColor =
        usuario.role === "admin"
          ? "#ef4444"
          : usuario.role === "socio"
            ? "#6366f1"
            : "#6b7280";
      doc
        .fillColor(rolColor)
        .text(usuario.role || "-", currentX + 5, rowY, {
          width: colWidths.rol,
          align: "center",
        })
        .fillColor("#000000");
      currentX += colWidths.rol;

      // Estado
      const estadoColor = usuario.estado === "Activo" ? "#10b981" : "#ef4444";
      doc
        .fillColor(estadoColor)
        .text(usuario.estado, currentX + 5, rowY, {
          width: colWidths.estado,
          align: "center",
        })
        .fillColor("#000000");
      currentX += colWidths.estado;

      // Email verificado
      const verifColor =
        usuario.email_verificado === "Sí" ? "#10b981" : "#f59e0b";
      doc
        .fillColor(verifColor)
        .text(usuario.email_verificado, currentX + 5, rowY, {
          width: colWidths.verificado,
          align: "center",
        })
        .fillColor("#000000");
      currentX += colWidths.verificado;

      // Fecha registro
      doc.text(usuario.fecha_registro || "-", currentX + 5, rowY, {
        width: colWidths.fecha,
        align: "center",
      });

      doc.moveDown(0.8);
    });

    // === PIE DE PÁGINA ===
    const bottomY = 540;
    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor("#6b7280")
      .text(
        "© La Clave Asociación - Documento generado automáticamente",
        50,
        bottomY,
        { align: "center", width: totalWidth },
      );

    // Finalizar el documento
    doc.end();
  } catch (error) {
    console.error("Error al exportar usuarios a PDF:", error);

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
    // Nombre evento, fecha, hora, ubicación, aforo, vendidas, asistidas, canceladas
    const sql = `
      SELECT 
        e.titulo,
        DATE_FORMAT(e.fecha_evento, '%d/%m/%Y') as fecha_evento,
        TIME_FORMAT(e.hora_evento, '%H:%i') as hora_evento,
        e.ubicacion,
        e.aforo_maximo,
        COALESCE((
          SELECT COUNT(*) FROM bookings b 
          WHERE b.event_id = e.id AND b.estado = 'confirmada'
        ), 0) as entradas_vendidas,
        COALESCE((
          SELECT COUNT(*) FROM bookings b 
          WHERE b.event_id = e.id AND b.estado = 'asistida'
        ), 0) as entradas_asistidas,
        COALESCE((
          SELECT COUNT(*) FROM bookings b 
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

    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margins: { top: 50, bottom: 50, left: 40, right: 40 },
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=eventos_${new Date().toISOString().split("T")[0]}.pdf`,
    );

    doc.pipe(res);

    // === ENCABEZADO ===
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("Lista de Eventos - La Clave Asociación", { align: "center" });

    doc.moveDown(0.5);
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`Fecha de generación: ${new Date().toLocaleDateString("es-ES")}`, {
        align: "center",
      });

    doc.moveDown(1);
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text(`Total: ${eventos.length} eventos`, { align: "center" });

    doc.moveDown(2);

    // === TABLA DE EVENTOS ===
    const tableTop = doc.y;
    const tableLeft = 40;
    const colWidths = {
      titulo:     175,
      fecha:       75,
      hora:        50,
      ubicacion:  120,
      aforo:       50,
      vendidas:    60,
      asistidas:   65,
      canceladas:  67,
    };

    const totalWidth = Object.values(colWidths).reduce((a, b) => a + b, 0);

    // Encabezado de tabla
    doc.fontSize(9).font("Helvetica-Bold");
    let currentX = tableLeft;

    doc
      .rect(currentX, tableTop - 5, totalWidth, 20)
      .fillAndStroke("#6366f1", "#6366f1");

    doc.fillColor("#ffffff").text("Nombre evento", currentX + 5, tableTop, { width: colWidths.titulo, align: "left" });
    currentX += colWidths.titulo;
    doc.text("Fecha", currentX + 5, tableTop, { width: colWidths.fecha, align: "center" });
    currentX += colWidths.fecha;
    doc.text("Hora", currentX + 5, tableTop, { width: colWidths.hora, align: "center" });
    currentX += colWidths.hora;
    doc.text("Ubicación", currentX + 5, tableTop, { width: colWidths.ubicacion, align: "left" });
    currentX += colWidths.ubicacion;
    doc.text("Aforo", currentX + 5, tableTop, { width: colWidths.aforo, align: "center" });
    currentX += colWidths.aforo;
    doc.text("Vendidas", currentX + 5, tableTop, { width: colWidths.vendidas, align: "center" });
    currentX += colWidths.vendidas;
    doc.text("Asistidas", currentX + 5, tableTop, { width: colWidths.asistidas, align: "center" });
    currentX += colWidths.asistidas;
    doc.text("Canceladas", currentX + 5, tableTop, { width: colWidths.canceladas, align: "center" });

    doc.moveDown(1.5);

    // Filas de datos
    doc.font("Helvetica").fontSize(8).fillColor("#000000");

    eventos.forEach((evento, index) => {
      const rowY = doc.y;

      if (rowY > 500) {
        doc.addPage();
        doc.y = 50;
      }

      if (index % 2 === 0) {
        doc.rect(tableLeft, rowY - 3, totalWidth, 18).fill("#f3f4f6");
        doc.fillColor("#000000");
      }

      currentX = tableLeft;

      // Título
      const titulo = evento.titulo || "-";
      doc.text(titulo.length > 26 ? titulo.substring(0, 23) + "..." : titulo, currentX + 5, rowY, { width: colWidths.titulo, align: "left" });
      currentX += colWidths.titulo;

      // Fecha evento
      doc.text(evento.fecha_evento || "-", currentX + 5, rowY, { width: colWidths.fecha, align: "center" });
      currentX += colWidths.fecha;

      // Hora evento
      doc.text(evento.hora_evento || "-", currentX + 5, rowY, { width: colWidths.hora, align: "center" });
      currentX += colWidths.hora;

      // Ubicación
      const ubicacion = evento.ubicacion || "-";
      doc.text(ubicacion.length > 18 ? ubicacion.substring(0, 15) + "..." : ubicacion, currentX + 5, rowY, { width: colWidths.ubicacion, align: "left" });
      currentX += colWidths.ubicacion;

      // Aforo
      doc.text(evento.aforo_maximo?.toString() || "-", currentX + 5, rowY, { width: colWidths.aforo, align: "center" });
      currentX += colWidths.aforo;

      // Vendidas
      doc.fillColor("#000000").text(evento.entradas_vendidas?.toString() || "0", currentX + 5, rowY, { width: colWidths.vendidas, align: "center" });
      currentX += colWidths.vendidas;

      // Asistidas (azul)
      doc.fillColor("#3b82f6").text(evento.entradas_asistidas?.toString() || "0", currentX + 5, rowY, { width: colWidths.asistidas, align: "center" });
      currentX += colWidths.asistidas;

      // Canceladas (rojo)
      doc.fillColor("#ef4444").text(evento.entradas_canceladas?.toString() || "0", currentX + 5, rowY, { width: colWidths.canceladas, align: "center" });
      doc.fillColor("#000000");

      doc.moveDown(0.8);
    });

    // === PIE DE PÁGINA ===
    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor("#6b7280")
      .text(
        "© La Clave Asociación - Documento generado automáticamente",
        40,
        540,
        { align: "center", width: totalWidth },
      );

    doc.end();
  } catch (error) {
    console.error("Error al exportar eventos a PDF:", error);

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

/**
 * ========================================
 * GESTIÓN DE ROLES Y APROBACIONES
 * ========================================
 */

/**
 * ========================================
 * GESTIÓN DE SOLICITUDES DE SOCIO        ✨ NUEVO
 * ========================================
 */

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
 * Aprobar solicitud → crea usuario socio + entrada en socios
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

    // Comprobar duplicados en users
    const emailExiste = await User.emailExists(solicitud.email);
    if (emailExiste) {
      return res.status(409).json({
        success: false,
        message:
          "Ya existe un usuario con ese email. Revisa la solicitud manualmente.",
      });
    }

    // Crear usuario directamente con el password_hash ya generado
    const createUserSql = `
      INSERT INTO users (
        email, password_hash, nombre, apellidos,
        telefono, fecha_nacimiento, dni, dni_front_url, dni_back_url,
        role, activo, ip_registro, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'socio', TRUE, ?, NOW())
    `;
    const userResult = await query(createUserSql, [
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

    // Crear entrada en socios (membresía gratuita)
    await query(
      `INSERT INTO socios (user_id, numero_socio, stripe_customer_id, estado, cuota_mensual, fecha_alta)
       VALUES (?, NULL, NULL, 'activo', 0.00, CURDATE())`,
      [newUserId],
    );

    // Marcar solicitud como aprobada
    await SolicitudSocio.aprobar(parseInt(id), adminId);

    // Email de bienvenida al nuevo socio (no bloquea la respuesta)
    const newUser = await User.findById(newUserId);
    EmailService.sendSolicitudAprobada(newUser).catch((emailError) => {
      logger.error("Error al enviar email solicitud-aprobada:", emailError);
    });

    logger.info("Solicitud aprobada y socio creado", {
      solicitudId: id,
      newUserId,
      adminId,
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
 * Contar solicitudes pendientes (badge sidebar)
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

    // En La Clave, un admin siempre es también socio — la jerarquía de
    // roles (basico < socio < admin) da permisos crecientes, pero no debe
    // hacer perder la membresía. Si se promociona a 'admin' y todavía no
    // tiene fila en `socios`, se la creamos aquí (numero_socio y fecha_alta
    // los rellena el trigger before_socio_insert). Si ya la tenía, no se
    // toca — se conserva tal cual (cuota, numero_socio, historial...).
    if (role === "admin") {
      const socioExistente = await Socio.findByUserId(id);
      if (!socioExistente) {
        await query(
          `INSERT INTO socios (user_id, cuota_mensual, estado)
           VALUES (?, 0.00, 'activo')`,
          [id],
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
    console.error("Error en updateUserRole:", error);
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

    // --- 1. Resumen del mes ---
    const sqlResumen = `
      SELECT
        SUM(COALESCE(amount, 0)) as total_ingresos,
        COUNT(*)                  as total_pagos
      FROM payments
      WHERE MONTH(fecha_pago) = ? AND YEAR(fecha_pago) = ? AND estado = 'exitoso'
    `;
    const [resumen] = await query(sqlResumen, [month, year]);

    // --- 2. Desglose por evento ---
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

    // === PDF ===
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

    const pageWidth = doc.page.width - 100; // left + right margins = 100

    // === ENCABEZADO ===
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

    // Línea separadora
    doc.moveDown(0.8);
    const lineY = doc.y;
    doc.moveTo(50, lineY).lineTo(50 + pageWidth, lineY).strokeColor('#6366f1').lineWidth(1.5).stroke();
    doc.moveDown(1.2);

    // === RESUMEN DEL MES ===
    doc
      .fontSize(13)
      .font('Helvetica-Bold')
      .fillColor('#6366f1')
      .text('Resumen del mes');

    doc.moveDown(0.6);

    // Caja resumen
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

    // === DESGLOSE POR EVENTO ===
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

      // Cabecera tabla
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

      // Filas de datos
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

      // Fila de total
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

    // === PIE DE PÁGINA ===
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
    console.error('Error al exportar ingresos mensuales a PDF:', error);
    if (res.headersSent) return res.end();
    return res.status(500).json({
      success: false,
      message: 'Error al generar el PDF de ingresos mensuales',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};


/**
 * ========================================
 * EXPORT DEFAULT
 * ========================================
 */
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