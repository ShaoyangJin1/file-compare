"""Models for text comparison."""

from pydantic import BaseModel, Field


class TextCompareStats(BaseModel):
    """Statistics from a text comparison."""
    added: int = 0
    deleted: int = 0
    changed: int = 0
    unchanged: int = 0
    total_diffs: int = 0


class TextCompareResult(BaseModel):
    """Result of a text comparison."""
    file1_name: str
    file2_name: str
    encoding: str
    file1_lines: int
    file2_lines: int
    unified_diff: str          # Unified diff text for frontend rendering
    side_by_side_html: str     # Side-by-side HTML table (fallback)
    stats: TextCompareStats
