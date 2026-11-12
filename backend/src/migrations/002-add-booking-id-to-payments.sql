-- 002: payments.booking_id, para no depender del booking_id dentro de metadata

ALTER TABLE payments ADD COLUMN booking_id INT NULL AFTER socio_id;

ALTER TABLE payments ADD INDEX idx_booking_id (booking_id);

-- FK opcional (comentada por si hay datos inconsistentes)
-- ALTER TABLE payments ADD FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE payments ADD INDEX idx_booking_socio (booking_id, socio_id);

-- Rellena booking_id desde metadata en los pagos que ya existían
UPDATE payments 
SET booking_id = JSON_EXTRACT(metadata, '$.booking_id')
WHERE metadata IS NOT NULL 
  AND JSON_EXTRACT(metadata, '$.booking_id') IS NOT NULL;

