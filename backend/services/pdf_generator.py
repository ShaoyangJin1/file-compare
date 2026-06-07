"""PDF generation service using ReportLab."""

import io
from datetime import datetime
from typing import Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    KeepTogether,
)
from reportlab.platypus.flowables import HRFlowable
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os

from models.excel_models import AGG_METHOD_LABELS

# Try to register a CJK font for Chinese support
# On Windows, try Microsoft YaHei; fall back to built-in Helvetica
_CJK_FONT = "Helvetica"
_FONT_PATHS = [
    "C:/Windows/Fonts/msyh.ttc",       # Microsoft YaHei
    "C:/Windows/Fonts/simhei.ttf",      # SimHei
    "C:/Windows/Fonts/simsun.ttc",      # SimSun
    "C:/Windows/Fonts/msyhbd.ttc",      # Microsoft YaHei Bold
]

for font_path in _FONT_PATHS:
    if os.path.exists(font_path):
        try:
            pdfmetrics.registerFont(TTFont("CJK", font_path))
            _CJK_FONT = "CJK"
            break
        except Exception:
            continue


def _font(size: int = 10) -> str:
    return _CJK_FONT


def generate_pdf(
    compare_type: str,
    data: dict[str, Any],
    title: str = "对比报告",
) -> bytes:
    """Generate a PDF from comparison results using ReportLab.

    Args:
        compare_type: "text" or "excel".
        data: The comparison result data.
        title: Report title.

    Returns:
        PDF file as bytes.
    """
    buf = io.BytesIO()

    # Use landscape for Excel, portrait for text
    if compare_type == "excel":
        page_size = landscape(A4)
    else:
        page_size = A4

    doc = SimpleDocTemplate(
        buf,
        pagesize=page_size,
        topMargin=1.5 * cm,
        bottomMargin=1.5 * cm,
        leftMargin=1.5 * cm,
        rightMargin=1.5 * cm,
        title=title,
    )

    story = []

    # Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "CustomTitle",
        parent=styles["Title"],
        fontName=_font(),
        fontSize=16,
        spaceAfter=6,
        alignment=TA_CENTER,
    )
    subtitle_style = ParagraphStyle(
        "Subtitle",
        parent=styles["Normal"],
        fontName=_font(),
        fontSize=9,
        textColor=colors.gray,
        alignment=TA_CENTER,
        spaceAfter=16,
    )
    heading_style = ParagraphStyle(
        "CustomHeading",
        parent=styles["Heading2"],
        fontName=_font(),
        fontSize=12,
        spaceBefore=16,
        spaceAfter=8,
    )
    normal_style = ParagraphStyle(
        "CustomNormal",
        parent=styles["Normal"],
        fontName=_font(),
        fontSize=9,
        leading=14,
    )
    cell_style = ParagraphStyle(
        "CellStyle",
        parent=normal_style,
        fontSize=8,
        leading=11,
    )
    header_style = ParagraphStyle(
        "HeaderStyle",
        parent=cell_style,
        textColor=colors.white,
        fontSize=9,
    )

    # === Title ===
    story.append(Paragraph(title, title_style))
    story.append(
        Paragraph(
            f"生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  |  "
            f"对比类型: {'文本对比' if compare_type == 'text' else 'Excel 对比'}",
            subtitle_style,
        )
    )
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#4a90d9")))
    story.append(Spacer(1, 12))

    if compare_type == "text":
        _build_text_report(story, data, heading_style, normal_style, cell_style, header_style)
    else:
        _build_excel_report(story, data, heading_style, normal_style, cell_style, header_style)

    # Footer
    story.append(Spacer(1, 20))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.lightgrey))
    story.append(Spacer(1, 6))
    story.append(
        Paragraph(
            "文件对比工具 — 报告自动生成",
            ParagraphStyle(
                "Footer",
                parent=normal_style,
                fontSize=7,
                textColor=colors.lightgrey,
                alignment=TA_CENTER,
            ),
        )
    )

    doc.build(story)
    buf.seek(0)
    return buf.read()


