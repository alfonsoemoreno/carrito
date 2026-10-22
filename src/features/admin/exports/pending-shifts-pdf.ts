import type { PendingShiftsReport } from "./pending-shifts";
import { buildPdfDocument, drawFilledRect, drawStrokedRect, drawText, drawTextBlock, wrapText, type PageState } from "./zone-shifts-pdf";

const WIDTH = 595.28;
const HEIGHT = 841.89;
const X = 42;
const CONTENT = WIDTH - X * 2;
const BOTTOM = HEIGHT - 58;

export function buildPendingShiftsPdf(data: PendingShiftsReport) {
  const pages: PageState[] = [];
  function newPage() {
    const page: PageState = { commands: [], pageNumber: pages.length + 1, y: 62 };
    drawFilledRect(page.commands, X, 32, 44, 4, "#e0cf13");
    drawText(page.commands, "TURNOS PENDIENTES", X + 56, 27, { font: "F2", fontSize: 9, color: "#53606c" });
    drawText(page.commands, "Valdivia", WIDTH - X - 40, 27, { fontSize: 9, color: "#53606c" });
    pages.push(page);
    return page;
  }
  let page = newPage();
  drawText(page.commands, "Horarios por cubrir", X, page.y, { font: "F2", fontSize: 25, color: "#172b38" });
  page.y += 38;
  page.y += drawTextBlock(page.commands, data.scopeLabel, X, page.y, CONTENT, { font: "F2", fontSize: 12, lineHeight: 16, color: "#172b38", bold: true });
  drawText(page.commands, data.rangeLabel, X, page.y + 5, { fontSize: 10, color: "#53606c" });
  page.y += 33;
  drawFilledRect(page.commands, X, page.y, CONTENT, 48, "#f4f5e8");
  drawText(page.commands, String(data.rows.length), X + 14, page.y + 10, { font: "F2", fontSize: 23, color: "#172b38" });
  drawText(page.commands, data.rows.length === 1 ? "turno pendiente de asignación" : "turnos pendientes de asignación", X + 65, page.y + 16, { fontSize: 11, color: "#172b38" });
  page.y += 62;
  page.y += drawTextBlock(page.commands, "Cada horario corresponde a un turno sin pareja confirmada. La asignación debe confirmarse con la administración.", X, page.y, CONTENT, { fontSize: 10, lineHeight: 14, color: "#53606c" });
  page.y += 24;

  const zones = new Map<string, typeof data.rows>();
  for (const row of data.rows) {
    const group = zones.get(row.zoneId) ?? [];
    group.push(row);
    zones.set(row.zoneId, group);
  }
  for (const rows of zones.values()) {
    const zoneName = rows[0].zoneName;
    const zoneHeight = wrapText(zoneName, CONTENT - 26, 15, true).length * 19 + 18;
    function sectionHeader(continued = false) {
      const title = `${zoneName}${continued ? " (continuación)" : ""}`;
      const height = wrapText(title, CONTENT - 26, 15, true).length * 19 + 18;
      drawFilledRect(page.commands, X, page.y, CONTENT, height, "#172b38");
      drawTextBlock(page.commands, title, X + 13, page.y + 9, CONTENT - 26, { font: "F2", fontSize: 15, lineHeight: 19, color: "#ffffff", bold: true });
      page.y += height;
      drawFilledRect(page.commands, X, page.y, CONTENT, 25, "#eef1f3");
      drawText(page.commands, "DÍA", X + 13, page.y + 7, { font: "F2", fontSize: 9, color: "#53606c" });
      drawText(page.commands, "HORARIOS DISPONIBLES", X + 189, page.y + 7, { font: "F2", fontSize: 9, color: "#53606c" });
      page.y += 25;
    }
    const days = new Map<string, typeof rows>();
    for (const row of rows) {
      const group = days.get(row.dateKey) ?? [];
      group.push(row);
      days.set(row.dateKey, group);
    }
    let first = true;
    for (const day of days.values()) {
      // Split unusually large daily schedules into complete rows that fit the page.
      for (let offset = 0; offset < day.length; offset += 12) {
        const chunk = day.slice(offset, offset + 12);
        const label = `${day[0].dateLabel}${offset ? " (continuación)" : ""}`;
        const dateHeight = wrapText(label, 150, 11, true).length * 15 + 24;
        const height = Math.max(dateHeight, Math.ceil(chunk.length / 2) * 33 + 16);
        if (page.y + height + (first ? zoneHeight + 25 : 0) > BOTTOM) {
          page = newPage();
          sectionHeader(!first);
          first = false;
        } else if (first) {
          sectionHeader();
          first = false;
        }
        drawStrokedRect(page.commands, X, page.y, CONTENT, height, "#dce2e5", 0.6);
        drawTextBlock(page.commands, label.charAt(0).toUpperCase() + label.slice(1), X + 13, page.y + 14, 150, { font: "F2", fontSize: 11, lineHeight: 15, color: "#172b38", bold: true });
        chunk.forEach((row, index) => {
          const x = X + 189 + (index % 2) * 151;
          const y = page.y + 10 + Math.floor(index / 2) * 33;
          drawFilledRect(page.commands, x, y, 140, 26, "#f0f5f5");
          drawText(page.commands, row.timeLabel, x + 12, y + 6, { font: "F2", fontSize: 11, color: "#172b38" });
        });
        page.y += height;
      }
    }
    page.y += 20;
  }
  if (data.rows.length === 0) {
    page.y += drawTextBlock(page.commands, "No hay horarios pendientes disponibles en el período seleccionado.", X, page.y, CONTENT, { fontSize: 12, lineHeight: 17, color: "#172b38" });
  }
  for (const current of pages) {
    drawFilledRect(current.commands, X, HEIGHT - 42, CONTENT, 0.6, "#dce2e5");
    drawText(current.commands, `Actualizado: ${data.generatedAtLabel} (Chile)`, X, HEIGHT - 32, { fontSize: 8, color: "#53606c" });
    drawText(current.commands, `${current.pageNumber} / ${pages.length}`, WIDTH - X - 27, HEIGHT - 32, { fontSize: 8, color: "#53606c" });
  }
  return buildPdfDocument(pages);
}
