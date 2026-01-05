/**
 * Valida formato de email
 * @param {String} email - Email a validar
 * @returns {Boolean}
 */
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Valida DNI español
 * @param {String} dni - DNI a validar (formato: 12345678A)
 * @returns {Boolean}
 */
export const isValidDNI = (dni) => {
    const dniRegex = /^[0-9]{8}[A-Z]$/;
    if (!dniRegex.test(dni)) return false;

    const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
    const number = parseInt(dni.substr(0, 8), 10);
    const letter = dni.substr(8, 1);

    return letters.charAt(number % 23) === letter;
};

/**
 * Valida NIE español
 * @param {String} nie - NIE a validar (formato: X1234567A)
 * @returns {Boolean}
 */
export const isValidNIE = (nie) => {
    const nieRegex = /^[XYZ][0-9]{7}[A-Z]$/;
    if (!nieRegex.test(nie)) return false;

    const niePrefix = { X: 0, Y: 1, Z: 2 };
    const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';

    const nieNumber = niePrefix[nie.charAt(0)] + nie.substr(1, 7);
    const letter = nie.substr(8, 1);

    return letters.charAt(parseInt(nieNumber) % 23) === letter;
};

/**
 * Valida DNI o NIE
 * @param {String} document - Documento a validar
 * @returns {Boolean}
 */
export const isValidSpanishDocument = (document) => {
    return isValidDNI(document) || isValidNIE(document);
};

/**
 * Valida teléfono español
 * @param {String} phone - Teléfono a validar
 * @returns {Boolean}
 */
export const isValidPhone = (phone) => {
  // Acepta: +34123456789, 34123456789, 123456789, 612345678
    const phoneRegex = /^(\+34|0034|34)?[6-9][0-9]{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Valida edad mínima (debe ser mayor de 18)
 * @param {String|Date} birthdate - Fecha de nacimiento
 * @returns {Boolean}
 */
export const isOldEnough = (birthdate, minAge = 18) => {
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    return age >= minAge;
};

/**
 * Valida contraseña segura
 * Mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número
 * @param {String} password - Contraseña a validar
 * @returns {Boolean}
 */
export const isStrongPassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);

    return (
        password.length >= minLength &&
        hasUpperCase &&
        hasLowerCase &&
        hasNumbers
    );
};

/**
 * Valida formato de fecha (YYYY-MM-DD)
 * @param {String} date - Fecha a validar
 * @returns {Boolean}
 */
export const isValidDate = (date) => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;

    const dateObj = new Date(date);
    return dateObj instanceof Date && !isNaN(dateObj);
};

/**
 * Valida username (alfanumérico, guiones y guiones bajos, 3-30 caracteres)
 * @param {String} username - Username a validar
 * @returns {Boolean}
 */
export const isValidUsername = (username) => {
    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
    return usernameRegex.test(username);
};

/**
 * Sanitiza string para evitar inyecciones
 * @param {String} str - String a sanitizar
 * @returns {String}
 */
export const sanitizeString = (str) => {
    if (typeof str !== 'string') return '';
    return str.trim().replace(/[<>]/g, '');
};

/**
 * Valida número de socio (formato: LC-YYYY-NNNN)
 * @param {String} numeroSocio - Número de socio a validar
 * @returns {Boolean}
 */
export const isValidNumeroSocio = (numeroSocio) => {
    const regex = /^LC-\d{4}-\d{4}$/;
    return regex.test(numeroSocio);
};

/**
 * Valida código de reserva (formato: LCV-YYYYMM-XXXXXXXX)
 * @param {String} codigo - Código de reserva a validar
 * @returns {Boolean}
 */
export const isValidCodigoReserva = (codigo) => {
    const regex = /^LCV-\d{6}-[A-Z0-9]{8}$/;
    return regex.test(codigo);
};

/**
 * Valida que un archivo sea una imagen
 * @param {String} mimetype - Tipo MIME del archivo
 * @returns {Boolean}
 */
export const isValidImageType = (mimetype) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    return validTypes.includes(mimetype);
};

/**
 * Valida que un archivo sea un PDF
 * @param {String} mimetype - Tipo MIME del archivo
 * @returns {Boolean}
 */
export const isValidPDFType = (mimetype) => {
    return mimetype === 'application/pdf';
};

/**
 * Valida tamaño máximo de archivo (en bytes)
 * @param {Number} size - Tamaño del archivo en bytes
 * @param {Number} maxSize - Tamaño máximo permitido en bytes (default 5MB)
 * @returns {Boolean}
 */
export const isValidFileSize = (size, maxSize = 5242880) => {
    return size <= maxSize;
};

export default {
    isValidEmail,
    isValidDNI,
    isValidNIE,
    isValidSpanishDocument,
    isValidPhone,
    isOldEnough,
    isStrongPassword,
    isValidDate,
    isValidUsername,
    sanitizeString,
    isValidNumeroSocio,
    isValidCodigoReserva,
    isValidImageType,
    isValidPDFType,
    isValidFileSize
};