def _build_text_report(
    story: list,
    data: dict[str, Any],
    heading_style: ParagraphStyle,
    normal_style: ParagraphStyle,
    cell_style: ParagraphStyle,
    header_style: ParagraphStyle,
) -> None:
    """Build the text comparison section of the PDF."""
    # File info table
    story.append(Paragraph("文件信息", heading_style))
    file_info_data = [
        [Paragraph("<b>项目</b>", header_style),
         Paragraph("<b>文件 1</b>", header_style),
         Paragraph("<b>文件 2</b>", header_style)],
        [Paragraph("文件名", cell_style),
         Paragraph(str(data.get("file1_name", "")), cell_style),
         Paragraph(str(data.get("file2_name", "")), cell_style)],
        [Paragraph("编码", cell_style),
         Paragraph(str(data.get("encoding", "")), cell_style),
         Paragraph("", cell_style)],
        [Paragraph("总行数", cell_style),
         Paragraph(str(data.get("file1_lines", "")), cell_style),
         Paragraph(str(data.get("file2_lines", "")), cell_style)],
    ]
    _add_table(story, file_info_data, col_widths=[80, 200, 200])

    # Stats
    stats = data.get("stats", {})
    if stats:
        story.append(Paragraph("差异统计", heading_style))
        stats_data = [
            [
                Paragraph("<b>新增</b>", header_style),
                Paragraph("<b>删除</b>", header_style),
                Paragraph("<b>修改</b>", header_style),
                Paragraph("<b>未变更</b>", header_style),
            ],
            [
                Paragraph(str(stats.get("added", 0)), cell_style),
                Paragraph(str(stats.get("deleted", 0)), cell_style),
                Paragraph(str(stats.get("changed", 0)), cell_style),
                Paragraph(str(stats.get("unchanged", 0)), cell_style),
            ],
        ]
        _add_table(story, stats_data, col_widths=[120, 120, 120, 120])

    # Diff content (truncated for PDF)
    unified_diff = data.get("unified_diff", "")
    if unified_diff:
        story.append(Paragraph("差异详情 (Unified Diff)", heading_style))
        # Limit to first 500 lines for PDF
        lines = unified_diff.split("\n")[:500]
        diff_text = "\n".join(lines)
        if len(unified_diff.split("\n")) > 500:
            diff_text += "\n... (内容过长，已截断)"

        code_data = [[Paragraph(f"<pre>{diff_text}</pre>", cell_style)]]
        _add_table(story, code_data, col_widths=[480])


