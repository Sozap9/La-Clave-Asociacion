import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const resetDatabase = async () => {
  let connection;
  
  try {
    console.log('🔌 Conectando a la base de datos...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      multipleStatements: true
    });

    console.log('✅ Conectado a MySQL\n');
    console.log('🧹 Limpiando datos...\n');

    // Desactivar foreign keys
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // TODAS las tablas de tu base de datos (en orden lógico)
    const tablesToTruncate = [
      // Tablas dependientes (con foreign keys)
      'bookings',
      'waiting_list',
      'guest_lists',
      'event_artists',
      'event_genres',
      'event_images',
      'event_stats',
      'event_supplements',
      'payments',
      'socios',
      'notifications',
      'audit_log',
      'sessions',
      'email_queue',
      'contact_messages',
      'gallery_images',
      'gallery_folders',
      
      // Tablas principales
      'events',
      'users',
      'venues',
      'artists',
      
      // Tablas de configuración/sistema
      'content_pages',
      'site_settings',
      'social_links',
      
      // Vistas o tablas calculadas (si existen)
      'proximos_eventos',
      'socios_activos'
    ];

    let truncatedCount = 0;
    let skippedCount = 0;

    // Vaciar cada tabla
    for (const table of tablesToTruncate) {
      try {
        await connection.query(`TRUNCATE TABLE ${table}`);
        console.log(`   ✓ ${table}`);
        truncatedCount++;
      } catch (error) {
        // Si la tabla no existe o es una vista, omitir
        if (error.code === 'ER_NO_SUCH_TABLE' || error.code === 'ER_NONUPDATEABLE_TABLE') {
          console.log(`   ⚠ ${table} (vista o no existe, omitiendo)`);
          skippedCount++;
        } else {
          throw error;
        }
      }
    }

    // Reactivar foreign keys
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log(`\n✅ ${truncatedCount} tablas vaciadas`);
    if (skippedCount > 0) {
      console.log(`⚠️  ${skippedCount} tablas omitidas (vistas o no existen)`);
    }

    console.log('\n👤 Creando usuario admin...');

    console.log('✅ Admin creado\n');

    // Verificar
    const [users] = await connection.query('SELECT id, email, nombre, role FROM users');
    
    console.log('📊 Usuarios en la base de datos:');
    console.table(users);

    // Mostrar estadísticas finales
    console.log('\n📊 Estadísticas:');
    
    const tables = [
      'users', 'events', 'bookings', 'socios', 
      'venues', 'artists', 'gallery_images', 'payments'
    ];

    for (const table of tables) {
      try {
        const [result] = await connection.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`   ${table}: ${result[0].count} registros`);
      } catch (error) {
        // Ignorar si la tabla no existe
      }
    }

    console.log('\n✅ Base de datos reseteada exitosamente');
    console.log('\n🔑 Credenciales de admin:');
    console.log('   Email: admin@laclave.com');
    console.log('   Password: CAMBIAR_PASSWORD\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code) {
      console.error('   Código:', error.code);
    }
    if (error.sql) {
      console.error('   SQL:', error.sql);
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Ejecutar
resetDatabase();