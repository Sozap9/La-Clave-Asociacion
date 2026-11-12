import PDFDocument from "pdfkit";

// Tablas PDF para las exportaciones del admin. Cada fila mide su alto real,
// así que salta de página sin cortar filas y repite la cabecera.

const COLORS = {
  text: "#111111",
  muted: "#6b7280",
  headerBg: "#111111",
  headerText: "#ffffff",
  accent: "#CA8A04", // primary-600 de la web
  zebra: "#f4f4f5",
};

const PAD_X = 5;
const PAD_Y = 4;

/**
 * Crea el PDF, lo envía en la respuesta y pinta título y resumen.
 * @param {Object} opciones { res, filename (sin fecha ni extensión), title, lines }
 */
export const createListPdf = ({ res, filename, title, lines = [] }) => {
  const doc = new PDFDocument({
    size: "A4",
    layout: "landscape",
    margins: { top: 40, bottom: 45, left: 40, right: 40 },
    bufferPages: true, // necesario para numerar las páginas al final
    info: { Title: title, Author: "La Clave Asociación" },
  });

  const fecha = new Date().toISOString().split("T")[0];
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=${filename}_${fecha}.pdf`,
  );
  doc.pipe(res);

  const left = doc.page.margins.left;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .fillColor(COLORS.text)
    .text(title, left, doc.page.margins.top, { width, align: "center" });

  doc
    .moveDown(0.3)
    .font("Helvetica")
    .fontSize(9)
    .fillColor(COLORS.muted)
    .text(`Generado el ${new Date().toLocaleDateString("es-ES")}`, { width, align: "center" });

  lines.filter(Boolean).forEach((line) => {
    doc
      .moveDown(0.2)
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(COLORS.text)
      .text(line, { width, align: "center" });
  });

  doc.moveDown(1.2);
  return doc;
};

/**
 * Tabla de varias páginas.
 * Columna: { header, width (peso relativo), value(fila), align?, color(fila)?, bold? }
 */
export const drawTable = (doc, { columns, rows }) => {
  const left = doc.page.margins.left;
  const tableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const totalWeight = columns.reduce((sum, c) => sum + c.width, 0);
  const widths = columns.map((c) => (c.width / totalWeight) * tableWidth);
  const bottomLimit = () => doc.page.height - doc.page.margins.bottom;

  const cellText = (column, row) => {
    const value = column.value(row);
    return value === null || value === undefined || value === "" ? "-" : String(value);
  };

  let y = doc.y;

  const drawHeader = () => {
    doc.font("Helvetica-Bold").fontSize(9);
    const height =
      Math.max(
        ...columns.map((c, i) =>
          doc.heightOfString(c.header, { width: widths[i] - PAD_X * 2 }),
        ),
      ) +
      PAD_Y * 2;

    doc.rect(left, y, tableWidth, height).fill(COLORS.headerBg);

    let x = left;
    columns.forEach((c, i) => {
      doc
        .fillColor(COLORS.headerText)
        .text(c.header, x + PAD_X, y + PAD_Y, {
          width: widths[i] - PAD_X * 2,
          align: c.align || "left",
        });
      x += widths[i];
    });

    y += height;
    doc.rect(left, y, tableWidth, 1.5).fill(COLORS.accent);
    y += 1.5;
  };

  drawHeader();

  rows.forEach((row, index) => {
    doc.font("Helvetica").fontSize(8.5);

    const texts = columns.map((c) => cellText(c, row));
    const height =
      Math.max(
        ...texts.map((text, i) => {
          doc.font(columns[i].bold ? "Helvetica-Bold" : "Helvetica");
          return doc.heightOfString(text, { width: widths[i] - PAD_X * 2 });
        }),
      ) +
      PAD_Y * 2;

    // Si la fila no cabe, nueva página con la cabecera repetida
    if (y + height > bottomLimit()) {
      doc.addPage();
      y = doc.page.margins.top;
      drawHeader();
    }

    if (index % 2 === 0) {
      doc.rect(left, y, tableWidth, height).fill(COLORS.zebra);
    }

    let x = left;
    columns.forEach((c, i) => {
      doc
        .font(c.bold ? "Helvetica-Bold" : "Helvetica")
        .fontSize(8.5)
        .fillColor((c.color && c.color(row)) || COLORS.text)
        .text(texts[i], x + PAD_X, y + PAD_Y, {
          width: widths[i] - PAD_X * 2,
          align: c.align || "left",
        });
      x += widths[i];
    });

    y += height;
  });

  doc.x = left;
  doc.y = y;
};

// Pie "Página X de Y" en todas las páginas y cierre del PDF
export const finishPdf = (doc) => {
  const range = doc.bufferedPageRange();

  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);

    const left = doc.page.margins.left;
    const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const y = doc.page.height - 30;

    // Sin margen inferior un momento: si no, PDFKit abre una página nueva
    const bottomMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(COLORS.muted)
      .text("© La Clave Asociación · Documento generado automáticamente", left, y, {
        width,
        align: "left",
        lineBreak: false,
      })
      .text(`Página ${i - range.start + 1} de ${range.count}`, left, y, {
        width,
        align: "right",
        lineBreak: false,
      });

    doc.page.margins.bottom = bottomMargin;
  }

  doc.end();
};

// Colores de estado para las tablas
export const STATUS_COLORS = {
  ok: "#047857",      // verde
  warning: "#b45309", // ámbar oscuro
  danger: "#b91c1c",  // rojo
  info: "#1d4ed8",    // azul
  neutral: "#6b7280", // gris
};
