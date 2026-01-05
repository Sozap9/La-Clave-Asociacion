import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import database and middleware
import { pool } from './config/database.js';
import { protect } from './middleware/authMiddleware.js';
import { admin } from './middleware/roleMiddleware.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import publicEventRoutes from './routes/publicEventRoutes.js';
import adminEventRoutes from './routes/adminEventRoutes.js';
import adminUserRoutes from './routes/adminUserRoutes.js';
import adminMemberRoutes from './routes/adminMemberRoutes.js';
import adminBookingRoutes from './routes/adminBookingRoutes.js';
import adminStatsRoutes from './routes/adminStatsRoutes.js';

// Load environment variables
dotenv.config();

// ES6 __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize express
const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ========== API ROUTES ==========

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Public event routes
app.use('/api/events', publicEventRoutes);

// Admin routes (require authentication + admin role)
app.use('/api/admin/events', adminEventRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/members', adminMemberRoutes);
app.use('/api/admin/bookings', adminBookingRoutes);
app.use('/api/admin/stats', adminStatsRoutes);

// ========== EXPORT ROUTES (INLINE) ==========

console.log('📦 Registering export routes...');

// Helper function to convert array of objects to CSV
const arrayToCSV = (data, headers) => {
  if (!data || data.length === 0) {
    return headers.join(',') + '\n';
  }

  const headerRow = headers.join(',');
  const rows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) {
        return '';
      }
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',');
  });

  return headerRow + '\n' + rows.join('\n');
};

/**
 * @desc    Export socios to CSV
 * @route   GET /api/admin/export/socios
 * @access  Admin
 */
app.get('/api/admin/export/socios', protect, admin, async (req, res) => {
  try {
    console.log('📥 Export socios requested by:', req.user?.username);

    const query = `
      SELECT 
        u.id,
        u.username,
        u.nombre,
        u.apellidos,
        u.email,
        u.telefono,
        u.fecha_nacimiento,
        u.direccion,
        u.ciudad,
        u.codigo_postal,
        u.pais,
        m.numero_socio,
        m.estado as estado_socio,
        m.fecha_alta,
        m.fecha_baja,
        m.metodo_pago,
        m.notas as notas_socio,
        u.created_at as fecha_registro
      FROM users u
      INNER JOIN members m ON u.id = m.user_id
      WHERE u.role = 'socio'
      ORDER BY m.numero_socio ASC
    `;

    const [socios] = await pool.query(query);

    console.log('✅ Socios found for export:', socios.length);

    const headers = [
      'id',
      'numero_socio',
      'username',
      'nombre',
      'apellidos',
      'email',
      'telefono',
      'fecha_nacimiento',
      'direccion',
      'ciudad',
      'codigo_postal',
      'pais',
      'estado_socio',
      'fecha_alta',
      'fecha_baja',
      'metodo_pago',
      'notas_socio',
      'fecha_registro'
    ];

    const csv = arrayToCSV(socios, headers);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=socios_${new Date().toISOString().split('T')[0]}.csv`);
    
    res.write('\ufeff');
    res.send(csv);

    console.log('✅ Socios CSV exported successfully');
  } catch (error) {
    console.error('❌ Error exporting socios:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting socios',
      error: error.message
    });
  }
});

/**
 * @desc    Export all users to CSV
 * @route   GET /api/admin/export/usuarios
 * @access  Admin
 */
app.get('/api/admin/export/usuarios', protect, admin, async (req, res) => {
  try {
    console.log('📥 Export usuarios requested by:', req.user?.username);

    const query = `
      SELECT 
        u.id,
        u.username,
        u.nombre,
        u.apellidos,
        u.email,
        u.telefono,
        u.fecha_nacimiento,
        u.role,
        u.estado,
        u.direccion,
        u.ciudad,
        u.codigo_postal,
        u.pais,
        u.created_at as fecha_registro,
        u.updated_at as fecha_actualizacion,
        m.numero_socio,
        m.estado as estado_socio,
        m.fecha_alta as fecha_alta_socio
      FROM users u
      LEFT JOIN members m ON u.id = m.user_id AND u.role = 'socio'
      ORDER BY u.created_at DESC
    `;

    const [usuarios] = await pool.query(query);

    console.log('✅ Usuarios found for export:', usuarios.length);

    const headers = [
      'id',
      'username',
      'nombre',
      'apellidos',
      'email',
      'telefono',
      'fecha_nacimiento',
      'role',
      'estado',
      'direccion',
      'ciudad',
      'codigo_postal',
      'pais',
      'numero_socio',
      'estado_socio',
      'fecha_alta_socio',
      'fecha_registro',
      'fecha_actualizacion'
    ];

    const csv = arrayToCSV(usuarios, headers);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=usuarios_${new Date().toISOString().split('T')[0]}.csv`);
    
    res.write('\ufeff');
    res.send(csv);

    console.log('✅ Usuarios CSV exported successfully');
  } catch (error) {
    console.error('❌ Error exporting usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting usuarios',
      error: error.message
    });
  }
});

/**
 * @desc    Export events to CSV
 * @route   GET /api/admin/export/eventos
 * @access  Admin
 */
