type ReportRow = {
  id: string;
  dateLabel: string;
  dateKey: string;
  timeLabel: string;
  status: string;
  takenBy: string[];
  pendingPeople: string[];
  notes: string;
};

type ReportData = {
  zone: {
    id: string;
    name: string;
    description: string;
  };
  range: {
    fromValue: string;
    toValue: string;
    fromLabel: string;
    toLabel: string;
  };
  summary: {
    total: number;
    taken: number;
    available: number;
    pending: number;
    unavailable: number;
  };
  rows: ReportRow[];
};

type PageState = {
  commands: string[];
  pageNumber: number;
  y: number;
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 50;
const TOP_MARGIN = 74;
const BOTTOM_MARGIN = 46;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
const FOOTER_Y = 28;

function normalizePdfText(value: string) {
  return value
    .replaceAll("’", "'")
    .replaceAll("‘", "'")
    .replaceAll("“", "\"")
    .replaceAll("”", "\"")
    .replaceAll("–", "-")
    .replaceAll("—", "-")
    .replaceAll("…", "...")
    .replaceAll("\u00a0", " ")
    .split("")
    .map((character) => {
      const codePoint = character.codePointAt(0) ?? 63;
      return codePoint <= 255 ? character : "?";
    })
    .join("");
}

function pdfEscape(value: string) {
  return normalizePdfText(value)
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)");
}

