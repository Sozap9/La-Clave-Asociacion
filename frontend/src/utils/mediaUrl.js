const BACKEND_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "";

// Rutas de uploads/ guardadas en la base -> URL completa del backend.
// Las que ya son URL completa, base64 (avatares antiguos) o blob se dejan igual.
export const mediaUrl = (ruta) => {
  if (!ruta) return null;
  if (/^(data:|https?:|blob:)/.test(ruta)) return ruta;
  return `${BACKEND_URL}/${ruta}`;
};