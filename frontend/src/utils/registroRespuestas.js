// Preguntas del registro (siempre en castellano) y respuestas para el admin

export const PREGUNTA_PROYECTO =
  "¿Tienes un proyecto artístico o cultural? ¿Formas parte de algún colectivo?";
export const PREGUNTA_INVITADO = "¿Qué socio te ha invitado?";
export const PREGUNTA_EVENTO = "¿A qué evento deseas venir?";

// El backend guarda el texto escapado (&#x27;) por los emails; aquí se deshace
export const decodeEntities = (text) => {
  if (!text) return "";
  const el = document.createElement("textarea");
  el.innerHTML = text;
  return el.value;
};

// De "<pregunta> Sí. <detalle>" o "<pregunta> No" deja solo la respuesta
export const respuestaProyecto = (motivacion) => {
  const texto = decodeEntities(motivacion).trim();
  if (!texto) return "";
  return texto.startsWith(PREGUNTA_PROYECTO)
    ? texto.slice(PREGUNTA_PROYECTO.length).trim()
    : texto;
};

// [pregunta, respuesta] de las tres; en solicitudes antiguas puede faltar alguna
export const respuestasRegistro = (solicitud) => [
  [PREGUNTA_PROYECTO, respuestaProyecto(solicitud?.motivacion)],
  [PREGUNTA_INVITADO, decodeEntities(solicitud?.invitado_por)],
  [PREGUNTA_EVENTO, decodeEntities(solicitud?.evento_interes)],
];
