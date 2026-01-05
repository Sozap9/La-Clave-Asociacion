import mysql from "mysql2/promise";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

console.log("🔧 Script de Migraciones - La Clave");
console.log("=====================================\n");

const runMigrations = async () => {
  let connection;

  try {
    // Conectar a MySQL
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || "la_clave",
    });

    console.log("✅ Conectado a MySQL correctamente\n");

    // Leer archivo de migraciones
    const migrationFile = path.join(
      __dirname,
      "src",
      "migrations",
      "001-initial-schema.sql"
    );

    if (!fs.existsSync(migrationFile)) {
      console.error(
        `❌ Archivo de migraciones no encontrado: ${migrationFile}`
      );
      process.exit(1);
    }

    const sqlScript = fs.readFileSync(migrationFile, "utf8");

    // Dividir el script en comandos individuales
    // Separar por punto y coma pero respetando los procedimientos almacenados
    const commands = sqlScript
      .split(";")
      .map((cmd) => cmd.trim())
      .filter((cmd) => cmd.length > 0 && !cmd.startsWith("--"));

    console.log(
      `📋 Se encontraron ${commands.length} comandos para ejecutar\n`
    );

    let executedCount = 0;
    let skippedCount = 0;

    for (const command of commands) {
      try {
        // Mostrar progreso para comandos grandes
        if (
          command.includes("CREATE PROCEDURE") ||
          command.includes("CREATE TABLE")
        ) {
          const match = command.match(
            /(?:TABLE|PROCEDURE)\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/i
          );
          if (match) {
            console.log(`⏳ Ejecutando: ${match[1]}`);
          }
        }

        // Ejecutar comando
        await connection.query(command);
        executedCount++;
      } catch (error) {
        // Ignorar ciertos errores (como IF NOT EXISTS)
        if (
          error.code === "ER_TABLE_EXISTS_ERROR" ||
          error.message.includes("already exists")
        ) {
          skippedCount++;
        } else if (!error.message.includes("Procedure")) {
          console.warn(`⚠️  Warning: ${error.message}`);
        }
      }
    }

    console.log("\n=====================================");
    console.log("✅ MIGRACIONES COMPLETADAS");
    console.log("=====================================");
    console.log(`✔️  Comandos ejecutados: ${executedCount}`);
    console.log(`⏭️  Comandos omitidos: ${skippedCount}`);
    console.log("=====================================\n");

    // Verificar que las tablas se crearon
    const [tables] = await connection.query(
      `
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      ORDER BY TABLE_NAME
    `,
      [process.env.DB_NAME || "la_clave"]
    );

    console.log("📊 Tablas en la base de datos:");
    tables.forEach((table) => {
      console.log(`   ✓ ${table.TABLE_NAME}`);
    });

    console.log("\n✅ Base de datos lista para usar\n");
  } catch (error) {
    console.error("❌ Error durante las migraciones:", error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Ejecutar
runMigrations();
