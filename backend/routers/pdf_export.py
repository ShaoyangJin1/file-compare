"""PDF export API routes."""

from fastapi import APIRouter
from fastapi.responses import Response

from models.common import PdfExportRequest, ErrorResponse
from services.pdf_generator import generate_pdf

router = APIRouter(prefix="/api/pdf", tags=["pdf"])


@router.post(
    "/export",
    responses={
        200: {
            "content": {"application/pdf": {}},
            "description": "PDF file",
        },
        400: {"model": ErrorResponse},
    },
)
async def export_pdf(request: PdfExportRequest):
    """Generate a PDF report from comparison result data.

    The request body should contain the comparison type ('text' or 'excel'),
    the comparison result data, and optional formatting options.
    """
    try:
        pdf_bytes = generate_pdf(
            compare_type=request.type,
            data=request.data,
            title=request.options.title,
        )

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=comparison_report.pdf",
                "Content-Length": str(len(pdf_bytes)),
            },
        )

    except Exception as e:
        return ErrorResponse(
            detail=f"PDF生成失败: {str(e)}",
            error_code="PDF_ERROR",
        )