def _build_excel_report(
    story: list,
    data: dict[str, Any],
    heading_style: ParagraphStyle,
    normal_style: ParagraphStyle,
    cell_style: ParagraphStyle,
    header_style: ParagraphStyle,
) -> None:
    """Build the Excel comparison section of the PDF."""
    # Config
    story.append(Paragraph("比对配置", heading_style))

    # Format column_aggs with method labels from the model
    column_aggs = data.get("column_aggs", [])
    aggs_display = ", ".join(
        f"{ca.get('column', '')}({AGG_METHOD_LABELS.get(ca.get('method', ''), ca.get('method', ''))})"
        for ca in column_aggs
    )

    config_data = [
        [Paragraph("<b>项目</b>", header_style), Paragraph("<b>值</b>", header_style)],
        [Paragraph("文件1 Sheet", cell_style), Paragraph(str(data.get("sheet1_name", "")), cell_style)],
        [Paragraph("文件2 Sheet", cell_style), Paragraph(str(data.get("sheet2_name", "")), cell_style)],
        [Paragraph("Key 列", cell_style), Paragraph(", ".join(data.get("key_columns", [])), cell_style)],
        [Paragraph("对比列(聚合)", cell_style), Paragraph(aggs_display, cell_style)],
    ]
    _add_table(story, config_data, col_widths=[100, 400])

    # Summary stats
    summary = data.get("summary", {})
    if summary:
        story.append(Paragraph("差异统计", heading_style))
        stats_data = [
            [
                Paragraph("<b>文件1行数</b>", header_style),
                Paragraph("<b>文件2行数</b>", header_style),
                Paragraph("<b>匹配</b>", header_style),
                Paragraph("<b>仅文件1</b>", header_style),
                Paragraph("<b>仅文件2</b>", header_style),
                Paragraph("<b>差异行</b>", header_style),
            ],
            [
                Paragraph(str(summary.get("total_rows_file1", 0)), cell_style),
                Paragraph(str(summary.get("total_rows_file2", 0)), cell_style),
                Paragraph(str(summary.get("matched", 0)), cell_style),
                Paragraph(str(summary.get("only_in_file1", 0)), cell_style),
                Paragraph(str(summary.get("only_in_file2", 0)), cell_style),
                Paragraph(str(summary.get("rows_with_differences", 0)), cell_style),
            ],
        ]
        _add_table(story, stats_data, col_widths=[85, 85, 70, 70, 70, 70])

    # Duplicate warning
    dup_warning = data.get("duplicate_warning")
    if dup_warning:
        story.append(
            Paragraph(
                f"⚠ {dup_warning}",
                ParagraphStyle(
                    "Warning",
                    parent=normal_style,
                    textColor=colors.HexColor("#c67d08"),
                    fontSize=10,
                ),
            )
        )

    # Differences detail table
    differences = data.get("differences", [])
    key_columns = data.get("key_columns", [])
    if differences:
        story.append(Paragraph(f"差异行详情 (共 {len(differences)} 行)", heading_style))

        # Build header
        headers = [Paragraph(f"<b>{k}</b>", header_style) for k in key_columns]
        headers += [
            Paragraph("<b>差异列</b>", header_style),
            Paragraph("<b>文件1的值</b>", header_style),
            Paragraph("<b>文件2的值</b>", header_style),
        ]
        table_data = [headers]

        # Limit to 200 cell diffs to avoid huge PDFs
        count = 0
        for row in differences[:200]:
            for diff in row.get("diffs", []):
                if count >= 500:
                    break
                k_vals = [Paragraph(str(row.get("key", {}).get(k, "")), cell_style) for k in key_columns]
                v1 = _fmt_val(diff.get("file1_value"))
                v2 = _fmt_val(diff.get("file2_value"))
                row_data = k_vals + [
                    Paragraph(f"<b>{diff.get('column', '')}</b>", cell_style),
                    Paragraph(f'<font color="#cb2431">{v1}</font>', cell_style),
                    Paragraph(f'<font color="#22863a">{v2}</font>', cell_style),
                ]
                table_data.append(row_data)
                count += 1

        col_w = [80] * len(key_columns) + [80, 140, 140]
        _add_table(story, table_data, col_widths=col_w, repeat_rows=1)

        if len(differences) > 200:
            story.append(Paragraph(f"... 仅显示前200行 (共{len(differences)}行差异)", normal_style))

    # Only-in-file1
    only1 = data.get("only_in_file1", [])
    if only1:
        story.append(Paragraph(f"仅在文件1中的行 (共 {len(only1)} 行)", heading_style))
        _build_only_table(story, only1, key_columns, data.get("compare_columns", []),
                          header_style, cell_style)

    # Only-in-file2
    only2 = data.get("only_in_file2", [])
    if only2:
        story.append(Paragraph(f"仅在文件2中的行 (共 {len(only2)} 行)", heading_style))
        _build_only_table(story, only2, key_columns, data.get("compare_columns", []),
                          header_style, cell_style)


def _build_only_table(
    story: list,
    rows: list[dict[str, Any]],
    key_columns: list[str],
    compare_columns: list[str],
    header_style: ParagraphStyle,
    cell_style: ParagraphStyle,
) -> None:
    """Build a table for rows that exist only in one file."""
    all_cols = key_columns + compare_columns
    headers = [Paragraph(f"<b>{c}</b>", header_style) for c in all_cols]
    table_data = [headers]

    for row in rows[:100]:
        table_data.append([
            Paragraph(_fmt_val(row.get(c, "")), cell_style)
            for c in all_cols
        ])

    col_w = [80] * len(all_cols)
    _add_table(story, table_data, col_widths=col_w)

    if len(rows) > 100:
        story.append(
            Paragraph(f"... 仅显示前100行 (共{len(rows)}行)", cell_style)
        )


def _add_table(
    story: list,
    data: list[list],
    col_widths: list[int] | None = None,
    repeat_rows: int = 1,
) -> None:
    """Add a styled table to the story."""
    t = Table(data, colWidths=col_widths, repeatRows=repeat_rows)
    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, repeat_rows - 1), colors.HexColor("#4a90d9")),
        ("TEXTCOLOR", (0, 0), (-1, repeat_rows - 1), colors.white),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#dddddd")),
        ("ROWBACKGROUNDS", (0, repeat_rows), (-1, -1), [colors.white, colors.HexColor("#f7f9fc")]),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]
    t.setStyle(TableStyle(style_cmds))
    story.append(t)
    story.append(Spacer(1, 6))


def _fmt_val(val: Any) -> str:
    """Format a value for safe display in PDF."""
    if val is None:
        return "(空)"
    s = str(val)
    if len(s) > 80:
        s = s[:77] + "..."
    return s
