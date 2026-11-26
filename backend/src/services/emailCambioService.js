import { noreplyTransporter, fromNoreply } from '../config/mailer.js';
import logger from '../config/logger.js';

const escapar = (texto = '') =>
  String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

// Misma estructura que el resto de correos; el diseño se unifica más adelante
const plantilla = (titulo, cuerpo) => `
  <!DOCTYPE html>
  <html>
  <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #0a0a0a;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a;">
      <tr>
        <td align="center" style="padding: 40px 20px;">
          <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 12px; overflow: hidden;">
            <tr>
              <td style="background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); padding: 40px 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">${titulo}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 40px 30px; color: #e5e5e5; font-size: 15px; line-height: 1.6;">${cuerpo}</td>
            </tr>
            <tr>
              <td style="background-color: #0a0a0a; padding: 30px; text-align: center; border-top: 1px solid #2a2a2a;">
                <p style="margin: 0; color: #666; font-size: 12px;">© ${new Date().getFullYear()} La Clave Asociación. Todos los derechos reservados.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
`;

// Al nuevo email: enlace para confirmar el cambio
export const enviarConfirmacionNuevoEmail = async (user, nuevoEmail, token) => {
  const url = `${process.env.FRONTEND_URL}/confirmar-email?token=${token}`;

  // En local los correos pueden ir simulados: así el enlace se puede probar
  if (process.env.NODE_ENV !== 'production') {
    logger.info('Enlace para confirmar el nuevo email (solo en desarrollo):', { url });
  }

  await noreplyTransporter.sendMail({
    from: fromNoreply(),
    to: nuevoEmail,
    subject: 'Confirma tu nuevo email - La Clave',
    html: plantilla(
      'Confirma tu nuevo email',
      `<p style="margin: 0 0 20px 0;">Hola <strong>${escapar(user.nombre)}</strong>, has pedido usar este correo para tu cuenta de La Clave.</p>
       <p style="margin: 0 0 30px 0;">Pulsa el botón para confirmarlo. El enlace caduca en 24 horas. Hasta entonces seguirás entrando con tu email actual.</p>
       <p style="text-align: center; margin: 0 0 30px 0;">
         <a href="${url}" style="display: inline-block; background: #f59e0b; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold;">Confirmar email</a>
       </p>
       <p style="margin: 0; color: #999; font-size: 13px;">Si no has sido tú, ignora este correo: no se cambiará nada.</p>`,
    ),
  });
};

// Al email actual: aviso de que alguien ha pedido cambiarlo
export const enviarAvisoCambioEmail = async (user, nuevoEmail) => {
  await noreplyTransporter.sendMail({
    from: fromNoreply(),
    to: user.email,
    subject: 'Se ha pedido cambiar el email de tu cuenta - La Clave',
    html: plantilla(
      'Cambio de email solicitado',
      `<p style="margin: 0 0 20px 0;">Hola <strong>${escapar(user.nombre)}</strong>, se ha pedido cambiar el email de tu cuenta de La Clave a <strong>${escapar(nuevoEmail)}</strong>.</p>
       <p style="margin: 0 0 20px 0;">El cambio solo se aplica si se confirma desde ese nuevo correo.</p>
       <p style="margin: 0; color: #fbbf24;">Si no has sido tú, cambia tu contraseña cuanto antes y contacta con la asociación.</p>`,
    ),
  });
};

export default { enviarConfirmacionNuevoEmail, enviarAvisoCambioEmail };
