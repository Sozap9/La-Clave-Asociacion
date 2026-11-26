-- Estructura de la base de datos (sin datos), exportada de producción el 2026-11-20.
-- Sustituye al esquema inicial anterior, que ya no coincidía con producción.
-- Para crear la base en local: crear la base vacía e importar este archivo.

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `activity_log`
--

DROP TABLE IF EXISTS `activity_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `accion` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entidad_tipo` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entidad_id` int DEFAULT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_accion` (`accion`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_entidad` (`entidad_tipo`,`entidad_id`),
  CONSTRAINT `activity_log_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `artists`
--

DROP TABLE IF EXISTS `artists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `artists` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre_artistico` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre_real` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `biografia` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `pais_origen` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ciudad` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `generos` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sello` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `imagen_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `spotify_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `soundcloud_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `instagram_handle` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `facebook_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `verificado` tinyint(1) DEFAULT '0',
  `destacado` tinyint(1) DEFAULT '0',
  `activo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_nombre` (`nombre_artistico`),
  KEY `idx_verificado` (`verificado`),
  KEY `idx_destacado` (`destacado`),
  KEY `idx_activo` (`activo`),
  KEY `idx_sello` (`sello`),
  KEY `idx_ciudad` (`ciudad`),
  KEY `idx_generos` (`generos`),
  KEY `idx_nombre_artistico` (`nombre_artistico`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `audit_log`
--

DROP TABLE IF EXISTS `audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `accion` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `entidad` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `entidad_id` int DEFAULT NULL,
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `datos_anteriores` json DEFAULT NULL,
  `datos_nuevos` json DEFAULT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_accion` (`user_id`,`accion`),
  KEY `idx_entidad` (`entidad`,`entidad_id`),
  KEY `idx_created` (`created_at`),
  CONSTRAINT `audit_log_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bookings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `socio_id` int NOT NULL,
  `event_id` int NOT NULL,
  `supplement_id` int DEFAULT NULL,
  `tier_id` int DEFAULT NULL,
  `codigo_reserva` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `numero_entradas` int DEFAULT '1',
  `tipo_entrada` enum('socio','invitado') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'socio',
  `precio_pagado` decimal(10,2) DEFAULT '0.00',
  `precio_unitario` decimal(10,2) DEFAULT NULL,
  `es_invitacion` tinyint(1) NOT NULL DEFAULT '0',
  `precio_suplemento` decimal(10,2) DEFAULT '0.00',
  `estado` enum('confirmada','cancelada','esperando_pago','en_lista_espera','asistida') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'confirmada',
  `fecha_reserva` datetime DEFAULT CURRENT_TIMESTAMP,
  `fecha_cancelacion` datetime DEFAULT NULL,
  `motivo_cancelacion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `fecha_asistencia` datetime DEFAULT NULL,
  `qr_code_url` text COLLATE utf8mb4_unicode_ci,
  `notas` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `codigo_acceso` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `qr_code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `asistencia` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo_reserva` (`codigo_reserva`),
  UNIQUE KEY `codigo_acceso` (`codigo_acceso`),
  KEY `idx_codigo_reserva` (`codigo_reserva`),
  KEY `idx_estado` (`estado`),
  KEY `idx_fecha_reserva` (`fecha_reserva`),
  KEY `idx_event_socio` (`event_id`,`socio_id`),
  KEY `idx_booking_event_estado` (`event_id`,`estado`),
  KEY `idx_supplement` (`supplement_id`),
  KEY `bookings_ibfk_1` (`socio_id`),
  KEY `fk_bookings_tier` (`tier_id`),
  CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`socio_id`) REFERENCES `socios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `bookings_supplement_fk` FOREIGN KEY (`supplement_id`) REFERENCES `event_supplements` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_bookings_tier` FOREIGN KEY (`tier_id`) REFERENCES `event_ticket_tiers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `contact_messages`
--

DROP TABLE IF EXISTS `contact_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contact_messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefono` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `asunto` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `mensaje` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `leido` tinyint(1) DEFAULT '0',
  `respondido` tinyint(1) DEFAULT '0',
  `fecha_respuesta` datetime DEFAULT NULL,
  `respuesta_admin` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_leido` (`leido`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `contacts`
--

DROP TABLE IF EXISTS `contacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contacts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `asunto` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `mensaje` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` enum('nuevo','leido','respondido') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'nuevo',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `content_pages`
--

DROP TABLE IF EXISTS `content_pages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `content_pages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `slug` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `idioma` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'es',
  `titulo` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `contenido` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `meta_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `visible` tinyint(1) DEFAULT '1',
  `orden` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_slug_idioma` (`slug`,`idioma`),
  KEY `idx_slug` (`slug`),
  KEY `idx_idioma` (`idioma`),
  KEY `idx_visible` (`visible`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `email_queue`
--

DROP TABLE IF EXISTS `email_queue`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `email_queue` (
  `id` int NOT NULL AUTO_INCREMENT,
  `destinatario_email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `destinatario_nombre` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `asunto` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `contenido_html` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `contenido_texto` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `tipo_email` enum('bienvenida','confirmacion_reserva','recordatorio_evento','pago','newsletter','otro') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `prioridad` int DEFAULT '5',
  `intentos_envio` int DEFAULT '0',
  `max_intentos` int DEFAULT '3',
  `estado` enum('pendiente','enviado','fallido') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pendiente',
  `error_mensaje` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `fecha_programada` datetime DEFAULT NULL,
  `fecha_enviado` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_estado_prioridad` (`estado`,`prioridad`),
  KEY `idx_fecha_programada` (`fecha_programada`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `event_artists`
--

DROP TABLE IF EXISTS `event_artists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_artists` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `artist_id` int NOT NULL,
  `es_headliner` tinyint(1) DEFAULT '0',
  `orden_aparicion` int DEFAULT '0',
  `hora_inicio` time DEFAULT NULL,
  `hora_fin` time DEFAULT NULL,
  `cupo_guest_list` int DEFAULT '2',
  `guest_list_usados` int DEFAULT '0',
  `notas` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_event_artist` (`event_id`,`artist_id`),
  KEY `idx_event` (`event_id`),
  KEY `idx_artist` (`artist_id`),
  KEY `idx_headliner` (`event_id`,`es_headliner`),
  KEY `idx_orden` (`event_id`,`orden_aparicion`),
  CONSTRAINT `event_artists_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `event_artists_ibfk_2` FOREIGN KEY (`artist_id`) REFERENCES `artists` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `event_genres`
--

DROP TABLE IF EXISTS `event_genres`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_genres` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `genero` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `orden` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_event_genre` (`event_id`,`genero`),
  KEY `idx_event` (`event_id`),
  KEY `idx_genero` (`genero`),
  CONSTRAINT `event_genres_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `event_images`
--

DROP TABLE IF EXISTS `event_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_images` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `image_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_type` enum('cartel','artista','venue','otro') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'otro',
  `titulo` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_cover` tinyint(1) DEFAULT '0',
  `orden` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_event_cover` (`event_id`,`is_cover`),
  KEY `idx_orden` (`event_id`,`orden`),
  CONSTRAINT `event_images_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Temporary view structure for view `event_stats`
--

DROP TABLE IF EXISTS `event_stats`;
/*!50001 DROP VIEW IF EXISTS `event_stats`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `event_stats` AS SELECT 
 1 AS `id`,
 1 AS `titulo`,
 1 AS `fecha_evento`,
 1 AS `aforo_maximo`,
 1 AS `entradas_reservadas`,
 1 AS `entradas_disponibles`,
 1 AS `total_reservas`,
 1 AS `total_asistencias`,
 1 AS `total_cancelaciones`,
 1 AS `porcentaje_ocupacion`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `event_supplements`
--

DROP TABLE IF EXISTS `event_supplements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_supplements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `nombre` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `precio_socio` decimal(10,2) NOT NULL DEFAULT '0.00',
  `precio_invitado` decimal(10,2) NOT NULL DEFAULT '0.00',
  `activo` tinyint(1) DEFAULT '1',
  `orden` int DEFAULT '0',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `idx_event` (`event_id`),
  KEY `idx_activo` (`activo`),
  KEY `idx_orden` (`event_id`,`orden`),
  CONSTRAINT `event_supplements_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `event_supplements_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `event_ticket_tiers`
--

DROP TABLE IF EXISTS `event_ticket_tiers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_ticket_tiers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `precio` decimal(10,2) NOT NULL DEFAULT '0.00',
  `fecha_hora_inicio` datetime NOT NULL,
  `orden` int NOT NULL DEFAULT '0',
  `activada_manualmente` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_event_id` (`event_id`),
  KEY `idx_fecha_inicio` (`fecha_hora_inicio`),
  CONSTRAINT `event_ticket_tiers_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `events`
--

DROP TABLE IF EXISTS `events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `titulo` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion_corta` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_evento` date NOT NULL,
  `hora_evento` time NOT NULL,
  `hora_fin` time DEFAULT NULL,
  `ubicacion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `venue_id` int DEFAULT NULL,
  `direccion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `aforo_maximo` int NOT NULL DEFAULT '300',
  `entradas_reservadas` int DEFAULT '0',
  `entradas_disponibles` int DEFAULT '300',
  `imagen_cartel_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `precio_socio` decimal(10,2) DEFAULT '0.00',
  `precio_invitado` decimal(10,2) DEFAULT '0.00',
  `permite_invitados` tinyint(1) DEFAULT '0',
  `destacado` tinyint(1) DEFAULT '0',
  `estado` enum('draft','scheduled','active','completed','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `motivo_cancelacion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `visible_desde` datetime DEFAULT NULL,
  `visible_hasta` datetime DEFAULT NULL,
  `tags` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `artistas` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `edad_minima` int DEFAULT '18',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `idx_fecha_evento` (`fecha_evento`),
  KEY `idx_estado` (`estado`),
  KEY `idx_destacado` (`destacado`),
  KEY `idx_visible` (`visible_desde`,`visible_hasta`),
  KEY `idx_event_fecha_estado` (`fecha_evento`,`estado`),
  KEY `idx_venue` (`venue_id`),
  CONSTRAINT `events_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `events_venue_fk` FOREIGN KEY (`venue_id`) REFERENCES `venues` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `gallery_folder_artists`
--

DROP TABLE IF EXISTS `gallery_folder_artists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gallery_folder_artists` (
  `id` int NOT NULL AUTO_INCREMENT,
  `folder_id` int NOT NULL,
  `artist_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_folder_artist` (`folder_id`,`artist_id`),
  KEY `idx_folder_id` (`folder_id`),
  KEY `idx_artist_id` (`artist_id`),
  CONSTRAINT `gallery_folder_artists_ibfk_1` FOREIGN KEY (`folder_id`) REFERENCES `gallery_folders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `gallery_folder_artists_ibfk_2` FOREIGN KEY (`artist_id`) REFERENCES `artists` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `gallery_folders`
--

DROP TABLE IF EXISTS `gallery_folders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gallery_folders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int DEFAULT NULL,
  `nombre` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `fecha_evento` date DEFAULT NULL,
  `imagen_portada_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `visible` tinyint(1) DEFAULT '1',
  `destacado` tinyint(1) DEFAULT '0',
  `orden` int DEFAULT '0',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_event` (`event_id`),
  KEY `idx_visible` (`visible`),
  KEY `idx_orden` (`orden`),
  KEY `idx_slug` (`slug`),
  KEY `idx_destacado` (`destacado`),
  KEY `fk_gallery_folders_created_by` (`created_by`),
  CONSTRAINT `fk_gallery_folders_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `gallery_folders_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `gallery_image_artists`
--

DROP TABLE IF EXISTS `gallery_image_artists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gallery_image_artists` (
  `id` int NOT NULL AUTO_INCREMENT,
  `image_id` int NOT NULL,
  `artist_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_image_artist` (`image_id`,`artist_id`),
  KEY `idx_image_id` (`image_id`),
  KEY `idx_artist_id` (`artist_id`),
  CONSTRAINT `gallery_image_artists_ibfk_1` FOREIGN KEY (`image_id`) REFERENCES `gallery_images` (`id`) ON DELETE CASCADE,
  CONSTRAINT `gallery_image_artists_ibfk_2` FOREIGN KEY (`artist_id`) REFERENCES `artists` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `gallery_images`
--

DROP TABLE IF EXISTS `gallery_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gallery_images` (
  `id` int NOT NULL AUTO_INCREMENT,
  `folder_id` int NOT NULL,
  `imagen_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `thumbnail_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `titulo` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `ancho` int DEFAULT NULL,
  `alto` int DEFAULT NULL,
  `tamano_kb` int DEFAULT NULL,
  `orden` int DEFAULT '0',
  `visible` tinyint(1) DEFAULT '1',
  `destacado` tinyint(1) DEFAULT '0',
  `uploaded_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `uploaded_by` (`uploaded_by`),
  KEY `idx_folder` (`folder_id`),
  KEY `idx_folder_orden` (`folder_id`,`orden`),
  KEY `idx_visible` (`visible`),
  CONSTRAINT `gallery_images_ibfk_1` FOREIGN KEY (`folder_id`) REFERENCES `gallery_folders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `gallery_images_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `guest_lists`
--

DROP TABLE IF EXISTS `guest_lists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `guest_lists` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `event_artist_id` int DEFAULT NULL,
  `tipo_guest` enum('admin','artista') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'admin',
  `nombre_completo` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `acompanantes` int DEFAULT '0',
  `codigo_acceso` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado` enum('pendiente','confirmado','entrada_validada','cancelado') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'confirmado',
  `notas` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `agregado_por` int NOT NULL,
  `fecha_registro` datetime DEFAULT CURRENT_TIMESTAMP,
  `fecha_validacion` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo_acceso` (`codigo_acceso`),
  KEY `agregado_por` (`agregado_por`),
  KEY `idx_event` (`event_id`),
  KEY `idx_event_artist` (`event_artist_id`),
  KEY `idx_tipo` (`tipo_guest`),
  KEY `idx_codigo` (`codigo_acceso`),
  KEY `idx_estado` (`estado`),
  KEY `idx_email` (`email`),
  CONSTRAINT `guest_lists_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `guest_lists_ibfk_2` FOREIGN KEY (`event_artist_id`) REFERENCES `event_artists` (`id`) ON DELETE CASCADE,
  CONSTRAINT `guest_lists_ibfk_3` FOREIGN KEY (`agregado_por`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50003 TRIGGER `before_guest_list_insert` BEFORE INSERT ON `guest_lists` FOR EACH ROW BEGIN
    IF NEW.codigo_acceso IS NULL THEN
        SET NEW.codigo_acceso = CONCAT('LCG-', 
            YEAR(CURDATE()), 
            LPAD(MONTH(CURDATE()), 2, '0'),
            '-',
            UPPER(SUBSTRING(MD5(CONCAT(NEW.event_id, NEW.email, NOW(), RAND())), 1, 8))
        );
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50003 TRIGGER `before_guest_list_artist_insert` BEFORE INSERT ON `guest_lists` FOR EACH ROW BEGIN
    DECLARE v_cupo INT;
    DECLARE v_usados INT;
    
    IF NEW.tipo_guest = 'artista' AND NEW.event_artist_id IS NOT NULL THEN
        SELECT cupo_guest_list, guest_list_usados
        INTO v_cupo, v_usados
        FROM event_artists
        WHERE id = NEW.event_artist_id;
        
        IF v_usados >= v_cupo THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'El artista ha alcanzado su límite de invitados';
        END IF;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50003 TRIGGER `after_guest_list_insert` AFTER INSERT ON `guest_lists` FOR EACH ROW BEGIN
    IF NEW.tipo_guest = 'artista' AND NEW.event_artist_id IS NOT NULL THEN
        UPDATE event_artists
        SET guest_list_usados = guest_list_usados + 1 + NEW.acompanantes
        WHERE id = NEW.event_artist_id;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50003 TRIGGER `after_guest_list_update` AFTER UPDATE ON `guest_lists` FOR EACH ROW BEGIN
    IF OLD.tipo_guest = 'artista' 
       AND OLD.event_artist_id IS NOT NULL 
       AND OLD.estado != 'cancelado' 
       AND NEW.estado = 'cancelado' THEN
        
        UPDATE event_artists
        SET guest_list_usados = GREATEST(0, guest_list_usados - 1 - OLD.acompanantes)
        WHERE id = OLD.event_artist_id;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `tipo` enum('nuevo_evento','reserva_confirmada','evento_proximo','pago_exitoso','pago_fallido','cancelacion','lista_espera','admin','otro') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `titulo` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `mensaje` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_id` int DEFAULT NULL,
  `leida` tinyint(1) DEFAULT '0',
  `fecha_leida` datetime DEFAULT NULL,
  `enviada_email` tinyint(1) DEFAULT '0',
  `url_accion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `event_id` (`event_id`),
  KEY `idx_user_leida` (`user_id`,`leida`),
  KEY `idx_created` (`created_at`),
  KEY `idx_notification_user_leida` (`user_id`,`leida`,`created_at`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `socio_id` int NOT NULL,
  `booking_id` int DEFAULT NULL,
  `tipo_pago` enum('cuota_mensual','entrada_evento','otro') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_id` int DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'EUR',
  `stripe_payment_intent_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stripe_invoice_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_method` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado` enum('pendiente','exitoso','fallido','reembolsado','reembolsado_parcial') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pendiente',
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `metadata` json DEFAULT NULL,
  `fecha_pago` datetime DEFAULT NULL,
  `fecha_reembolso` datetime DEFAULT NULL,
  `intentos_fallidos` int DEFAULT '0',
  `error_mensaje` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `event_id` (`event_id`),
  KEY `idx_socio_tipo` (`socio_id`,`tipo_pago`),
  KEY `idx_estado` (`estado`),
  KEY `idx_fecha_pago` (`fecha_pago`),
  KEY `idx_stripe_intent` (`stripe_payment_intent_id`),
  KEY `idx_payment_socio_tipo` (`socio_id`,`tipo_pago`,`estado`),
  KEY `idx_booking_id` (`booking_id`),
  KEY `idx_booking_socio` (`booking_id`,`socio_id`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`socio_id`) REFERENCES `socios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Temporary view structure for view `proximos_eventos`
--

DROP TABLE IF EXISTS `proximos_eventos`;
/*!50001 DROP VIEW IF EXISTS `proximos_eventos`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `proximos_eventos` AS SELECT 
 1 AS `id`,
 1 AS `titulo`,
 1 AS `descripcion`,
 1 AS `descripcion_corta`,
 1 AS `fecha_evento`,
 1 AS `hora_evento`,
 1 AS `ubicacion`,
 1 AS `direccion`,
 1 AS `aforo_maximo`,
 1 AS `entradas_reservadas`,
 1 AS `entradas_disponibles`,
 1 AS `imagen_cartel_url`,
 1 AS `precio_socio`,
 1 AS `precio_invitado`,
 1 AS `permite_invitados`,
 1 AS `destacado`,
 1 AS `estado`,
 1 AS `motivo_cancelacion`,
 1 AS `visible_desde`,
 1 AS `visible_hasta`,
 1 AS `tags`,
 1 AS `artistas`,
 1 AS `edad_minima`,
 1 AS `created_by`,
 1 AS `created_at`,
 1 AS `updated_at`,
 1 AS `total_reservas_confirmadas`,
 1 AS `personas_lista_espera`,
 1 AS `disponibilidad_estado`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `push_subscriptions`
--

DROP TABLE IF EXISTS `push_subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `push_subscriptions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `endpoint` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `keys_p256dh` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `keys_auth` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_active` (`user_id`,`active`),
  KEY `idx_endpoint` (`endpoint`(255)),
  CONSTRAINT `push_subscriptions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `token` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `refresh_token` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `expires_at` datetime NOT NULL,
  `revocado` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_token` (`token`(255)),
  KEY `idx_user_expires` (`user_id`,`expires_at`),
  KEY `idx_revocado` (`revocado`),
  CONSTRAINT `sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `site_settings`
--

DROP TABLE IF EXISTS `site_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `site_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `clave` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `tipo` enum('string','number','boolean','json') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'string',
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `grupo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `editable_admin` tinyint(1) DEFAULT '1',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `clave` (`clave`),
  KEY `idx_clave` (`clave`),
  KEY `idx_grupo` (`grupo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `social_links`
--

DROP TABLE IF EXISTS `social_links`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `social_links` (
  `id` int NOT NULL AUTO_INCREMENT,
  `plataforma` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `icono` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `orden` int DEFAULT '0',
  `visible` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_visible` (`visible`),
  KEY `idx_orden` (`orden`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `socios`
--

DROP TABLE IF EXISTS `socios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `socios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `numero_socio` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_alta` date NOT NULL,
  `fecha_baja` date DEFAULT NULL,
  `stripe_customer_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stripe_subscription_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_method_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cuota_mensual` decimal(10,2) DEFAULT '0.00',
  `ultimo_pago` date DEFAULT NULL,
  `proximo_pago` date DEFAULT NULL,
  `pagos_fallidos` int DEFAULT '0',
  `dias_morosidad` int DEFAULT '0',
  `estado` enum('activo','inactivo','suspendido','moroso') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'activo',
  `motivo_baja` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `notas_admin` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `numero_socio` (`numero_socio`),
  UNIQUE KEY `stripe_customer_id` (`stripe_customer_id`),
  KEY `idx_numero_socio` (`numero_socio`),
  KEY `idx_estado` (`estado`),
  KEY `idx_stripe_customer` (`stripe_customer_id`),
  KEY `idx_fecha_alta` (`fecha_alta`),
  CONSTRAINT `socios_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50003 TRIGGER `before_socio_delete` BEFORE DELETE ON `socios` FOR EACH ROW BEGIN
    INSERT INTO audit_log (user_id, accion, entidad, entidad_id, descripcion, datos_anteriores)
    VALUES (
        @current_user_id,
        'eliminar_socio',
        'socio',
        OLD.id,
        CONCAT('Socio eliminado: ', OLD.numero_socio),
        JSON_OBJECT(
            'numero_socio', OLD.numero_socio,
            'user_id', OLD.user_id,
            'estado', OLD.estado,
            'fecha_alta', OLD.fecha_alta
        )
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Temporary view structure for view `socios_activos`
--

DROP TABLE IF EXISTS `socios_activos`;
/*!50001 DROP VIEW IF EXISTS `socios_activos`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `socios_activos` AS SELECT 
 1 AS `id`,
 1 AS `numero_socio`,
 1 AS `fecha_alta`,
 1 AS `nombre`,
 1 AS `apellidos`,
 1 AS `email`,
 1 AS `telefono`,
 1 AS `estado`,
 1 AS `ultimo_pago`,
 1 AS `proximo_pago`,
 1 AS `pagos_fallidos`,
 1 AS `total_reservas`,
 1 AS `total_pagos`,
 1 AS `total_pagado`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `solicitudes_socios`
--

DROP TABLE IF EXISTS `solicitudes_socios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `solicitudes_socios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellidos` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefono` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `dni` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `dni_front_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dni_back_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `motivacion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `invitado_por` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `evento_interes` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado` enum('pendiente','aprobada','rechazada') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pendiente',
  `motivo_rechazo` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `ip_solicitud` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `revisado_por` int DEFAULT NULL,
  `fecha_revision` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_estado` (`estado`),
  KEY `idx_email` (`email`),
  KEY `idx_dni` (`dni`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_pendiente` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_cambio_token` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_cambio_expira` datetime DEFAULT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `reset_password_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reset_password_expires` datetime DEFAULT NULL,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellidos` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefono` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `dni` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dni_front_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dni_back_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `firma_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar_url` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `dni_frente_url` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `dni_dorso_url` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `role` enum('basico','socio','admin') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'basico',
  `idioma_preferido` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'es',
  `email_verified` tinyint(1) DEFAULT '0',
  `email_verification_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_reset_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_reset_expires` datetime DEFAULT NULL,
  `ultimo_acceso` datetime DEFAULT NULL,
  `ip_registro` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `idx_users_dni` (`dni`),
  KEY `idx_email` (`email`),
  KEY `idx_username` (`username`),
  KEY `idx_role` (`role`),
  KEY `idx_activo` (`activo`),
  KEY `idx_user_role_activo` (`role`,`activo`),
  KEY `idx_reset_token` (`reset_password_token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `venues`
--

DROP TABLE IF EXISTS `venues`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `venues` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `direccion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ciudad` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `codigo_postal` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pais` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'España',
  `latitud` decimal(10,8) DEFAULT NULL,
  `longitud` decimal(11,8) DEFAULT NULL,
  `capacidad_maxima` int DEFAULT '300',
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `imagen_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo_local` enum('club','sala','bar','exterior','otro') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'club',
  `accesibilidad` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `transporte_publico` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `parking` tinyint(1) DEFAULT '0',
  `activo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ciudad` (`ciudad`),
  KEY `idx_activo` (`activo`),
  KEY `idx_tipo` (`tipo_local`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `waiting_list`
--

DROP TABLE IF EXISTS `waiting_list`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `waiting_list` (
  `id` int NOT NULL AUTO_INCREMENT,
  `socio_id` int NOT NULL,
  `event_id` int NOT NULL,
  `posicion` int NOT NULL,
  `fecha_registro` datetime DEFAULT CURRENT_TIMESTAMP,
  `notificado` tinyint(1) DEFAULT '0',
  `fecha_notificacion` datetime DEFAULT NULL,
  `estado` enum('esperando','notificado','convertido','expirado') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'esperando',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_waiting` (`socio_id`,`event_id`),
  KEY `idx_event_posicion` (`event_id`,`posicion`),
  KEY `idx_estado` (`estado`),
  CONSTRAINT `waiting_list_ibfk_1` FOREIGN KEY (`socio_id`) REFERENCES `socios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `waiting_list_ibfk_2` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Final view structure for view `event_stats`
--

/*!50001 DROP VIEW IF EXISTS `event_stats`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 SQL SECURITY DEFINER */
/*!50001 VIEW `event_stats` AS select `e`.`id` AS `id`,`e`.`titulo` AS `titulo`,`e`.`fecha_evento` AS `fecha_evento`,`e`.`aforo_maximo` AS `aforo_maximo`,`e`.`entradas_reservadas` AS `entradas_reservadas`,`e`.`entradas_disponibles` AS `entradas_disponibles`,count(distinct `b`.`id`) AS `total_reservas`,count(distinct (case when (`b`.`estado` = 'asistida') then `b`.`id` end)) AS `total_asistencias`,count(distinct (case when (`b`.`estado` = 'cancelada') then `b`.`id` end)) AS `total_cancelaciones`,round(((`e`.`entradas_reservadas` / `e`.`aforo_maximo`) * 100),2) AS `porcentaje_ocupacion` from (`events` `e` left join `bookings` `b` on((`e`.`id` = `b`.`event_id`))) group by `e`.`id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `proximos_eventos`
--

/*!50001 DROP VIEW IF EXISTS `proximos_eventos`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 SQL SECURITY DEFINER */
/*!50001 VIEW `proximos_eventos` AS select `e`.`id` AS `id`,`e`.`titulo` AS `titulo`,`e`.`descripcion` AS `descripcion`,`e`.`descripcion_corta` AS `descripcion_corta`,`e`.`fecha_evento` AS `fecha_evento`,`e`.`hora_evento` AS `hora_evento`,`e`.`ubicacion` AS `ubicacion`,`e`.`direccion` AS `direccion`,`e`.`aforo_maximo` AS `aforo_maximo`,`e`.`entradas_reservadas` AS `entradas_reservadas`,`e`.`entradas_disponibles` AS `entradas_disponibles`,`e`.`imagen_cartel_url` AS `imagen_cartel_url`,`e`.`precio_socio` AS `precio_socio`,`e`.`precio_invitado` AS `precio_invitado`,`e`.`permite_invitados` AS `permite_invitados`,`e`.`destacado` AS `destacado`,`e`.`estado` AS `estado`,`e`.`motivo_cancelacion` AS `motivo_cancelacion`,`e`.`visible_desde` AS `visible_desde`,`e`.`visible_hasta` AS `visible_hasta`,`e`.`tags` AS `tags`,`e`.`artistas` AS `artistas`,`e`.`edad_minima` AS `edad_minima`,`e`.`created_by` AS `created_by`,`e`.`created_at` AS `created_at`,`e`.`updated_at` AS `updated_at`,count(distinct `b`.`id`) AS `total_reservas_confirmadas`,count(distinct `w`.`id`) AS `personas_lista_espera`,(case when (`e`.`entradas_disponibles` = 0) then 'completo' when (`e`.`entradas_disponibles` < 50) then 'casi_completo' else 'disponible' end) AS `disponibilidad_estado` from ((`events` `e` left join `bookings` `b` on(((`e`.`id` = `b`.`event_id`) and (`b`.`estado` = 'confirmada')))) left join `waiting_list` `w` on(((`e`.`id` = `w`.`event_id`) and (`w`.`estado` = 'esperando')))) where ((`e`.`fecha_evento` >= curdate()) and (`e`.`estado` = 'publicado')) group by `e`.`id` order by `e`.`fecha_evento` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `socios_activos`
--

/*!50001 DROP VIEW IF EXISTS `socios_activos`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 SQL SECURITY DEFINER */
/*!50001 VIEW `socios_activos` AS select `s`.`id` AS `id`,`s`.`numero_socio` AS `numero_socio`,`s`.`fecha_alta` AS `fecha_alta`,`u`.`nombre` AS `nombre`,`u`.`apellidos` AS `apellidos`,`u`.`email` AS `email`,`u`.`telefono` AS `telefono`,`s`.`estado` AS `estado`,`s`.`ultimo_pago` AS `ultimo_pago`,`s`.`proximo_pago` AS `proximo_pago`,`s`.`pagos_fallidos` AS `pagos_fallidos`,count(distinct `b`.`id`) AS `total_reservas`,count(distinct `p`.`id`) AS `total_pagos`,sum(`p`.`amount`) AS `total_pagado` from (((`socios` `s` join `users` `u` on((`s`.`user_id` = `u`.`id`))) left join `bookings` `b` on((`s`.`id` = `b`.`socio_id`))) left join `payments` `p` on(((`s`.`id` = `p`.`socio_id`) and (`p`.`estado` = 'exitoso')))) where (`s`.`estado` = 'activo') group by `s`.`id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- site_settings

INSERT INTO site_settings (clave, valor, tipo, descripcion, grupo) VALUES
('guest_list_enabled', 'true', 'boolean', 'Permitir listas de invitados', 'events'),
('guest_list_default_cupo_artista', '2', 'number', 'Cupo por defecto para artistas', 'events'),
('supplements_enabled', 'true', 'boolean', 'Permitir suplementos en eventos', 'events')
ON DUPLICATE KEY UPDATE valor=valor;
