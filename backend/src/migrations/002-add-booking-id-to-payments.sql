-- ============================================
-- MIGRACIÓN 002: Agregar booking_id a payments
-- ============================================
-- Propósito: Mejorar la relación entre pagos y bookings
-- en lugar de depender de metadata JSON

-- Agregar columna booking_id a la tabla payments
ALTER TABLE payments ADD COLUMN booking_id INT NULL AFTER socio_id;

-- Agregar índice para performance
ALTER TABLE payments ADD INDEX idx_booking_id (booking_id);

-- Agregar foreign key (opcional - comentado si hay datos inconsistentes)
-- ALTER TABLE payments ADD FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Crear índice compuesto para búsquedas frecuentes
ALTER TABLE payments ADD INDEX idx_booking_socio (booking_id, socio_id);

-- Actualizar datos existentes si hay metadata JSON con booking_id
-- (Ejecutar si ya hay datos)
UPDATE payments 
SET booking_id = JSON_EXTRACT(metadata, '$.booking_id')
WHERE metadata IS NOT NULL 
  AND JSON_EXTRACT(metadata, '$.booking_id') IS NOT NULL;

-- ============================================
-- FIN MIGRACIÓN 002
-- ============================================
