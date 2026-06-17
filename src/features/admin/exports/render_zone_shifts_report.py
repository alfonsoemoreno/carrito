import io
import json
import sys
from collections import OrderedDict
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


PAGE_WIDTH, PAGE_HEIGHT = A4


def build_styles():
    base = getSampleStyleSheet()
    return {
        "eyebrow": ParagraphStyle(
            "Eyebrow",
            parent=base["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=8.5,
            leading=10,
            textColor=colors.HexColor("#4a6da7"),
            alignment=TA_LEFT,
        ),
        "title": ParagraphStyle(
            "Title",
            parent=base["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=21,
            leading=25,
            textColor=colors.HexColor("#18263c"),
            spaceAfter=4,
        ),
        "subtitle": ParagraphStyle(
            "Subtitle",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=10.5,
            leading=14,
            textColor=colors.HexColor("#5a677d"),
        ),
        "section": ParagraphStyle(
            "Section",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=14,
            textColor=colors.HexColor("#18263c"),
            spaceAfter=6,
        ),
        "body": ParagraphStyle(
            "Body",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=9.5,
            leading=13,
            textColor=colors.HexColor("#334155"),
        ),
        "small": ParagraphStyle(
            "Small",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=8.3,
            leading=11,
            textColor=colors.HexColor("#64748b"),
        ),
        "metricValue": ParagraphStyle(
            "MetricValue",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=16,
            leading=18,
            textColor=colors.HexColor("#152238"),
        ),
        "metricLabel": ParagraphStyle(
            "MetricLabel",
            parent=base["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=8.5,
            leading=10,
            textColor=colors.HexColor("#64748b"),
        ),
    }


def status_colors(status):
    if status == "Tomado":
        return colors.HexColor("#e9f4ec"), colors.HexColor("#1f7a4f")
    if status == "Disponible":
        return colors.HexColor("#edf4ff"), colors.HexColor("#305fbc")
    if status == "En revisión":
        return colors.HexColor("#fff3e5"), colors.HexColor("#b75a12")
    return colors.HexColor("#f1f5f9"), colors.HexColor("#475569")


def header(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(colors.white)
    canvas.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)
    canvas.setFillColor(colors.HexColor("#f4f7fb"))
    canvas.rect(0, PAGE_HEIGHT - 26 * mm, PAGE_WIDTH, 26 * mm, fill=1, stroke=0)
    canvas.setFillColor(colors.HexColor("#4a6da7"))
    canvas.rect(doc.leftMargin, PAGE_HEIGHT - 22 * mm, 36 * mm, 4, fill=1, stroke=0)
    canvas.setFillColor(colors.HexColor("#6b7788"))
    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(PAGE_WIDTH - doc.rightMargin, 13 * mm, f"Página {doc.page}")
    canvas.restoreState()


def metric_card(value, label, styles):
    return Table(
        [[Paragraph(str(value), styles["metricValue"])], [Paragraph(label, styles["metricLabel"])]],
        colWidths=[38 * mm],
        style=TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.white),
                ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#d9e2ef")),
                ("TOPPADDING", (0, 0), (-1, -1), 9),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ]
        ),
    )


def build_story(data):
    styles = build_styles()
    story = []

    story.append(Paragraph("Reporte operativo", styles["eyebrow"]))
    story.append(Paragraph(data["zone"]["name"], styles["title"]))
    subtitle = (
        f"Turnos tomados, disponibles y en revisión entre "
        f"{data['range']['fromLabel']} y {data['range']['toLabel']}."
    )
    if data["zone"]["description"]:
        subtitle += f" {data['zone']['description']}"
    story.append(Paragraph(subtitle, styles["subtitle"]))
    story.append(Spacer(1, 8 * mm))

    metrics = Table(
        [[
            metric_card(data["summary"]["total"], "Turnos en rango", styles),
            metric_card(data["summary"]["taken"], "Tomados", styles),
            metric_card(data["summary"]["available"], "Disponibles", styles),
            metric_card(data["summary"]["pending"], "En revisión", styles),
        ]],
        colWidths=[42 * mm, 42 * mm, 42 * mm, 42 * mm],
        style=TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]),
    )
    story.append(metrics)
    story.append(Spacer(1, 8 * mm))

    grouped = OrderedDict()
    for row in data["rows"]:
        grouped.setdefault(row["dateLabel"], []).append(row)

    for date_label, rows in grouped.items():
        story.append(Paragraph(date_label, styles["section"]))
        table_data = [[
            Paragraph("<b>Horario</b>", styles["small"]),
            Paragraph("<b>Estado</b>", styles["small"]),
            Paragraph("<b>Quién tomó el turno</b>", styles["small"]),
            Paragraph("<b>Detalle</b>", styles["small"]),
        ]]

        for row in rows:
          status_bg, status_text = status_colors(row["status"])
          taken_text = " / ".join(row["takenBy"]) if row["takenBy"] else "-"
          status_paragraph = Paragraph(
              f'<font color="{status_text}"><b>{row["status"]}</b></font>',
              styles["body"],
          )
          table_data.append([
              Paragraph(row["timeLabel"], styles["body"]),
              status_paragraph,
              Paragraph(taken_text, styles["body"]),
              Paragraph(row["notes"], styles["body"]),
          ])

        table = Table(
            table_data,
            colWidths=[28 * mm, 30 * mm, 58 * mm, 58 * mm],
            repeatRows=1,
            style=TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#eef3fa")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#425168")),
                    ("LINEBELOW", (0, 0), (-1, 0), 0.8, colors.HexColor("#d7dfeb")),
                    ("GRID", (0, 1), (-1, -1), 0.5, colors.HexColor("#dfe6f0")),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 8),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                    ("TOPPADDING", (0, 0), (-1, -1), 8),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ]
            ),
        )

        for index, row in enumerate(rows, start=1):
            status_bg, _ = status_colors(row["status"])
            table.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (1, index), (1, index), status_bg),
                        ("BACKGROUND", (0, index), (-1, index), colors.white if index % 2 else colors.HexColor("#fbfcfe")),
                    ]
                )
            )

        story.append(table)
        story.append(Spacer(1, 5 * mm))

    if not data["rows"]:
        story.append(Paragraph("No hay turnos para este lugar dentro del rango seleccionado.", styles["body"]))

    return story


def main():
    payload = json.load(sys.stdin)
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=32 * mm,
        bottomMargin=18 * mm,
    )
    doc.build(build_story(payload), onFirstPage=header, onLaterPages=header)
    sys.stdout.buffer.write(buffer.getvalue())


if __name__ == "__main__":
    main()