function rgb(hex: string) {
  const normalized = hex.replace("#", "");
  const r = Number.parseInt(normalized.slice(0, 2), 16) / 255;
  const g = Number.parseInt(normalized.slice(2, 4), 16) / 255;
  const b = Number.parseInt(normalized.slice(4, 6), 16) / 255;
  return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)}`;
}

function approxLineWidth(text: string, fontSize: number, bold = false) {
  return text.length * fontSize * (bold ? 0.56 : 0.5);
}

function wrapText(text: string, width: number, fontSize: number, bold = false) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return [""];
  }

  const lines: string[] = [];
  let current = words[0];

  for (const word of words.slice(1)) {
    const candidate = `${current} ${word}`;
    if (approxLineWidth(candidate, fontSize, bold) <= width) {
      current = candidate;
      continue;
    }

    lines.push(current);
    current = word;
  }

  lines.push(current);
  return lines;
}

function push(commands: string[], command: string) {
  commands.push(command);
}

function drawFilledRect(
  commands: string[],
  x: number,
  yTop: number,
  width: number,
  height: number,
  fillHex: string,
) {
  const y = PAGE_HEIGHT - yTop - height;
  push(commands, `${rgb(fillHex)} rg`);
  push(commands, `${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re f`);
}

function drawStrokedRect(
  commands: string[],
  x: number,
  yTop: number,
  width: number,
  height: number,
  strokeHex: string,
  lineWidth = 1,
) {
  const y = PAGE_HEIGHT - yTop - height;
  push(commands, `${lineWidth.toFixed(2)} w`);
  push(commands, `${rgb(strokeHex)} RG`);
  push(commands, `${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re S`);
}

function drawText(
  commands: string[],
  text: string,
  x: number,
  yTop: number,
  options: {
    font?: "F1" | "F2";
    fontSize?: number;
    color?: string;
  } = {},
) {
  const font = options.font ?? "F1";
  const fontSize = options.fontSize ?? 10;
  const color = options.color ?? "#334155";
  const y = PAGE_HEIGHT - yTop - fontSize;
  push(commands, "BT");
  push(commands, `/${font} ${fontSize.toFixed(2)} Tf`);
  push(commands, `${rgb(color)} rg`);
  push(commands, `1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm`);
  push(commands, `(${pdfEscape(text)}) Tj`);
  push(commands, "ET");
}

function drawTextBlock(
  commands: string[],
  text: string,
  x: number,
  yTop: number,
  width: number,
  options: {
    font?: "F1" | "F2";
    fontSize?: number;
    color?: string;
    lineHeight?: number;
    bold?: boolean;
  } = {},
) {
  const fontSize = options.fontSize ?? 10;
  const lineHeight = options.lineHeight ?? fontSize * 1.35;
  const lines = wrapText(text, width, fontSize, options.bold);

  lines.forEach((line, index) => {
    drawText(commands, line, x, yTop + index * lineHeight, {
      font: options.font,
      fontSize,
      color: options.color,
    });
  });

  return lines.length * lineHeight;
}

function createPage(pageNumber: number): PageState {
  const commands: string[] = [];
  drawFilledRect(commands, 0, 0, PAGE_WIDTH, PAGE_HEIGHT, "#ffffff");
  drawFilledRect(commands, 0, 0, PAGE_WIDTH, 58, "#f4f7fb");
  drawFilledRect(commands, MARGIN_X, 24, 70, 4, "#4a6da7");
  drawText(commands, `Página ${pageNumber}`, PAGE_WIDTH - MARGIN_X - 34, FOOTER_Y, {
    font: "F1",
    fontSize: 8,
    color: "#6b7788",
  });
  return {
    commands,
    pageNumber,
    y: TOP_MARGIN,
  };
}

function ensureSpace(
  pages: PageState[],
  requiredHeight: number,
) {
  let current = pages[pages.length - 1];
  if (current.y + requiredHeight <= PAGE_HEIGHT - BOTTOM_MARGIN) {
    return current;
  }

  current = createPage(current.pageNumber + 1);
  pages.push(current);
  return current;
}

function renderMetricCard(
  page: PageState,
  x: number,
  value: number,
  label: string,
) {
  const width = 112;
  const height = 66;
  drawFilledRect(page.commands, x, page.y, width, height, "#ffffff");
  drawStrokedRect(page.commands, x, page.y, width, height, "#d9e2ef", 0.8);
  drawText(page.commands, String(value), x + 12, page.y + 12, {
    font: "F2",
    fontSize: 16,
    color: "#152238",
  });
  drawTextBlock(page.commands, label, x + 12, page.y + 40, width - 24, {
    font: "F2",
    fontSize: 8.5,
    color: "#64748b",
    lineHeight: 10,
    bold: true,
  });
}

function statusPalette(status: string) {
  if (status === "Tomado") {
    return { bg: "#e9f4ec", text: "#1f7a4f" };
  }
  if (status === "Disponible") {
    return { bg: "#edf4ff", text: "#305fbc" };
  }
  if (status === "En revisión") {
    return { bg: "#fff3e5", text: "#b75a12" };
  }
  return { bg: "#f1f5f9", text: "#475569" };
}

function buildZoneShiftsPdf(data: ReportData) {
  const pages: PageState[] = [createPage(1)];

  let page = pages[0];
  drawText(page.commands, "Reporte operativo", MARGIN_X, page.y, {
    font: "F2",
    fontSize: 8.5,
    color: "#4a6da7",
  });
  page.y += 16;

  drawText(page.commands, data.zone.name, MARGIN_X, page.y, {
    font: "F2",
    fontSize: 22,
    color: "#18263c",
  });
  page.y += 30;

  const subtitle = `Turnos tomados, disponibles y en revisión entre ${data.range.fromLabel} y ${data.range.toLabel}.${data.zone.description ? ` ${data.zone.description}` : ""}`;
  page.y += drawTextBlock(page.commands, subtitle, MARGIN_X, page.y, CONTENT_WIDTH, {
    font: "F1",
    fontSize: 10.5,
    color: "#5a677d",
    lineHeight: 14,
  });
  page.y += 24;

  page = ensureSpace(pages, 80);
  const metrics = [
    [data.summary.total, "Turnos en rango"],
    [data.summary.taken, "Tomados"],
    [data.summary.available, "Disponibles"],
    [data.summary.pending, "En revisión"],
  ] as const;

  metrics.forEach(([value, label], index) => {
    renderMetricCard(page, MARGIN_X + index * 118, value, label);
  });
  page.y += 86;

  const grouped = new Map<string, ReportRow[]>();
  for (const row of data.rows) {
    const current = grouped.get(row.dateLabel) ?? [];
    current.push(row);
    grouped.set(row.dateLabel, current);
  }

  const columns = [
    { key: "time", title: "Horario", width: 82 },
    { key: "status", title: "Estado", width: 84 },
    { key: "taken", title: "Quién tomó el turno", width: 164 },
    { key: "detail", title: "Detalle", width: 165 },
  ] as const;

  for (const [dateLabel, rows] of grouped) {
    page = ensureSpace(pages, 42);
    drawText(page.commands, dateLabel, MARGIN_X, page.y, {
      font: "F2",
      fontSize: 12,
      color: "#18263c",
    });
    page.y += 18;

    page = ensureSpace(pages, 30);
    let currentX = MARGIN_X;
    drawFilledRect(page.commands, MARGIN_X, page.y, CONTENT_WIDTH, 28, "#eef3fa");
    drawStrokedRect(page.commands, MARGIN_X, page.y, CONTENT_WIDTH, 28, "#d7dfeb", 0.8);
    for (const column of columns) {
      drawText(page.commands, column.title, currentX + 8, page.y + 10, {
        font: "F2",
        fontSize: 8.3,
        color: "#425168",
      });
      currentX += column.width;
    }
    page.y += 28;

    rows.forEach((row, rowIndex) => {
      const takenText = row.takenBy.join(" / ") || "-";
      const detailText = row.notes;
      const timeLines = wrapText(row.timeLabel, columns[0].width - 16, 9.5);
      const takenLines = wrapText(takenText, columns[2].width - 16, 9.5);
      const detailLines = wrapText(detailText, columns[3].width - 16, 9.5);
      const rowLines = Math.max(timeLines.length, 1, takenLines.length, detailLines.length);
      const rowHeight = Math.max(34, rowLines * 13 + 14);

      page = ensureSpace(pages, rowHeight + 2);
      const rowBg = rowIndex % 2 === 0 ? "#ffffff" : "#fbfcfe";
      drawFilledRect(page.commands, MARGIN_X, page.y, CONTENT_WIDTH, rowHeight, rowBg);
      drawStrokedRect(page.commands, MARGIN_X, page.y, CONTENT_WIDTH, rowHeight, "#dfe6f0", 0.5);

      let x = MARGIN_X;
      for (const column of columns) {
        drawStrokedRect(page.commands, x, page.y, column.width, rowHeight, "#dfe6f0", 0.5);
        x += column.width;
      }

      const palette = statusPalette(row.status);
      drawFilledRect(page.commands, MARGIN_X + columns[0].width, page.y, columns[1].width, rowHeight, palette.bg);

      drawTextBlock(page.commands, row.timeLabel, MARGIN_X + 8, page.y + 10, columns[0].width - 16, {
        font: "F1",
        fontSize: 9.5,
        color: "#334155",
        lineHeight: 13,
      });
      drawTextBlock(page.commands, row.status, MARGIN_X + columns[0].width + 8, page.y + 10, columns[1].width - 16, {
        font: "F2",
        fontSize: 9.5,
        color: palette.text,
        lineHeight: 13,
        bold: true,
      });
      drawTextBlock(page.commands, takenText, MARGIN_X + columns[0].width + columns[1].width + 8, page.y + 10, columns[2].width - 16, {
        font: "F1",
        fontSize: 9.5,
        color: "#334155",
        lineHeight: 13,
      });
      drawTextBlock(page.commands, detailText, MARGIN_X + columns[0].width + columns[1].width + columns[2].width + 8, page.y + 10, columns[3].width - 16, {
        font: "F1",
        fontSize: 9.5,
        color: "#334155",
        lineHeight: 13,
      });

      page.y += rowHeight;
    });

    page.y += 16;
  }

  if (data.rows.length === 0) {
    page = ensureSpace(pages, 30);
    drawTextBlock(
      page.commands,
      "No hay turnos para este lugar dentro del rango seleccionado.",
      MARGIN_X,
      page.y,
      CONTENT_WIDTH,
      {
        font: "F1",
        fontSize: 10,
        color: "#334155",
        lineHeight: 14,
      },
    );
  }

  return buildPdfDocument(pages);
}

function buildPdfDocument(pages: PageState[]) {
  const objects: string[] = [];
  const fontRegularId = 1;
  const fontBoldId = 2;
  const pagesId = 3;
  let nextObjectId = 4;

  objects[fontRegularId] =
    `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`;
  objects[fontBoldId] =
    `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`;

  const pageObjectIds: number[] = [];

  pages.forEach((page) => {
    const contentId = nextObjectId++;
    const pageId = nextObjectId++;
    const content = `${page.commands.join("\n")}\n`;
    const contentStream = `<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}endstream`;
    objects[contentId] = contentStream;
    objects[pageId] = `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentId} 0 R >>`;
    pageObjectIds.push(pageId);
  });

  objects[pagesId] = `<< /Type /Pages /Count ${pageObjectIds.length} /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] >>`;

  const catalogId = nextObjectId++;
  objects[catalogId] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];

  for (let id = 1; id < objects.length; id += 1) {
    const object = objects[id];
    if (!object) {
      continue;
    }
    offsets[id] = Buffer.byteLength(pdf, "latin1");
    pdf += `${id} 0 obj\n${object}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length}\n`;
  pdf += "0000000000 65535 f \n";

  for (let id = 1; id < objects.length; id += 1) {
    const offset = offsets[id] ?? 0;
    pdf += `${offset.toString().padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "latin1");
}

export { buildZoneShiftsPdf };
export default buildZoneShiftsPdf;
