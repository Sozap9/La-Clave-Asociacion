import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * ================================================================
 * SERVICIO DE EXPORTACIÓN - CSV Y PDF
 * ================================================================
 * 
 * Este servicio permite exportar datos de la aplicación a:
 * - CSV: Para abrir en Excel y analizar datos
 * - PDF: Para reportes profesionales
 * 
 * Los archivos se guardan en backend/exports/ y se limpian
 * automáticamente después de 7 días.
 */
class ExportService {
  
  /**
   * Exportar datos a CSV (formato Excel)
   * @param {Array} data - Array de objetos a exportar
   * @param {Array} fields - Campos a incluir en el CSV
   * @param {String} filename - Nombre del archivo
   * @returns {String} Path del archivo generado
   */
  static async exportToCSV(data, fields, filename = 'export.csv') {
    try {
      // Crear el CSV con los campos especificados
      const parser = new Parser({ fields });
      const csv = parser.parse(data);
      
      // Crear directorio de exportaciones si no existe
      const exportsDir = path.join(__dirname, '../../exports');
      if (!fs.existsSync(exportsDir)) {
        fs.mkdirSync(exportsDir, { recursive: true });
      }
      
      // Guardar archivo
      const filepath = path.join(exportsDir, filename);
      fs.writeFileSync(filepath, csv, 'utf-8');
      
      logger.info('📄 CSV generado:', { filename, rows: data.length });
      
      return filepath;
      
    } catch (error) {
      logger.error('❌ Error generando CSV:', error);
      throw error;
    }
  }
  
  /**
   * Exportar socios a CSV
   * Incluye: número socio, nombre, email, estado, fechas, cuota
   */
  static async exportSociosCSV(socios) {
    const fields = [
      { label: 'Número Socio', value: 'numero_socio' },
      { label: 'Nombre', value: 'nombre' },
      { label: 'Apellidos', value: 'apellidos' },
      { label: 'Email', value: 'email' },
      { label: 'Estado', value: 'estado' },
      { label: 'Fecha Alta', value: 'fecha_alta' },
      { label: 'Cuota Mensual', value: 'cuota_mensual' },
      { label: 'Próximo Pago', value: 'proximo_pago' },
      { label: 'Días Morosidad', value: 'dias_morosidad' }
    ];
    
    const filename = `socios_${Date.now()}.csv`;
    return await this.exportToCSV(socios, fields, filename);
  }
  
  /**
   * Exportar reservas a CSV
   * Incluye: código, evento, fecha, socio, entradas, estado
   */
  static async exportBookingsCSV(bookings) {
    const fields = [
      { label: 'Código Reserva', value: 'codigo_reserva' },
      { label: 'Evento', value: 'evento_titulo' },
      { label: 'Fecha Evento', value: 'fecha_evento' },
      { label: 'Socio', value: 'socio_nombre' },
      { label: 'Email', value: 'socio_email' },
      { label: 'Número Entradas', value: 'numero_entradas' },
      { label: 'Estado', value: 'estado' },
      { label: 'Fecha Reserva', value: 'fecha_reserva' },
      { label: 'Asistió', value: 'asistio' }
    ];
    
    const filename = `reservas_${Date.now()}.csv`;
    return await this.exportToCSV(bookings, fields, filename);
  }
  
  /**
   * Exportar usuarios a CSV
   * Incluye: ID, username, email, nombre, rol, estado
   */
  static async exportUsersCSV(users) {
    const fields = [
      { label: 'ID', value: 'id' },
      { label: 'Username', value: 'username' },
      { label: 'Email', value: 'email' },
      { label: 'Nombre', value: 'nombre' },
      { label: 'Apellidos', value: 'apellidos' },
      { label: 'Rol', value: 'role' },
      { label: 'Activo', value: 'activo' },
      { label: 'Email Verificado', value: 'email_verified' },
      { label: 'Fecha Registro', value: 'created_at' }
    ];
    
    const filename = `usuarios_${Date.now()}.csv`;
    return await this.exportToCSV(users, fields, filename);
  }
  
  /**
   * Exportar eventos a CSV
   * Incluye: título, fecha, ubicación, aforo, precios, estado
   */
  static async exportEventsCSV(events) {
    const fields = [
      { label: 'ID', value: 'id' },
      { label: 'Título', value: 'titulo' },
      { label: 'Fecha', value: 'fecha_evento' },
      { label: 'Hora', value: 'hora_evento' },
      { label: 'Ubicación', value: 'ubicacion' },
      { label: 'Estado', value: 'estado' },
      { label: 'Aforo Máximo', value: 'aforo_maximo' },
      { label: 'Reservadas', value: 'entradas_reservadas' },
      { label: 'Disponibles', value: 'entradas_disponibles' },
      { label: 'Precio Socio', value: 'precio_socio' },
      { label: 'Precio Invitado', value: 'precio_invitado' }
    ];
    
    const filename = `eventos_${Date.now()}.csv`;
    return await this.exportToCSV(events, fields, filename);
  }
  
