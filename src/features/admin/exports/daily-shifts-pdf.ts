import type { DailyShiftsReport } from "./daily-shifts";
import { buildPdfDocument, drawFilledRect, drawStrokedRect, drawText, drawTextBlock, wrapText, type PageState } from "./zone-shifts-pdf";

const WIDTH = 595.28;
const HEIGHT = 841.89;
const X = 42;
const CONTENT = WIDTH - X * 2;
const BOTTOM = HEIGHT - 58;

export function buildDailyShiftsPdf(data: DailyShiftsReport) {
  const pages: PageState[] = [];
  function newPage() {
    const page: PageState = { commands: [], pageNumber: pages.length + 1, y: 62 };
    drawFilledRect(page.commands, X, 32, 44, 4, "#e0cf13");
    drawText(page.commands, "REPORTE DIARIO", X + 56, 27, { font: "F2", fontSize: 9, color: "#53606c" });
    drawText(page.commands, data.date, WIDTH - X - 65, 27, { fontSize: 9, color: "#53606c" });
    pages.push(page);
    return page;
  }
  let page = newPage();
  drawText(page.commands, "Turnos del día", X, page.y, { font: "F2", fontSize: 25, color: "#172b38" });
  page.y += 38;
  const dateLabel = data.dateLabel.charAt(0).toUpperCase() + data.dateLabel.slice(1);
  page.y += drawTextBlock(page.commands, dateLabel, X, page.y, CONTENT, { font: "F2", fontSize: 13, lineHeight: 18, bold: true, color: "#172b38" });
  drawText(page.commands, "Todos los lugares", X, page.y + 4, { fontSize: 10, color: "#53606c" });
  page.y += 28;
  const metrics = [
    [data.rows.length, "Turnos del día"],
    [data.rows.filter((row) => row.status === "Completo").length, "Completos"],
    [data.rows.filter((row) => row.status === "Por completar").length, "Por completar"],
    [data.rows.filter((row) => row.status === "No disponible").length, "No disponibles"],
  ] as const;
  metrics.forEach(([count, label], index) => {
    const x = X + index * (CONTENT / 4);
    drawFilledRect(page.commands, x, page.y, CONTENT / 4 - 5, 51, index === 2 ? "#fff3df" : "#eef3f4");
    drawText(page.commands, String(count), x + 10, page.y + 6, { font: "F2", fontSize: 20, color: "#172b38" });
    drawText(page.commands, label, x + 10, page.y + 33, { fontSize: 9, color: "#53606c" });
  });
  page.y += 66;
  page.y += drawTextBlock(page.commands, "Completos: pareja confirmada. Por completar: sin pareja confirmada. Los nombres de solicitantes no se incluyen.", X, page.y, CONTENT, { fontSize: 10, lineHeight: 14, color: "#53606c" });
  page.y += 20;
  const groups = new Map<string, typeof data.rows>();
  for (const row of data.rows) {
    const group = groups.get(row.zoneId) ?? [];
    group.push(row);
    groups.set(row.zoneId, group);
  }
  for (const rows of groups.values()) {
    const zoneName = rows[0].zoneName;
    function headerHeight(continued: boolean) {
      return wrapText(`${zoneName}${continued ? " (continuación)" : ""}`, CONTENT - 24, 14, true).length * 18 + 16;
    }
    function sectionHeader(continued: boolean) {
      const title = `${zoneName}${continued ? " (continuación)" : ""}`;
      const height = headerHeight(continued);
      drawFilledRect(page.commands, X, page.y, CONTENT, height, "#172b38");
      drawTextBlock(page.commands, title, X + 12, page.y + 8, CONTENT - 24, { font: "F2", fontSize: 14, lineHeight: 18, bold: true, color: "#ffffff" });
      page.y += height;
      drawFilledRect(page.commands, X, page.y, CONTENT, 25, "#eef1f3");
      for (const [label, offset] of [["HORARIO", 10], ["ESTADO", 109], ["PAREJA CONFIRMADA", 209]] as const) {
        drawText(page.commands, label, X + offset, page.y + 7, { font: "F2", fontSize: 8.5, color: "#53606c" });
      }
      page.y += 25;
    }
    let first = true;
    for (const row of rows) {
      const detail = row.status === "Completo" ? row.participants.join(" + ") : row.status === "Por completar" ? "Pareja por confirmar" : "Fuera de disponibilidad operativa";
      const lines = wrapText(detail, CONTENT - 219, 10.5);
      const height = Math.max(42, lines.length * 14 + 20);
      if (page.y + height + (first ? headerHeight(false) + 25 : 0) > BOTTOM) {
        page = newPage();
        sectionHeader(!first);
      } else if (first) sectionHeader(false);
      first = false;
      drawStrokedRect(page.commands, X, page.y, CONTENT, height, "#dce2e5", 0.6);
      const color = row.status === "Completo" ? "#21654b" : row.status === "Por completar" ? "#8a4b0c" : "#53606c";
      const fill = row.status === "Completo" ? "#ecf5ee" : row.status === "Por completar" ? "#fff3df" : "#eef1f3";
      drawFilledRect(page.commands, X + 99, page.y + 1, 100, height - 2, fill);
      drawText(page.commands, row.timeLabel, X + 10, page.y + 13, { fontSize: 10, color: "#172b38" });
      drawTextBlock(page.commands, row.status, X + 109, page.y + 13, 80, { font: "F2", fontSize: 10, color, bold: true, lineHeight: 14 });
      drawTextBlock(page.commands, detail, X + 209, page.y + 12, CONTENT - 219, { fontSize: 10.5, lineHeight: 14, color: "#172b38" });
      page.y += height;
    }
    page.y += 18;
  }
  if (!data.rows.length) {
    drawTextBlock(page.commands, "No hay turnos registrados para el día seleccionado.", X, page.y, CONTENT, { fontSize: 12, lineHeight: 17, color: "#172b38" });
  }
  for (const current of pages) {
    drawFilledRect(current.commands, X, HEIGHT - 42, CONTENT, 0.6, "#dce2e5");
    drawText(current.commands, `Actualizado: ${data.generatedAtLabel} (Chile)`, X, HEIGHT - 32, { fontSize: 8, color: "#53606c" });
    drawText(current.commands, `${current.pageNumber} / ${pages.length}`, WIDTH - X - 27, HEIGHT - 32, { fontSize: 8, color: "#53606c" });
  }
  return buildPdfDocument(pages);
}
