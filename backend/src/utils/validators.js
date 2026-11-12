// Email
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// DNI con letra de control
export const isValidDNI = (dni) => {
    const dniRegex = /^[0-9]{8}[A-Z]$/;
    if (!dniRegex.test(dni)) return false;

    const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
    const number = parseInt(dni.substr(0, 8), 10);
    const letter = dni.substr(8, 1);

    return letters.charAt(number % 23) === letter;
};

// NIE con letra de control
export const isValidNIE = (nie) => {
    const nieRegex = /^[XYZ][0-9]{7}[A-Z]$/;
    if (!nieRegex.test(nie)) return false;

    const niePrefix = { X: 0, Y: 1, Z: 2 };
    const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';

    const nieNumber = niePrefix[nie.charAt(0)] + nie.substr(1, 7);
    const letter = nie.substr(8, 1);

    return letters.charAt(parseInt(nieNumber) % 23) === letter;
};

// DNI o NIE
export const isValidSpanishDocument = (document) => {
    return isValidDNI(document) || isValidNIE(document);
};

// Teléfono español
export const isValidPhone = (phone) => {
  // Con o sin prefijo 34 / +34
    const phoneRegex = /^(\+34|0034|34)?[6-9][0-9]{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Mayor de 18
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

// Contraseña: 8 caracteres mínimo, con mayúscula, minúscula y número
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

// Fecha YYYY-MM-DD
export const isValidDate = (date) => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;

    const dateObj = new Date(date);
    return dateObj instanceof Date && !isNaN(dateObj);
};

// Limpia texto de entrada
export const sanitizeString = (str) => {
    if (typeof str !== 'string') return '';
    return str.trim().replace(/[<>]/g, '');
};

// numero_socio LC-YYYY-NNNN
export const isValidNumeroSocio = (numeroSocio) => {
    const regex = /^LC-\d{4}-\d{4}$/;
    return regex.test(numeroSocio);
};

// codigo_reserva LCV-YYYYMM-XXXXXXXX
export const isValidCodigoReserva = (codigo) => {
    const regex = /^LCV-\d{6}-[A-Z0-9]{8}$/;
    return regex.test(codigo);
};

// ¿Es una imagen?
export const isValidImageType = (mimetype) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    return validTypes.includes(mimetype);
};

// ¿Es un PDF?
export const isValidPDFType = (mimetype) => {
    return mimetype === 'application/pdf';
};

// Tamaño máximo en bytes
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
    sanitizeString,
    isValidNumeroSocio,
    isValidCodigoReserva,
    isValidImageType,
    isValidPDFType,
    isValidFileSize
};