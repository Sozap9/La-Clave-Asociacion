// Las horas de los eventos son de Madrid y el servidor puede estar en UTC:
// se compara todo como hora de reloj de Madrid (ms desde 1970 sin zona)

export const ahoraEnMadrid = () => {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Madrid",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value]),
  );
  return Date.UTC(partes.year, partes.month - 1, partes.day, partes.hour, partes.minute, partes.second);
};

// fecha_evento llega como Date (medianoche en la zona del servidor) o como "YYYY-MM-DD"
const partesFecha = (fecha) => {
  if (fecha instanceof Date) {
    return [fecha.getFullYear(), fecha.getMonth() + 1, fecha.getDate()];
  }
  return String(fecha).slice(0, 10).split("-").map(Number);
};

const horasMinutos = (hora, porDefecto) => (hora || porDefecto).split(":").map(Number);

export const inicioEvento = ({ fecha_evento, hora_evento }) => {
  const [y, m, d] = partesFecha(fecha_evento);
  const [h, mi] = horasMinutos(hora_evento, "00:00:00");
  return Date.UTC(y, m - 1, d, h, mi);
};

// Si hora_fin < hora_evento el evento acaba al día siguiente (p. ej. 23:30 a 06:00)
export const finEvento = ({ fecha_evento, hora_evento, hora_fin }) => {
  const [y, m, d] = partesFecha(fecha_evento);
  const [hi, mi] = horasMinutos(hora_evento, "00:00:00");
  const [hf, mf] = horasMinutos(hora_fin, "23:59:59");
  const cruzaMedianoche = hf * 60 + mf < hi * 60 + mi;
  return Date.UTC(y, m - 1, d + (cruzaMedianoche ? 1 : 0), hf, mf);
};

// Una hora en punto del día del evento
export const horaDelDiaEvento = (fecha_evento, hora) => {
  const [y, m, d] = partesFecha(fecha_evento);
  return Date.UTC(y, m - 1, d, hora, 0);
};