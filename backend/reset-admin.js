import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar .env desde la raíz del backend
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('🔧 Script de Reset Admin - La Clave');
console.log('=====================================\n');

const resetAdmin = async () => {
  let connection;
  
  try {
    // Mostrar configuración (sin password)
    console.log('📋 Configuración de conexión:');
    console.log(`   Host: ${process.env.DB_HOST}`);
    console.log(`   User: ${process.env.DB_USER}`);
    console.log(`   Database: ${process.env.DB_NAME}\n`);

    // Conectar a MySQL
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'la_clave'
    });

    console.log('✅ Conectado a MySQL correctamente\n');

    // Verificar si existe el admin
    const [existing] = await connection.execute(
      'SELECT id, username, email, role FROM users WHERE email = ?',
      ['admin@laclave.com']
    );

    if (existing.length > 0) {
      console.log('🗑️  Admin existente encontrado, eliminando...');
      await connection.execute('DELETE FROM users WHERE email = ?', ['admin@laclave.com']);
      console.log('✅ Admin anterior eliminado\n');
    }

    // Generar hash de contraseña
    const password = 'CAMBIAR_PASSWORD';
    console.log('🔐 Generando hash de contraseña...');
    const passwordHash = await bcrypt.hash(password, 10);
    console.log('✅ Hash generado correctamente\n');

    // Crear nuevo admin
    console.log('👤 Creando nuevo usuario admin...');
    const sql = `
      INSERT INTO users (
        username, email, password_hash, nombre, apellidos, 
        telefono, fecha_nacimiento, dni, role, email_verified, activo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      'admin',
      'admin@laclave.com',
      passwordHash,
      'Administrador',
      'La Clave',
      '+34600000000',
      '1990-01-01',
      '00000000A',
      'admin',
      1, // email_verified = true
      1  // activo = true
    ];

    const [result] = await connection.execute(sql, values);
    console.log(`✅ Admin creado con ID: ${result.insertId}\n`);

    // Verificar el admin creado
    const [verificacion] = await connection.execute(
      'SELECT id, username, email, role, activo, email_verified FROM users WHERE email = ?',
      ['admin@laclave.com']
    );

    console.log('📋 Verificación del admin creado:');
    console.log('   ID:', verificacion[0].id);
    console.log('   Username:', verificacion[0].username);
    console.log('   Email:', verificacion[0].email);
    console.log('   Role:', verificacion[0].role);
    console.log('   Activo:', verificacion[0].activo === 1 ? 'SÍ' : 'NO');
    console.log('   Email verificado:', verificacion[0].email_verified === 1 ? 'SÍ' : 'NO');

    console.log('\n=====================================');
    console.log('✅ ADMIN CREADO EXITOSAMENTE');
    console.log('=====================================');
    console.log('📧 Email: admin@laclave.com');
    console.log('🔑 Password: CAMBIAR_PASSWORD');
    console.log('=====================================\n');

    console.log('🧪 Puedes probar el login con:');
    console.log('   POST http://localhost:5000/api/auth/login');
    console.log('   Body: { "email": "admin@laclave.com", "password": "CAMBIAR_PASSWORD" }\n');

    await connection.end();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nDetalles del error:', error);
    
    if (connection) {
      await connection.end();
    }
    
    process.exit(1);
  }
};

resetAdmin();