#!/usr/bin/env node
// Migración 002 (payments.booking_id): node scripts/runMigration002.js

import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runMigration = async () => {
  try {
    console.log("Iniciando migración 002...\n");

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || "la_clave",
      port: process.env.DB_PORT || 3306,
    });

    console.log("Conectado a la base de datos\n");

    const migrationPath = path.join(
      __dirname,
      "../src/migrations/002-add-booking-id-to-payments.sql",
    );
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    // Sentencia a sentencia, sin las líneas de comentario
    const statements = migrationSQL
      .split(";")
      .map((stmt) => {
        return stmt
          .split("\n")
          .filter((line) => !line.trim().startsWith("--"))
          .join("\n")
          .trim();
      })
      .filter((stmt) => stmt && stmt.length > 5);

    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      try {
        console.log(`Ejecutando: ${statement.substring(0, 80)}...`);
        await connection.query(statement);
        console.log("OK\n");
        successCount++;
      } catch (error) {
        if (
          error.message.includes("Duplicate column name") ||
          error.message.includes("already exists")
        ) {
          console.log("Ya existe (ignorado)\n");
        } else {
          console.error(`Error: ${error.message}\n`);
          errorCount++;
        }
      }
    }

    await connection.end();

    console.log("\n========================================");
    console.log(`Migración completada`);
    console.log(`   Statements ejecutados: ${successCount}`);
    if (errorCount > 0) {
      console.log(`   Errores: ${errorCount}`);
    }
    console.log("========================================\n");

    process.exit(0);
  } catch (error) {
    console.error("Error fatal:", error.message);
    process.exit(1);
  }
};

runMigration();
