-- Esquema inicial de La Clave. Crear la base de datos antes de ejecutarlo.

-- users: usuarios básicos, socios y admins
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  telefono VARCHAR(20) NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  dni VARCHAR(20) NOT NULL UNIQUE,
  avatar_url VARCHAR(255),
  role ENUM('basico', 'socio', 'admin') DEFAULT 'basico',
  idioma_preferido VARCHAR(5) DEFAULT 'es',
  email_verified BOOLEAN DEFAULT FALSE,
  activo BOOLEAN DEFAULT TRUE,
  ip_registro VARCHAR(45),
  ultimo_acceso DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  
  INDEX idx_email (email),
  INDEX idx_username (username),
  INDEX idx_dni (dni),
  INDEX idx_role (role),
  INDEX idx_activo (activo),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- socios: membresía
CREATE TABLE IF NOT EXISTS socios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  numero_socio VARCHAR(20) NOT NULL UNIQUE,
  stripe_customer_id VARCHAR(255) NOT NULL,
  stripe_subscription_id VARCHAR(255),
  estado ENUM('activo', 'moroso', 'cancelado', 'pendiente') DEFAULT 'pendiente',
  cuota_mensual DECIMAL(10, 2) DEFAULT 10.00,
  fecha_alta DATE NOT NULL,
  fecha_cancelacion DATE NULL,
  dias_morosidad INT DEFAULT 0,
  notas TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_numero_socio (numero_socio),
  INDEX idx_estado (estado),
  INDEX idx_stripe_customer_id (stripe_customer_id),
  INDEX idx_fecha_alta (fecha_alta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- payments
CREATE TABLE IF NOT EXISTS payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  socio_id INT NOT NULL,
  stripe_payment_id VARCHAR(255) NOT NULL UNIQUE,
  stripe_invoice_id VARCHAR(255),
  monto DECIMAL(10, 2) NOT NULL,
  moneda VARCHAR(3) DEFAULT 'EUR',
  estado ENUM('pendiente', 'completado', 'fallido', 'reembolsado') DEFAULT 'pendiente',
  tipo ENUM('cuota', 'evento', 'otro') DEFAULT 'cuota',
  descripcion TEXT,
  fecha_pago DATETIME,
  fecha_vencimiento DATE,
  intento_reintento INT DEFAULT 0,
  proximo_reintento DATETIME NULL,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (socio_id) REFERENCES socios(id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_socio_id (socio_id),
  INDEX idx_stripe_payment_id (stripe_payment_id),
  INDEX idx_estado (estado),
  INDEX idx_fecha_pago (fecha_pago),
  INDEX idx_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- events
CREATE TABLE IF NOT EXISTS events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  titulo VARCHAR(200) NOT NULL,
  descripcion LONGTEXT,
  fecha_evento DATETIME NOT NULL,
  fecha_fin DATETIME,
  ubicacion VARCHAR(255),
  latitud DECIMAL(10, 8),
  longitud DECIMAL(11, 8),
  imagen_url VARCHAR(255),
  precio_socio DECIMAL(10, 2) DEFAULT 0,
  precio_basico DECIMAL(10, 2),
  capacidad INT NOT NULL,
  entradas_disponibles INT NOT NULL,
  estado ENUM('borrador', 'publicado', 'cancelado', 'realizado') DEFAULT 'borrador',
  destacado BOOLEAN DEFAULT FALSE,
  requiere_confirmacion BOOLEAN DEFAULT FALSE,
  creado_por INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (creado_por) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_estado (estado),
  INDEX idx_fecha_evento (fecha_evento),
  INDEX idx_destacado (destacado),
  INDEX idx_capacidad (capacidad),
  INDEX idx_creado_por (creado_por),
  FULLTEXT idx_fulltext (titulo, descripcion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- bookings: reservas de entradas
CREATE TABLE IF NOT EXISTS bookings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  event_id INT NOT NULL,
  socio_id INT NOT NULL,
  numero_entradas INT DEFAULT 1,
  estado ENUM('confirmada', 'cancelada', 'esperando_pago', 'en_lista_espera') DEFAULT 'confirmada',
  qr_code VARCHAR(255),
  codigo_acceso VARCHAR(50) UNIQUE,
  asistencia BOOLEAN DEFAULT FALSE,
  fecha_asistencia DATETIME NULL,
  notas TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (socio_id) REFERENCES socios(id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_event_id (event_id),
  INDEX idx_socio_id (socio_id),
  INDEX idx_estado (estado),
  INDEX idx_codigo_acceso (codigo_acceso),
  UNIQUE KEY unique_socio_evento (socio_id, event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- gallery
CREATE TABLE IF NOT EXISTS gallery (
  id INT PRIMARY KEY AUTO_INCREMENT,
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  imagen_url VARCHAR(255) NOT NULL,
  thumbnails_url VARCHAR(255),
  tipo ENUM('foto', 'video') DEFAULT 'foto',
  evento_id INT,
  album VARCHAR(100),
  autor_id INT NOT NULL,
  orden INT DEFAULT 0,
  es_destacada BOOLEAN DEFAULT FALSE,
  visibilidad ENUM('publica', 'privada', 'socios_solo') DEFAULT 'privada',
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (evento_id) REFERENCES events(id) ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (autor_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_evento_id (evento_id),
  INDEX idx_album (album),
  INDEX idx_visibilidad (visibilidad),
  INDEX idx_es_destacada (es_destacada),
  INDEX idx_created_at (created_at),
  INDEX idx_autor_id (autor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- activity_log: actividad reciente del admin
CREATE TABLE IF NOT EXISTS activity_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  accion VARCHAR(100) NOT NULL,
  entidad_tipo VARCHAR(50),
  entidad_id INT,
  descripcion TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_accion (accion),
  INDEX idx_created_at (created_at),
  INDEX idx_entidad (entidad_tipo, entidad_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- contacts: mensajes del formulario de contacto
CREATE TABLE IF NOT EXISTS contacts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  telefono VARCHAR(20),
  asunto VARCHAR(200) NOT NULL,
  mensaje LONGTEXT NOT NULL,
  estado ENUM('nuevo', 'leido', 'respondido', 'cerrado') DEFAULT 'nuevo',
  respuesta TEXT,
  respondido_por INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (respondido_por) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_estado (estado),
  INDEX idx_email (email),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Procedimientos almacenados

-- Estadísticas generales
DELIMITER //

DROP PROCEDURE IF EXISTS obtener_estadisticas_generales //

CREATE PROCEDURE obtener_estadisticas_generales()
BEGIN
  SELECT
    (SELECT COUNT(*) FROM users WHERE role = 'basico' AND activo = TRUE) as total_usuarios_basicos,
    (SELECT COUNT(*) FROM socios WHERE estado = 'activo') as total_socios_activos,
    (SELECT COUNT(*) FROM socios WHERE estado = 'moroso') as total_socios_morosos,
    (SELECT COUNT(*) FROM events WHERE estado = 'publicado' AND fecha_evento > NOW()) as eventos_proximos,
    (SELECT COUNT(*) FROM events WHERE estado = 'realizado') as eventos_realizados,
    (SELECT COUNT(*) FROM bookings WHERE estado = 'confirmada') as reservas_activas,
    (SELECT COALESCE(SUM(monto), 0) FROM payments WHERE estado = 'completado' AND MONTH(fecha_pago) = MONTH(NOW()) AND YEAR(fecha_pago) = YEAR(NOW())) as ingresos_mes_actual,
    (SELECT COALESCE(SUM(monto), 0) FROM payments WHERE estado = 'completado' AND YEAR(fecha_pago) = YEAR(NOW())) as ingresos_año_actual,
    (SELECT COUNT(*) FROM contacts WHERE estado = 'nuevo') as mensajes_pendientes;
END //

-- Ingresos de los últimos 12 meses
DROP PROCEDURE IF EXISTS obtener_ingresos_mensuales //

CREATE PROCEDURE obtener_ingresos_mensuales()
BEGIN
  SELECT
    DATE_FORMAT(fecha_pago, '%Y-%m') as mes,
    COALESCE(SUM(monto), 0) as total,
    COUNT(*) as transacciones
  FROM payments
  WHERE estado = 'completado' AND fecha_pago >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
  GROUP BY DATE_FORMAT(fecha_pago, '%Y-%m')
  ORDER BY mes DESC;
END //

-- Socios morosos
DROP PROCEDURE IF EXISTS obtener_socios_morosos //

CREATE PROCEDURE obtener_socios_morosos(IN dias_limite INT)
BEGIN
  SELECT
    s.id,
    s.numero_socio,
    u.nombre,
    u.apellidos,
    u.email,
    u.telefono,
    s.estado,
    s.dias_morosidad,
    s.fecha_alta
  FROM socios s
  JOIN users u ON s.user_id = u.id
  WHERE s.estado = 'moroso' OR (s.estado = 'activo' AND s.dias_morosidad >= dias_limite)
  ORDER BY s.dias_morosidad DESC;
END //

DELIMITER ;

-- Índices

CREATE INDEX idx_events_fecha_range ON events(fecha_evento, estado);

CREATE INDEX idx_payments_socio_estado ON payments(socio_id, estado);

CREATE INDEX idx_bookings_socio_evento ON bookings(socio_id, event_id, estado);

-- Los usuarios se crean desde la aplicación

-- Ampliación: salas, artistas, guest lists, suplementos, redes, vistas y triggers

USE la_clave;

-- venues: salas
CREATE TABLE IF NOT EXISTS venues (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  direccion TEXT NOT NULL,
  ciudad VARCHAR(100) NOT NULL,
  codigo_postal VARCHAR(10),
  pais VARCHAR(50) DEFAULT 'España',
  latitud DECIMAL(10, 8),
  longitud DECIMAL(11, 8),
  capacidad_maxima INT DEFAULT 300,
  descripcion TEXT,
  imagen_url VARCHAR(255),
  website VARCHAR(255),
  telefono VARCHAR(20),
  email VARCHAR(100),
  tipo_local ENUM('club', 'sala', 'bar', 'exterior', 'otro') DEFAULT 'club',
  accesibilidad TEXT,
  transporte_publico TEXT,
  parking BOOLEAN DEFAULT FALSE,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
  INDEX idx_ciudad (ciudad),
  INDEX idx_activo (activo),
  INDEX idx_tipo (tipo_local)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- artists: artistas y DJs
CREATE TABLE IF NOT EXISTS artists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre_artistico VARCHAR(200) NOT NULL,
  nombre_real VARCHAR(200),
  biografia TEXT,
  pais_origen VARCHAR(50),
  generos VARCHAR(255), -- Separados por comas
  imagen_url VARCHAR(255),
  website VARCHAR(255),
  spotify_url VARCHAR(255),
  soundcloud_url VARCHAR(255),
  instagram_handle VARCHAR(100),
  facebook_url VARCHAR(255),
  verificado BOOLEAN DEFAULT FALSE,
  destacado BOOLEAN DEFAULT FALSE,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
  INDEX idx_nombre (nombre_artistico),
  INDEX idx_verificado (verificado),
  INDEX idx_destacado (destacado),
  INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- event_artists: eventos y artistas (N:M)
CREATE TABLE IF NOT EXISTS event_artists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  artist_id INT NOT NULL,
  es_headliner BOOLEAN DEFAULT FALSE,
  orden_aparicion INT DEFAULT 0,
  hora_inicio TIME,
  hora_fin TIME,
  cupo_guest_list INT DEFAULT 2, -- Cupo de invitados por artista (configurable)
  guest_list_usados INT DEFAULT 0, -- Contador de invitados añadidos
  notas TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE,
  UNIQUE KEY unique_event_artist (event_id, artist_id),
  INDEX idx_event (event_id),
  INDEX idx_artist (artist_id),
  INDEX idx_headliner (event_id, es_headliner),
  INDEX idx_orden (event_id, orden_aparicion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- event_genres: géneros de cada evento
CREATE TABLE IF NOT EXISTS event_genres (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  genero VARCHAR(50) NOT NULL,
  orden INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  UNIQUE KEY unique_event_genre (event_id, genero),
  INDEX idx_event (event_id),
  INDEX idx_genero (genero)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- guest_lists: invitados de cada evento
CREATE TABLE IF NOT EXISTS guest_lists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  event_artist_id INT, -- NULL si es guest list del admin, ID si es de un artista
  tipo_guest ENUM('admin', 'artista') NOT NULL DEFAULT 'admin',
  nombre_completo VARCHAR(200) NOT NULL,
  email VARCHAR(100),
  telefono VARCHAR(20),
  acompanantes INT DEFAULT 0, -- Número de personas adicionales que trae
  codigo_acceso VARCHAR(50) UNIQUE, -- Código único para validar en puerta
  estado ENUM('pendiente', 'confirmado', 'entrada_validada', 'cancelado') DEFAULT 'confirmado',
  notas TEXT,
  agregado_por INT NOT NULL, -- ID del admin que lo añadió
  fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_validacion DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (event_artist_id) REFERENCES event_artists(id) ON DELETE CASCADE,
  FOREIGN KEY (agregado_por) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_event (event_id),
  INDEX idx_event_artist (event_artist_id),
  INDEX idx_tipo (tipo_guest),
  INDEX idx_codigo (codigo_acceso),
  INDEX idx_estado (estado),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- event_supplements: cargos extra por evento
CREATE TABLE IF NOT EXISTS event_supplements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  nombre VARCHAR(200) NOT NULL, -- Ej: "Entrada especial", "Acceso VIP"
  descripcion TEXT,
  precio_socio DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  precio_invitado DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  activo BOOLEAN DEFAULT TRUE,
  orden INT DEFAULT 0,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_event (event_id),
  INDEX idx_activo (activo),
  INDEX idx_orden (event_id, orden)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- social_links: redes sociales
CREATE TABLE IF NOT EXISTS social_links (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plataforma VARCHAR(50) NOT NULL, -- instagram, facebook, twitter, spotify, etc.
  url VARCHAR(255) NOT NULL,
  username VARCHAR(100),
  icono VARCHAR(100), -- Clase CSS o nombre del icono
  orden INT DEFAULT 0,
  visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
  INDEX idx_visible (visible),
  INDEX idx_orden (orden)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- events.venue_id
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS venue_id INT AFTER ubicacion;

SET @index_exists = (SELECT COUNT(*) 
  FROM information_schema.statistics 
  WHERE table_schema = 'la_clave' 
  AND table_name = 'events' 
  AND index_name = 'idx_venue');

SET @sql = IF(@index_exists = 0,
  'ALTER TABLE events ADD INDEX idx_venue (venue_id)',
  'SELECT "Index already exists" as status');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_exists = (SELECT COUNT(*) 
  FROM information_schema.TABLE_CONSTRAINTS 
  WHERE CONSTRAINT_SCHEMA = 'la_clave' 
  AND TABLE_NAME = 'events' 
  AND CONSTRAINT_NAME = 'events_venue_fk');

SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE events ADD CONSTRAINT events_venue_fk FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE SET NULL',
  'SELECT "Foreign key already exists" as status');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- bookings.supplement_id y precio_suplemento
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS supplement_id INT AFTER event_id,
ADD COLUMN IF NOT EXISTS precio_suplemento DECIMAL(10,2) DEFAULT 0.00 AFTER precio_pagado;

SET @fk_exists = (SELECT COUNT(*) 
  FROM information_schema.TABLE_CONSTRAINTS 
  WHERE CONSTRAINT_SCHEMA = 'la_clave' 
  AND TABLE_NAME = 'bookings' 
  AND CONSTRAINT_NAME = 'bookings_supplement_fk');

SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE bookings ADD CONSTRAINT bookings_supplement_fk FOREIGN KEY (supplement_id) REFERENCES event_supplements(id) ON DELETE SET NULL',
  'SELECT "Foreign key already exists" as status');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) 
  FROM information_schema.statistics 
  WHERE table_schema = 'la_clave' 
  AND table_name = 'bookings' 
  AND index_name = 'idx_supplement');

SET @sql = IF(@index_exists = 0,
  'ALTER TABLE bookings ADD INDEX idx_supplement (supplement_id)',
  'SELECT "Index already exists" as status');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Triggers de guest lists

DELIMITER $$

-- Código de acceso de cada invitado
DROP TRIGGER IF EXISTS before_guest_list_insert$$
CREATE TRIGGER before_guest_list_insert
BEFORE INSERT ON guest_lists
FOR EACH ROW
BEGIN
  IF NEW.codigo_acceso IS NULL THEN
    SET NEW.codigo_acceso = CONCAT('LCG-', 
      YEAR(CURDATE()), 
      LPAD(MONTH(CURDATE()), 2, '0'),
      '-',
      UPPER(SUBSTRING(MD5(CONCAT(NEW.event_id, NEW.email, NOW(), RAND())), 1, 8))
    );
  END IF;
END$$

-- Cupo de invitados del artista
DROP TRIGGER IF EXISTS before_guest_list_artist_insert$$
CREATE TRIGGER before_guest_list_artist_insert
BEFORE INSERT ON guest_lists
FOR EACH ROW
BEGIN
  DECLARE v_cupo INT;
  DECLARE v_usados INT;
    
  IF NEW.tipo_guest = 'artista' AND NEW.event_artist_id IS NOT NULL THEN
    SELECT cupo_guest_list, guest_list_usados
    INTO v_cupo, v_usados
    FROM event_artists
    WHERE id = NEW.event_artist_id;
        
    IF v_usados >= v_cupo THEN
      SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'El artista ha alcanzado su límite de invitados para este evento';
    END IF;
  END IF;
END$$

-- Suma un invitado usado al artista
DROP TRIGGER IF EXISTS after_guest_list_insert$$
CREATE TRIGGER after_guest_list_insert
AFTER INSERT ON guest_lists
FOR EACH ROW
BEGIN
  IF NEW.tipo_guest = 'artista' AND NEW.event_artist_id IS NOT NULL THEN
    UPDATE event_artists
    SET guest_list_usados = guest_list_usados + 1 + NEW.acompanantes
    WHERE id = NEW.event_artist_id;
  END IF;
END$$

-- Libera el cupo al cancelar un invitado
DROP TRIGGER IF EXISTS after_guest_list_update$$
CREATE TRIGGER after_guest_list_update
AFTER UPDATE ON guest_lists
FOR EACH ROW
BEGIN
  IF OLD.tipo_guest = 'artista' 
     AND OLD.event_artist_id IS NOT NULL 
     AND OLD.estado != 'cancelado' 
     AND NEW.estado = 'cancelado' THEN
        
    UPDATE event_artists
    SET guest_list_usados = GREATEST(0, guest_list_usados - 1 - OLD.acompanantes)
    WHERE id = OLD.event_artist_id;
  END IF;
END$$

DELIMITER ;

-- Vistas y procedimientos auxiliares

-- Vista: lineup de cada evento
DROP VIEW IF EXISTS event_lineup;
CREATE VIEW event_lineup AS
SELECT 
  e.id as event_id,
  e.titulo as evento,
  e.fecha_evento,
  a.id as artist_id,
  a.nombre_artistico,
  ea.es_headliner,
  ea.orden_aparicion,
  ea.hora_inicio,
  ea.hora_fin,
  ea.cupo_guest_list,
  ea.guest_list_usados,
  (ea.cupo_guest_list - ea.guest_list_usados) as cupo_disponible,
  a.generos as artista_generos,
  a.imagen_url as artista_imagen
FROM events e
LEFT JOIN event_artists ea ON e.id = ea.event_id
LEFT JOIN artists a ON ea.artist_id = a.id
WHERE e.estado = 'publicado'
ORDER BY e.fecha_evento DESC, ea.orden_aparicion ASC;

-- Vista: resumen de invitados por evento
DROP VIEW IF EXISTS guest_list_summary;
CREATE VIEW guest_list_summary AS
SELECT 
  e.id as event_id,
  e.titulo as evento,
  e.fecha_evento,
  COUNT(DISTINCT gl.id) as total_invitados,
  COUNT(DISTINCT CASE WHEN gl.tipo_guest = 'admin' THEN gl.id END) as invitados_admin,
  COUNT(DISTINCT CASE WHEN gl.tipo_guest = 'artista' THEN gl.id END) as invitados_artistas,
  COUNT(DISTINCT CASE WHEN gl.estado = 'entrada_validada' THEN gl.id END) as validados,
  SUM(gl.acompanantes) as total_acompanantes
FROM events e
LEFT JOIN guest_lists gl ON e.id = gl.event_id
GROUP BY e.id;

-- Vista: salas activas con estadísticas
DROP VIEW IF EXISTS venues_stats;
CREATE VIEW venues_stats AS
SELECT 
  v.id,
  v.nombre,
  v.ciudad,
  v.capacidad_maxima,
  COUNT(DISTINCT e.id) as total_eventos,
  COUNT(DISTINCT CASE WHEN e.estado = 'publicado' AND e.fecha_evento >= CURDATE() THEN e.id END) as eventos_proximos,
  v.activo
FROM venues v
LEFT JOIN events e ON v.id = e.venue_id
GROUP BY v.id;

-- Vista: suplementos por evento
DROP VIEW IF EXISTS event_supplements_view;
CREATE VIEW event_supplements_view AS
SELECT 
  es.*,
  e.titulo as evento_titulo,
  e.fecha_evento,
  COUNT(DISTINCT b.id) as veces_usado
FROM event_supplements es
INNER JOIN events e ON es.event_id = e.id
LEFT JOIN bookings b ON es.id = b.supplement_id AND b.estado = 'confirmada'
WHERE es.activo = TRUE
GROUP BY es.id;

-- Procedimientos auxiliares
DELIMITER $$

DROP PROCEDURE IF EXISTS asignar_artista_evento$$
CREATE PROCEDURE asignar_artista_evento(
  IN p_event_id INT,
  IN p_artist_id INT,
  IN p_es_headliner BOOLEAN,
  IN p_orden INT,
  IN p_hora_inicio TIME,
  IN p_hora_fin TIME,
  IN p_cupo_guest_list INT
)
BEGIN
  INSERT INTO event_artists (
    event_id, 
    artist_id, 
    es_headliner, 
    orden_aparicion, 
    hora_inicio, 
    hora_fin,
    cupo_guest_list
  )
  VALUES (
    p_event_id, 
    p_artist_id, 
    p_es_headliner, 
    p_orden, 
    p_hora_inicio, 
    p_hora_fin,
    COALESCE(p_cupo_guest_list, 2)
  )
  ON DUPLICATE KEY UPDATE
    es_headliner = p_es_headliner,
    orden_aparicion = p_orden,
    hora_inicio = p_hora_inicio,
    hora_fin = p_hora_fin,
    cupo_guest_list = COALESCE(p_cupo_guest_list, cupo_guest_list);
        
  SELECT 'Artista asignado correctamente' as mensaje;
END$$

DROP PROCEDURE IF EXISTS agregar_guest_list$$
CREATE PROCEDURE agregar_guest_list(
  IN p_event_id INT,
  IN p_tipo_guest ENUM('admin', 'artista'),
  IN p_event_artist_id INT, -- NULL si es tipo 'admin'
  IN p_nombre_completo VARCHAR(200),
  IN p_email VARCHAR(100),
  IN p_telefono VARCHAR(20),
  IN p_acompanantes INT,
  IN p_admin_id INT,
  IN p_notas TEXT,
  OUT p_success BOOLEAN,
  OUT p_mensaje VARCHAR(255),
  OUT p_codigo_acceso VARCHAR(50)
)
BEGIN
  DECLARE v_cupo INT;
  DECLARE v_usados INT;
    
  SET p_success = FALSE;
  SET p_mensaje = '';
  SET p_codigo_acceso = NULL;
    
  IF p_tipo_guest = 'artista' AND p_event_artist_id IS NOT NULL THEN
    SELECT cupo_guest_list, guest_list_usados
    INTO v_cupo, v_usados
    FROM event_artists
    WHERE id = p_event_artist_id;
        
    IF v_usados + 1 + p_acompanantes > v_cupo THEN
      SET p_mensaje = CONCAT('Cupo insuficiente. Disponible: ', (v_cupo - v_usados), ', Solicitado: ', (1 + p_acompanantes));
      LEAVE proc_label;
    END IF;
  END IF;
    
  INSERT INTO guest_lists (
    event_id,
    event_artist_id,
    tipo_guest,
    nombre_completo,
    email,
    telefono,
    acompanantes,
    agregado_por,
    notas
  ) VALUES (
    p_event_id,
    p_event_artist_id,
    p_tipo_guest,
    p_nombre_completo,
    p_email,
    p_telefono,
    p_acompanantes,
    p_admin_id,
    p_notas
  );
    
  SELECT codigo_acceso INTO p_codigo_acceso
  FROM guest_lists
  WHERE id = LAST_INSERT_ID();
    
  SET p_success = TRUE;
  SET p_mensaje = 'Invitado agregado correctamente';
    
  proc_label: BEGIN END;
END$$

DELIMITER ;

-- site_settings

INSERT INTO site_settings (clave, valor, tipo, descripcion, grupo) VALUES
('guest_list_enabled', 'true', 'boolean', 'Permitir listas de invitados', 'events'),
('guest_list_default_cupo_artista', '2', 'number', 'Cupo por defecto para artistas', 'events'),
('supplements_enabled', 'true', 'boolean', 'Permitir suplementos en eventos', 'events')
ON DUPLICATE KEY UPDATE valor=valor;

