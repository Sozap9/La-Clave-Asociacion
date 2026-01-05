import { query } from "../config/database.js";
import User from "../models/User.js";
import Socio from "../models/Socio.js";
import Event from "../models/Event.js";
import Booking from "../models/Booking.js";
import Payment from "../models/Payment.js";
import Gallery from "../models/Gallery.js";

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
    // Contar usuarios
    const usersSql = `
      SELECT 
        COUNT(CASE WHEN role = 'basico' THEN 1 END) as total_usuarios_basicos,
        COUNT(CASE WHEN role = 'socio' THEN 1 END) as total_socios,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as total_admins
      FROM users
      WHERE activo = true
    `;
    const usersResult = await query(usersSql);

    // Contar eventos
    const eventosSql = `
      SELECT 
        COUNT(CASE WHEN fecha >= CURDATE() THEN 1 END) as eventos_proximos,
        COUNT(CASE WHEN fecha < CURDATE() THEN 1 END) as eventos_realizados
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

    // Contar socios activos
    const sociosActivosSql = `
      SELECT 
        COUNT(*) as socios_activos
      FROM users
      WHERE role = 'socio' AND activo = true
    `;
    const sociosActivosResult = await query(sociosActivosSql);

    return res.status(200).json({
      success: true,
      data: {
        totalEventos:
          eventosResult[0].eventos_proximos +
          eventosResult[0].eventos_realizados,
        totalUsuarios:
          usersResult[0].total_usuarios_basicos +
          usersResult[0].total_socios +
          usersResult[0].total_admins,
        totalReservas: reservasResult[0].reservas_activas || 0,
        sociosActivos: sociosActivosResult[0].socios_activos || 0,
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
        COUNT(CASE WHEN estado = 'baja' THEN 1 END) as socios_baja
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
          u.username
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
            eventosStats[0].ocupacion_promedio || 0
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
            2
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
 * Listar todos los usuarios básicos
 * GET /api/admin/users
 */
export const listUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      activo,
      email_verified,
    } = req.query;

    // Validar paginación
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    // Construir condiciones WHERE
    const conditions = ["role = ?"];
    const params = ["basico"];

    // Búsqueda general
    if (search && search.trim()) {
      conditions.push(
        "(username LIKE ? OR email LIKE ? OR nombre LIKE ? OR apellidos LIKE ?)"
      );
      const searchPattern = `%${search.trim()}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    // Filtro por role
    if (role && role !== "basico") {
      conditions[0] = "role = ?";
      params[0] = role;
    }

    // Filtro por activo
    if (activo !== undefined) {
      const activoValue = activo === "true" || activo === true ? 1 : 0;
      conditions.push("activo = ?");
      params.push(activoValue);
    }

    // Filtro por email_verified
    if (email_verified !== undefined) {
      const verifiedValue =
        email_verified === "true" || email_verified === true ? 1 : 0;
      conditions.push("email_verified = ?");
      params.push(verifiedValue);
    }

    const whereClause = "WHERE " + conditions.join(" AND ");

    // SQL SIN placeholders en LIMIT/OFFSET
    const sql = `
      SELECT 
        id, username, email, nombre, apellidos, telefono,
        fecha_nacimiento, role, activo, email_verified, created_at
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `;

    const users = await query(sql, params);

    // Contar total
    const countSql = `SELECT COUNT(*) as total FROM users ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    return res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page: pageNum,
          pages: Math.ceil(total / limitNum),
          limit: limitNum,
        },
        filters: { search, role, activo, email_verified },
      },
    });
  } catch (error) {
    console.error("Error en listUsers:", error);
    return res.status(500).json({
      success: false,
      message: "Error al listar usuarios",
      error: error.message,
    });
  }
};

/**
 * Obtener detalles de un usuario específico
 * GET /api/admin/users/:id
 */
export const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const userSql = `
      SELECT 
        u.id, u.username, u.email, u.nombre, u.apellidos, u.telefono,
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
 * Eliminar usuario básico
 * DELETE /api/admin/users/:id
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    if (user.role !== "basico") {
      return res.status(400).json({
        success: false,
        message: "Solo se pueden eliminar usuarios básicos desde aquí",
      });
    }

    await User.deactivate(id);

    return res.status(200).json({
      success: true,
      message: "Usuario desactivado exitosamente",
    });
  } catch (error) {
    console.error("Error en deleteUser:", error);
    return res.status(500).json({
      success: false,
      message: "Error al eliminar usuario",
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
      options.estado
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
 * Crear socio manualmente (sin pago)
 * POST /api/admin/socios
 */
export const createSocio = async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "El ID del usuario es obligatorio",
      });
    }

    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    if (user.role !== "basico") {
      return res.status(400).json({
        success: false,
        message: "El usuario ya tiene otro rol",
      });
    }

    const existingSocio = await Socio.findByUserId(user_id);
    if (existingSocio) {
      return res.status(409).json({
        success: false,
        message: "El usuario ya es socio",
      });
    }

    const puedeCrear = await Socio.puedeCrearNuevoSocio();
    if (!puedeCrear) {
      return res.status(403).json({
        success: false,
        message: "Se ha alcanzado el límite máximo de socios",
      });
    }

    const socioData = {
      user_id,
      stripe_customer_id: null,
      stripe_subscription_id: null,
      payment_method_id: null,
      cuota_mensual: parseFloat(process.env.CUOTA_MENSUAL_SOCIO) || 10.0,
    };

    const socio = await Socio.create(socioData);
    await query("UPDATE users SET role = ? WHERE id = ?", ["socio", user_id]);

    return res.status(201).json({
      success: true,
      message: "Socio creado exitosamente",
      data: socio,
    });
  } catch (error) {
    console.error("Error en createSocio:", error);
    return res.status(500).json({
      success: false,
      message: "Error al crear socio",
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
    await query("UPDATE users SET role = ? WHERE id = ?", [
      "basico",
      socio.user_id,
    ]);

    await query(
      `
      UPDATE bookings 
      SET estado = 'cancelada', motivo_cancelacion = 'Membresía cancelada por administrador'
      WHERE socio_id = ? AND estado = 'confirmada'
      AND event_id IN (SELECT id FROM events WHERE fecha_evento > CURDATE())
    `,
      [id]
    );

    return res.status(200).json({
      success: true,
      message: "Socio dado de baja exitosamente",
    });
  } catch (error) {
    console.error("Error en deleteSocio:", error);
    return res.status(500).json({
      success: false,
      message: "Error al dar de baja al socio",
    });
  }
};

/**
 * Listar socios morosos
 * GET /api/admin/socios/morosos
 */
export const listMorosos = async (req, res) => {
  try {
    const sql = `
      SELECT 
        s.id, s.numero_socio, s.estado, s.pagos_fallidos,
        s.ultimo_pago, s.proximo_pago,
        DATEDIFF(CURDATE(), s.proximo_pago) as dias_retraso,
        u.id as user_id, u.email, u.nombre, u.apellidos, u.telefono
      FROM socios s
      JOIN users u ON s.user_id = u.id
      WHERE s.estado = 'moroso' 
         OR (s.proximo_pago < CURDATE() AND s.estado = 'activo')
      ORDER BY dias_retraso DESC
    `;

    const morosos = await query(sql);

    return res.status(200).json({
      success: true,
      data: morosos,
    });
  } catch (error) {
    console.error("Error en listMorosos:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener socios morosos",
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
        "(b.codigo_reserva LIKE ? OR u.nombre LIKE ? OR u.apellidos LIKE ? OR u.email LIKE ? OR e.titulo LIKE ?)"
      );
      const searchPattern = `%${search.trim()}%`;
      params.push(
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern
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
        u.id as user_id, u.username, u.email, u.nombre, u.apellidos, u.telefono,
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
 * Obtener ingresos por mes
 * GET /api/admin/payments/monthly
 */
export const getMonthlyRevenue = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    const sql = `
      SELECT 
        MONTH(fecha_pago) as mes,
        MONTHNAME(fecha_pago) as mes_nombre,
        SUM(amount) as total,
        COUNT(*) as cantidad_pagos
      FROM payments
      WHERE YEAR(fecha_pago) = ? AND estado = 'exitoso'
      GROUP BY MONTH(fecha_pago), MONTHNAME(fecha_pago)
      ORDER BY MONTH(fecha_pago)
    `;

    const result = await query(sql, [year]);

    return res.status(200).json({
      success: true,
      data: result,
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
        "(p.stripe_payment_intent_id LIKE ? OR p.stripe_invoice_id LIKE ? OR u.nombre LIKE ? OR u.apellidos LIKE ? OR u.email LIKE ?)"
      );
      const searchPattern = `%${search.trim()}%`;
      params.push(
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern
      );
    }

    // Filtro por estado (exitoso, fallido, pendiente)
    if (estado) {
      conditions.push("p.estado = ?");
      params.push(estado);
    }

    // Filtro por tipo_pago (cuota_mensual, renovacion, entrada_evento, etc.)
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
        p.currency,
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
        u.username as usuario
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
 * Exportar lista de socios en formato CSV
 * GET /api/admin/export/socios?format=csv
 */
export const exportSocios = async (req, res) => {
  try {
    const { format = 'csv' } = req.query;

    if (format !== 'csv') {
      return res.status(400).json({
        success: false,
        message: 'Solo se soporta formato CSV actualmente',
      });
    }

    // Consulta para obtener todos los socios con sus datos
    const sql = `
      SELECT 
        s.numero_socio,
        u.nombre,
        u.email,
        u.telefono,
        s.cuota_mensual,
        s.estado,
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
        message: 'No hay socios para exportar',
      });
    }

    // Crear CSV
    const headers = [
      'Número socio',
      'Nombre',
      'Email',
      'Teléfono',
      'Cuota mensual',
      'Estado',
      'Fecha alta'
    ];

    let csv = headers.join(';') + '\n';

    socios.forEach(socio => {
      const row = [
        socio.numero_socio || '',
        socio.nombre || '',
        socio.email || '',
        socio.telefono || '',
        socio.cuota_mensual ? socio.cuota_mensual.toFixed(2) + '€' : '0.00€',
        socio.estado || '',
        socio.fecha_alta || ''
      ];
      csv += row.join(';') + '\n';
    });

    // Configurar headers para descarga
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=socios_export.csv');
    res.setHeader('Content-Length', Buffer.byteLength(csv, 'utf-8'));

    return res.status(200).send('\uFEFF' + csv);
  } catch (error) {
    console.error('Error en exportSocios:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al exportar socios',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Exportar lista de reservas en formato CSV
 * GET /api/admin/export/reservas?format=csv
 */
export const exportReservas = async (req, res) => {
  try {
    const { format = 'csv' } = req.query;

    if (format !== 'csv') {
      return res.status(400).json({
        success: false,
        message: 'Solo se soporta formato CSV actualmente',
      });
    }

    // Consulta para obtener todas las reservas con datos relacionados
    const sql = `
      SELECT 
        b.codigo_reserva,
        u.nombre as nombre_socio,
        u.email,
        e.nombre as nombre_evento,
        DATE_FORMAT(e.fecha, '%d/%m/%Y') as fecha_evento,
        TIME_FORMAT(e.hora_inicio, '%H:%i') as hora_evento,
        b.num_acompanantes,
        b.estado,
        DATE_FORMAT(b.fecha_reserva, '%d/%m/%Y %H:%i') as fecha_reserva,
        CASE WHEN b.asistio = 1 THEN 'Sí' ELSE 'No' END as asistio
      FROM bookings b
      INNER JOIN users u ON b.user_id = u.id
      INNER JOIN events e ON b.event_id = e.id
      ORDER BY b.fecha_reserva DESC
    `;

    const reservas = await query(sql);

    if (!reservas || reservas.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No hay reservas para exportar',
      });
    }

    // Crear CSV
    const headers = [
      'Código reserva',
      'Nombre socio',
      'Email',
      'Evento',
      'Fecha evento',
      'Hora',
      'Acompañantes',
      'Estado',
      'Fecha reserva',
      'Asistió'
    ];

    let csv = headers.join(';') + '\n';

    reservas.forEach(reserva => {
      const row = [
        reserva.codigo_reserva || '',
        reserva.nombre_socio || '',
        reserva.email || '',
        reserva.nombre_evento || '',
        reserva.fecha_evento || '',
        reserva.hora_evento || '',
        reserva.num_acompanantes || '0',
        reserva.estado || '',
        reserva.fecha_reserva || '',
        reserva.asistio || 'No'
      ];
      csv += row.join(';') + '\n';
    });

    // Configurar headers para descarga
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=reservas_export.csv');
    res.setHeader('Content-Length', Buffer.byteLength(csv, 'utf-8'));

    return res.status(200).send('\uFEFF' + csv);
  } catch (error) {
    console.error('Error en exportReservas:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al exportar reservas',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Exportar lista de usuarios en formato CSV
 * GET /api/admin/export/usuarios?format=csv
 */
export const exportUsuarios = async (req, res) => {
  try {
    const { format = 'csv' } = req.query;

    if (format !== 'csv') {
      return res.status(400).json({
        success: false,
        message: 'Solo se soporta formato CSV actualmente',
      });
    }

    // Consulta para obtener todos los usuarios
    const sql = `
      SELECT 
        u.id,
        u.nombre,
        u.email,
        u.telefono,
        u.role,
        CASE WHEN u.activo = 1 THEN 'Activo' ELSE 'Inactivo' END as estado,
        CASE WHEN u.email_verified = 1 THEN 'Sí' ELSE 'No' END as email_verificado,
        DATE_FORMAT(u.created_at, '%d/%m/%Y') as fecha_registro
      FROM users u
      ORDER BY u.created_at DESC
    `;

    const usuarios = await query(sql);

    if (!usuarios || usuarios.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No hay usuarios para exportar',
      });
    }

    // Crear CSV
    const headers = [
      'ID',
      'Nombre',
      'Email',
      'Teléfono',
      'Rol',
      'Estado',
      'Email verificado',
      'Fecha registro'
    ];

    let csv = headers.join(';') + '\n';

    usuarios.forEach(usuario => {
      const row = [
        usuario.id || '',
        usuario.nombre || '',
        usuario.email || '',
        usuario.telefono || '',
        usuario.role || '',
        usuario.estado || '',
        usuario.email_verificado || '',
        usuario.fecha_registro || ''
      ];
      csv += row.join(';') + '\n';
    });

    // Configurar headers para descarga
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=usuarios_export.csv');
    res.setHeader('Content-Length', Buffer.byteLength(csv, 'utf-8'));

    return res.status(200).send('\uFEFF' + csv);
  } catch (error) {
    console.error('Error en exportUsuarios:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al exportar usuarios',
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
  listUsers,
  getUserDetails,
  deleteUser,
  listSocios,
  getSocioDetails,
  createSocio,
  updateSocio,
  deleteSocio,
  listMorosos,
  getEventsStats,
  listAllEvents,
  getEventDetailsAdmin,
  listAllBookings,
  getBookingDetails,
  cancelBookingAdmin,
  getBookingsStats,
  getMonthlyRevenue,
  getPaymentsStats,
  listPayments,
  getGalleryStats,
  getRecentActivity,
  exportSocios,
  exportReservas,
  exportUsuarios,
};
