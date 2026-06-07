"""Common Pydantic models shared across the application."""

from pydantic import BaseModel, Field


class FileInfo(BaseModel):
    """Info about an uploaded file."""
    name: str
    path: str
    size: int


class ErrorResponse(BaseModel):
    """Standard error response."""
    detail: str
    error_code: str | None = None


class PdfExportOptions(BaseModel):
    """Options for PDF export."""
    title: str = "对比报告"
    include_summary: bool = True
    include_details: bool = True


class PdfExportRequest(BaseModel):
    """Request to export comparison results as PDF."""
    type: str = Field(..., description="'text' or 'excel'")
    data: dict = Field(..., description="Comparison result data")
    options: PdfExportOptions = Field(default_factory=PdfExportOptions)
