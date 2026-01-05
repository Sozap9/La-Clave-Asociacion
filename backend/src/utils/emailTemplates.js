/**
 * ================================================================
 * TEMPLATES DE EMAILS - La Clave
 * ================================================================
 * Todos los templates HTML para emails del sistema
 */

/**
 * Template base con estilos consistentes
 */
const baseTemplate = (content) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>La Clave</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white !important;
      text-decoration: none;
      border-radius: 5px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px 30px;
      text-align: center;
      font-size: 12px;
      color: #666;
      border-top: 1px solid #e9ecef;
    }
    .info-box {
      background: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .qr-container {
      text-align: center;
      margin: 30px 0;
    }
    .qr-code {
      max-width: 200px;
      height: auto;
      border: 2px solid #667eea;
      border-radius: 8px;
      padding: 10px;
      background: white;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎵 La Clave</h1>
    </div>
    ${content}
    <div class="footer">
      <p>© ${new Date().getFullYear()} La Clave. Todos los derechos reservados.</p>
      <p>${process.env.SITE_ADDRESS || 'Calle Ejemplo 123, Madrid'}</p>
      <p>
        <a href="${process.env.FRONTEND_URL}" style="color: #667eea; text-decoration: none;">Visitar web</a> | 
        <a href="${process.env.FRONTEND_URL}/contact" style="color: #667eea; text-decoration: none;">Contacto</a>
      </p>
    </div>
  </div>
</body>
</html>
`;

/**
 * Email de bienvenida - Usuario básico
 */
export const welcomeBasicTemplate = ({ nombre, apellidos }) => {
  const content = `
    <div class="content">
      <h2>¡Bienvenido/a a La Clave, ${nombre}! 🎉</h2>
      
      <p>Estamos encantados de tenerte con nosotros. Tu cuenta ha sido creada exitosamente.</p>
      
      <div class="info-box">
        <h3>¿Qué puedes hacer ahora?</h3>
        <ul>
          <li>✅ Ver todos nuestros eventos publicados</li>
          <li>🎵 Conocer a nuestros artistas</li>
          <li>📸 Explorar la galería de fotos</li>
          <li>⭐ Hacerte socio para acceder a reservas exclusivas</li>
        </ul>
      </div>
      
      <p><strong>¿Por qué hacerse socio?</strong></p>
      <ul>
        <li>🎫 Reserva entradas antes que nadie</li>
        <li>💰 Precios especiales en todos los eventos</li>
        <li>🎁 Beneficios exclusivos</li>
        <li>📅 Newsletter mensual con la programación</li>
      </ul>
      
      <center>
        <a href="${process.env.FRONTEND_URL}/hazte-socio" class="button">Quiero ser socio</a>
      </center>
      
      <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
      
      <p>¡Nos vemos pronto! 🎶</p>
    </div>
  `;
  
  return baseTemplate(content);
};

/**
 * Email de confirmación - Nuevo socio
 */
export const welcomeSocioTemplate = ({ nombre, apellidos, numero_socio, cuota_mensual, proximo_pago }) => {
  const content = `
    <div class="content">
      <h2>¡Bienvenido a la familia, ${nombre}! 🎊</h2>
      
      <p>¡Enhorabuena! Ya eres socio oficial de La Clave.</p>
      
      <div class="info-box">
        <h3>📋 Detalles de tu membresía:</h3>
        <p><strong>Número de socio:</strong> #${numero_socio}</p>
        <p><strong>Cuota mensual:</strong> ${cuota_mensual}€</p>
        <p><strong>Próximo pago:</strong> ${new Date(proximo_pago).toLocaleDateString('es-ES')}</p>
      </div>
      
      <p><strong>🎁 Tus beneficios como socio:</strong></p>
      <ul>
        <li>🎫 Acceso prioritario a reservas</li>
        <li>💰 Precios exclusivos en todas las entradas</li>
        <li>📧 Newsletter mensual con la programación</li>
        <li>🎉 Invitaciones a eventos especiales</li>
        <li>📸 Acceso a contenido exclusivo</li>
      </ul>
      
      <center>
        <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Ver mi dashboard</a>
      </center>
      
      <p>¡Gracias por formar parte de La Clave! 🎶</p>
    </div>
  `;
  
  return baseTemplate(content);
};

/**
 * Email de reset de contraseña
 */
export const passwordResetTemplate = ({ nombre, resetUrl, expiresIn }) => {
  const content = `
    <div class="content">
      <h2>Recupera tu contraseña 🔒</h2>
      
      <p>Hola ${nombre},</p>
      
      <p>Hemos recibido una solicitud para restablecer tu contraseña de La Clave.</p>
      
      <div class="info-box">
        <p><strong>⚠️ Este link expirará en ${expiresIn} minutos.</strong></p>
      </div>
      
      <p>Haz clic en el botón para crear una nueva contraseña:</p>
      
      <center>
        <a href="${resetUrl}" class="button">Restablecer contraseña</a>
      </center>
      
      <p>Si no solicitaste este cambio, puedes ignorar este email. Tu contraseña actual seguirá siendo válida.</p>
      
      <p><strong>Por seguridad, NUNCA compartas este link con nadie.</strong></p>
      
      <p style="font-size: 12px; color: #666; margin-top: 30px;">
        Si el botón no funciona, copia y pega este link en tu navegador:<br>
        <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
      </p>
    </div>
  `;
  
  return baseTemplate(content);
};

/**
 * Email de confirmación de reserva con QR
 */
export const bookingConfirmationTemplate = ({ 
  nombre, 
  apellidos,
  eventoTitulo, 
  fechaEvento, 
  horaEvento,
  ubicacion,
  numeroEntradas,
  codigoReserva,
  qrCodeCid // Content-ID del QR adjunto
}) => {
  const content = `
    <div class="content">
      <h2>¡Reserva confirmada! 🎫</h2>
      
      <p>Hola ${nombre},</p>
      
      <p>Tu reserva ha sido confirmada exitosamente. ¡Nos vemos pronto!</p>
      
      <div class="info-box">
        <h3>📅 Detalles del evento:</h3>
        <p><strong>${eventoTitulo}</strong></p>
        <p>📍 ${ubicacion}</p>
        <p>📆 ${new Date(fechaEvento).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <p>🕐 ${horaEvento}</p>
        <p>🎫 ${numeroEntradas} entrada${numeroEntradas > 1 ? 's' : ''}</p>
      </div>
      
      <h3>Tu código QR:</h3>
      <p style="text-align: center;">
        <strong>Código de reserva:</strong> ${codigoReserva}
      </p>
      
      <div class="qr-container">
        <img src="cid:${qrCodeCid}" alt="QR Code" class="qr-code" />
      </div>
      
      <div class="info-box" style="background: #fff3cd; border-left-color: #ffc107;">
        <p><strong>⚠️ Importante:</strong></p>
        <ul style="margin: 10px 0;">
          <li>Presenta este QR en la entrada del evento</li>
          <li>Puedes mostrarlo desde tu móvil o impreso</li>
          <li>Llega 15 minutos antes para evitar colas</li>
        </ul>
      </div>
      
      <center>
        <a href="${process.env.FRONTEND_URL}/mis-reservas" class="button">Ver mi reserva</a>
      </center>
      
      <p>¡Disfruta del evento! 🎶</p>
    </div>
  `;
  
  return baseTemplate(content);
};

/**
 * Email de verificación de cuenta
 */
export const verifyEmailTemplate = ({ nombre, verificationUrl }) => {
  const content = `
    <div class="content">
      <h2>Verifica tu email ✅</h2>
      
      <p>Hola ${nombre},</p>
      
      <p>Para completar tu registro en La Clave, necesitamos verificar tu dirección de email.</p>
      
      <p>Haz clic en el botón para verificar tu cuenta:</p>
      
      <center>
        <a href="${verificationUrl}" class="button">Verificar mi email</a>
      </center>
      
      <div class="info-box">
        <p><strong>¿Por qué verificar?</strong></p>
        <ul style="margin: 10px 0;">
          <li>✅ Confirma que eres tú</li>
          <li>🔒 Mejora la seguridad de tu cuenta</li>
          <li>📧 Te permite recibir todas las notificaciones</li>
        </ul>
      </div>
      
      <p style="font-size: 12px; color: #666; margin-top: 30px;">
        Si el botón no funciona, copia y pega este link en tu navegador:<br>
        <a href="${verificationUrl}" style="color: #667eea; word-break: break-all;">${verificationUrl}</a>
      </p>
    </div>
  `;
  
  return baseTemplate(content);
};

export default {
  welcomeBasicTemplate,
  welcomeSocioTemplate,
  passwordResetTemplate,
  bookingConfirmationTemplate,
  verifyEmailTemplate,
};