  /**
   * Exportar datos a PDF
   * Permite crear reportes con diseño profesional
   * @param {Object} data - Datos a exportar
   * @param {String} title - Título del documento
   * @param {String} filename - Nombre del archivo
   * @returns {String} Path del archivo generado
   */
  static async exportToPDF(data, title, filename = 'export.pdf') {
    try {
      const exportsDir = path.join(__dirname, '../../exports');
      if (!fs.existsSync(exportsDir)) {
        fs.mkdirSync(exportsDir, { recursive: true });
      }
      
      const filepath = path.join(exportsDir, filename);
      
      return new Promise((resolve, reject) => {
        // Crear documento PDF
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(filepath);
        
        doc.pipe(stream);
        
        // ========== HEADER ==========
        doc
          .fontSize(20)
          .fillColor('#8B5CF6')
          .text('La Clave Asociación', { align: 'center' })
          .moveDown(0.5);
        
        doc
          .fontSize(16)
          .fillColor('#000000')
          .text(title, { align: 'center' })
          .moveDown();
        
        // Fecha de generación
        doc
          .fontSize(10)
          .fillColor('#666666')
          .text(`Generado el: ${new Date().toLocaleString('es-ES')}`, { align: 'right' })
          .moveDown(2);
        
        // ========== CONTENIDO ==========
        if (data.sections) {
          // Formato de secciones (para reportes estructurados)
          data.sections.forEach(section => {
            doc
              .fontSize(14)
              .fillColor('#8B5CF6')
              .text(section.title)
              .moveDown(0.5);
            
            doc
              .fontSize(11)
              .fillColor('#000000');
            
            section.content.forEach(item => {
              doc.text(`• ${item}`);
            });
            
            doc.moveDown();
          });
        } else if (Array.isArray(data)) {
          // Formato de tabla simple
          data.forEach((row, index) => {
            if (index > 0) doc.moveDown(0.5);
            
            Object.entries(row).forEach(([key, value]) => {
              doc
                .fontSize(10)
                .fillColor('#8B5CF6')
                .text(`${key}: `, { continued: true })
                .fillColor('#000000')
                .text(String(value));
            });
          });
        }
        
        // ========== FOOTER (numeración de páginas) ==========
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
          doc.switchToPage(i);
          
          doc
            .fontSize(8)
            .fillColor('#999999')
            .text(
              `Página ${i + 1} de ${pageCount}`,
              50,
              doc.page.height - 50,
              { align: 'center' }
            );
        }
        
        doc.end();
        
        stream.on('finish', () => {
          logger.info('📄 PDF generado:', { filename });
          resolve(filepath);
        });
        
        stream.on('error', reject);
      });
      
    } catch (error) {
      logger.error('❌ Error generando PDF:', error);
      throw error;
    }
  }
  
  /**
   * Exportar reporte de socios a PDF
   * Crea un reporte con estadísticas generales de socios
   */
  static async exportSociosReportPDF(stats) {
    const data = {
      sections: [
        {
          title: '📊 Estadísticas Generales',
          content: [
            `Total de socios: ${stats.total}`,
            `Socios activos: ${stats.activos}`,
            `Socios morosos: ${stats.morosos}`,
            `Socios de baja: ${stats.bajas}`,
            `Tasa de retención: ${stats.retencion}%`
          ]
        },
        {
          title: '💰 Información Financiera',
          content: [
            `Ingresos mensuales estimados: ${stats.ingresosMensuales}€`,
            `Cuota promedio: ${stats.cuotaPromedio}€`,
            `Morosidad total: ${stats.morosidadTotal}€`
          ]
        }
      ]
    };
    
    const filename = `reporte_socios_${Date.now()}.pdf`;
    return await this.exportToPDF(data, 'Reporte de Socios', filename);
  }
  
  /**
   * Limpiar archivos de exportación antiguos (> 7 días)
   * Se ejecuta automáticamente o manualmente
   */
  static cleanOldExports() {
    try {
      const exportsDir = path.join(__dirname, '../../exports');
      
      if (!fs.existsSync(exportsDir)) return;
      
      const files = fs.readdirSync(exportsDir);
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 días en milisegundos
      
      let deletedCount = 0;
      
      files.forEach(file => {
        const filepath = path.join(exportsDir, file);
        const stats = fs.statSync(filepath);
        const age = now - stats.mtimeMs;
        
        // Si el archivo tiene más de 7 días, eliminarlo
        if (age > maxAge) {
          fs.unlinkSync(filepath);
          deletedCount++;
        }
      });
      
      if (deletedCount > 0) {
        logger.info(`🧹 Archivos de exportación eliminados: ${deletedCount}`);
      }
      
    } catch (error) {
      logger.error('❌ Error limpiando exportaciones:', error);
    }
  }
}

export default ExportService;