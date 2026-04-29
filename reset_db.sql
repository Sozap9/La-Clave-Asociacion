SET FOREIGN_KEY_CHECKS = 0;

-- Limpiar todas las tablas
DELETE FROM event_supplements;
DELETE FROM event_artists;
DELETE FROM event_genres;
DELETE FROM event_images;
DELETE FROM guest_lists;
DELETE FROM bookings;
DELETE FROM payments;
DELETE FROM waiting_list;
DELETE FROM events;
DELETE FROM gallery_image_artists;
DELETE FROM gallery_images;
DELETE FROM gallery_folder_artists;
DELETE FROM gallery_folders;
DELETE FROM artists;
DELETE FROM venues;
DELETE FROM contacts;
DELETE FROM contact_messages;
DELETE FROM content_pages;
DELETE FROM site_settings;
DELETE FROM social_links;
DELETE FROM notifications;
DELETE FROM push_subscriptions;
DELETE FROM email_queue;
DELETE FROM sessions;
DELETE FROM audit_log;
DELETE FROM solicitudes_socios;
DELETE FROM socios WHERE user_id != 1;
DELETE FROM users WHERE id != 1;

-- Resetear AUTO_INCREMENT
ALTER TABLE users AUTO_INCREMENT = 2;
ALTER TABLE events AUTO_INCREMENT = 1;
ALTER TABLE bookings AUTO_INCREMENT = 1;
ALTER TABLE payments AUTO_INCREMENT = 1;
ALTER TABLE socios AUTO_INCREMENT = 1;
ALTER TABLE solicitudes_socios AUTO_INCREMENT = 1;
ALTER TABLE gallery_folders AUTO_INCREMENT = 1;
ALTER TABLE gallery_images AUTO_INCREMENT = 1;
ALTER TABLE artists AUTO_INCREMENT = 1;
ALTER TABLE venues AUTO_INCREMENT = 1;
ALTER TABLE notifications AUTO_INCREMENT = 1;
ALTER TABLE audit_log AUTO_INCREMENT = 1;
ALTER TABLE email_queue AUTO_INCREMENT = 1;
ALTER TABLE sessions AUTO_INCREMENT = 1;
ALTER TABLE contacts AUTO_INCREMENT = 1;
ALTER TABLE contact_messages AUTO_INCREMENT = 1;
ALTER TABLE push_subscriptions AUTO_INCREMENT = 1;

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Base de datos reseteada correctamente. Solo queda el usuario admin.' AS resultado;