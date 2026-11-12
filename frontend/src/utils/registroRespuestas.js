/**
 * Preguntas del formulario de registro y utilidades para mostrar las
 * respuestas en el panel de admin (Solicitudes y ficha del socio).
 *
 * Las preguntas se guardan siempre en español, sea cual sea el idioma en
 * que se rellenó el formulario, para que el admin las lea igual.
 */

export const PREGUNTA_PROYECTO =
  "¿Tienes un proyecto artístico o cultural? ¿Formas parte de algún colectivo?";
export const PREGUNTA_INVITADO = "¿Qué socio te ha invitado?";
export const PREGUNTA_EVENTO = "¿A qué evento deseas venir?";

/**
 * El backend guarda los textos escapados (&#x27; en vez de ', etc.) para
 * que sean seguros dentro de los emails. Aquí se devuelven a texto normal.
 */
export const decodeEntities = (text) => {
  if (!text) return "";
  const el = document.createElement("textarea");
  el.innerHTML = text;
  return el.value;
};

/**
 * La respuesta a la pregunta del proyecto se guarda como
 * "<pregunta> Sí. <detalle>" o "<pregunta> No". Devuelve solo la respuesta.
 */
export const respuestaProyecto = (motivacion) => {
  const texto = decodeEntities(motivacion).trim();
  if (!texto) return "";
  return texto.startsWith(PREGUNTA_PROYECTO)
    ? texto.slice(PREGUNTA_PROYECTO.length).trim()
    : texto;
};

/**
 * Las tres respuestas, listas para pintar como [pregunta, respuesta].
 * Las solicitudes antiguas pueden no tener alguna: se muestra "—".
 */
export const respuestasRegistro = (solicitud) => [
  [PREGUNTA_PROYECTO, respuestaProyecto(solicitud?.motivacion)],
  [PREGUNTA_INVITADO, decodeEntities(solicitud?.invitado_por)],
  [PREGUNTA_EVENTO, decodeEntities(solicitud?.evento_interes)],
];
