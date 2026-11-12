import { validationResult } from 'express-validator';

// Devuelve 400 con los errores de express-validator; va justo antes del controlador
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
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
  
  next();
};