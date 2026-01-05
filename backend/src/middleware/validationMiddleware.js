import { validationResult } from 'express-validator';

/**
 * Middleware para manejar errores de validación de express-validator
 * 
 * USO:
 * router.post('/ruta', 
 *   [...validators], 
 *   handleValidationErrors, 
 *   controller
 * );
 * 
 * FUNCIONALIDAD:
 * 1. Captura errores de validación
 * 2. Los formatea en un array legible
 * 3. Retorna 400 Bad Request con la lista de errores
 * 4. Si no hay errores, pasa al siguiente middleware (controller)
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // Formatear errores para respuesta clara
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: formattedErrors
    });
  }
  
  // Si no hay errores, continuar al controller
  next();
};