app.get('/api/admin/export/eventos', protect, admin, async (req, res) => {
  try {
    console.log('📥 Export eventos requested by:', req.user?.username);

    const query = `
      SELECT 
        e.id,
        e.titulo,
        e.descripcion,
        e.fecha_evento,
        e.hora_evento,
        e.ubicacion,
        e.aforo_maximo,
        e.entradas_disponibles,
        e.precio_socio,
        e.precio_invitado,
        e.permite_invitados,
        e.estado,
        e.visible_desde,
        e.destacado,
        e.artistas,
        e.tags,
        e.edad_minima,
        e.created_at as fecha_creacion,
        COUNT(DISTINCT b.id) as total_reservas,
        SUM(CASE WHEN b.estado = 'confirmada' THEN 1 ELSE 0 END) as reservas_confirmadas,
        u.username as creado_por
      FROM events e
      LEFT JOIN bookings b ON e.id = b.event_id
      LEFT JOIN users u ON e.created_by = u.id
      GROUP BY e.id
      ORDER BY e.fecha_evento DESC
    `;

    const [eventos] = await pool.query(query);

    console.log('✅ Eventos found for export:', eventos.length);

    const headers = [
      'id',
      'titulo',
      'descripcion',
      'fecha_evento',
      'hora_evento',
      'ubicacion',
      'aforo_maximo',
      'entradas_disponibles',
      'precio_socio',
      'precio_invitado',
      'permite_invitados',
      'estado',
      'visible_desde',
      'destacado',
      'artistas',
      'tags',
      'edad_minima',
      'total_reservas',
      'reservas_confirmadas',
      'creado_por',
      'fecha_creacion'
    ];

    const csv = arrayToCSV(eventos, headers);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=eventos_${new Date().toISOString().split('T')[0]}.csv`);
    
    res.write('\ufeff');
    res.send(csv);

    console.log('✅ Eventos CSV exported successfully');
  } catch (error) {
    console.error('❌ Error exporting eventos:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting eventos',
      error: error.message
    });
  }
});

/**
 * @desc    Export bookings/reservas to CSV
 * @route   GET /api/admin/export/reservas
 * @access  Admin
 */
app.get('/api/admin/export/reservas', protect, admin, async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, event_id } = req.query;

    console.log('📥 Export reservas requested by:', req.user?.username);
    console.log('   Filters:', { fecha_desde, fecha_hasta, event_id });

    let query = `
      SELECT 
        b.id as reserva_id,
        b.codigo_qr,
        b.estado as estado_reserva,
        b.tipo_entrada,
        b.precio_pagado,
        b.asistio,
        b.fecha_asistencia,
        b.created_at as fecha_reserva,
        e.id as evento_id,
        e.titulo as evento_titulo,
        e.fecha_evento,
        e.hora_evento,
        e.ubicacion as evento_ubicacion,
        u.id as usuario_id,
        u.username,
        u.nombre,
        u.apellidos,
        u.email,
        u.telefono,
        m.numero_socio,
        m.estado as estado_socio
      FROM bookings b
      INNER JOIN events e ON b.event_id = e.id
      INNER JOIN users u ON b.user_id = u.id
      LEFT JOIN members m ON u.id = m.user_id AND u.role = 'socio'
      WHERE 1=1
    `;
    const params = [];

    if (event_id) {
      query += ` AND b.event_id = ?`;
      params.push(event_id);
    }

    if (fecha_desde) {
      query += ` AND DATE(b.created_at) >= ?`;
      params.push(fecha_desde);
    }

    if (fecha_hasta) {
      query += ` AND DATE(b.created_at) <= ?`;
      params.push(fecha_hasta);
    }

    query += ` ORDER BY b.created_at DESC`;

    const [reservas] = params.length > 0
      ? await pool.execute(query, params)
      : await pool.query(query);

    console.log('✅ Reservas found for export:', reservas.length);

    const headers = [
      'reserva_id',
      'codigo_qr',
      'estado_reserva',
      'tipo_entrada',
      'precio_pagado',
      'asistio',
      'fecha_asistencia',
      'fecha_reserva',
      'evento_id',
      'evento_titulo',
      'fecha_evento',
      'hora_evento',
      'evento_ubicacion',
      'usuario_id',
      'username',
      'nombre',
      'apellidos',
      'email',
      'telefono',
      'numero_socio',
      'estado_socio'
    ];

    const csv = arrayToCSV(reservas, headers);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=reservas_${new Date().toISOString().split('T')[0]}.csv`);
    
    res.write('\ufeff');
    res.send(csv);

    console.log('✅ Reservas CSV exported successfully');
  } catch (error) {
    console.error('❌ Error exporting reservas:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting reservas',
      error: error.message
    });
  }
});

console.log('✅ Export routes registered (usuarios, socios, eventos, reservas)');

// ========== END EXPORT ROUTES ==========

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('========================================');
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 API URL: http://localhost:${PORT}/api`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('========================================');
  console.log('📊 Export endpoints available:');
  console.log('   • GET /api/admin/export/socios');
  console.log('   • GET /api/admin/export/usuarios');
  console.log('   • GET /api/admin/export/eventos');
  console.log('   • GET /api/admin/export/reservas');
  console.log('========================================');
});

export default app;
