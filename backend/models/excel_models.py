"""Models for Excel comparison."""

from enum import Enum

from pydantic import BaseModel, Field, model_validator


class AggMethod(str, Enum):
    """Aggregation methods for compare columns."""
    COUNT = "count"
    COUNT_DISTINCT = "count_distinct"
    SUM = "sum"
    AVG = "avg"
    MIN = "min"
    MAX = "max"
    FIRST = "first"
    LAST = "last"
    CONCAT = "concat"


AGG_METHOD_LABELS: dict[str, str] = {
    "count": "计数",
    "count_distinct": "非重复计数",
    "sum": "求和",
    "avg": "平均值",
    "min": "最小值",
    "max": "最大值",
    "first": "第一条",
    "last": "最后一条",
    "concat": "拼接去重",
}


# ==== New: mapping models for when column names differ ====


class KeyMapping(BaseModel):
    """Maps one key column between file1 and file2."""
    col1: str  # column name in file 1
    col2: str  # column name in file 2


class ColumnAggMapping(BaseModel):
    """Maps a compare column between file1 and file2, with aggregation."""
    col1: str
    col2: str
    method: AggMethod = AggMethod.FIRST


# ==== Legacy: unified config (col name same in both files) ====


class ColumnAggConfig(BaseModel):
    """Unified configuration — column name is the same in both files."""
    column: str
    method: AggMethod = AggMethod.FIRST


# ==== Info / Metadata ====


class SheetInfo(BaseModel):
    """Information about a single sheet."""
    name: str
    columns: list[str]
    row_count: int


class FileSheetsInfo(BaseModel):
    """Sheet information for one Excel file."""
    name: str
    path: str
    sheets: list[SheetInfo]


class ExcelInfoResponse(BaseModel):
    """Response with sheet/column info for both files."""
    file1: FileSheetsInfo
    file2: FileSheetsInfo


# ==== Compare Request / Response ====


class ExcelCompareRequest(BaseModel):
    """Request to compare two Excel files.

    Supports two modes:
    1. Unified:  columns have same names → use key_columns + column_aggs
    2. Mapped:   columns have different names → use key_mapping + column_agg_mapping
    """
    session_id: str
    sheet1_name: str = "Sheet1"
    sheet2_name: str = "Sheet1"

    # Unified mode (column names identical)
    key_columns: list[str] = []
    column_aggs: list[ColumnAggConfig] = []

    # Mapped mode (column names differ between files)
    key_mapping: list[KeyMapping] = []
    column_agg_mapping: list[ColumnAggMapping] = []

    # Legacy
    compare_columns: list[str] = []
    ignore_columns: list[str] = []

    @model_validator(mode="after")
    def check_at_least_one_mode(self):
        has_unified = bool(self.key_columns)
        has_mapped = bool(self.key_mapping)
        if not has_unified and not has_mapped:
            raise ValueError("必须提供 key_columns 或 key_mapping 中的至少一种")
        return self


class CellDiff(BaseModel):
    """A single cell difference after aggregation."""
    column: str          # file1 column name (display name)
    column2: str = ""    # file2 column name (may differ)
    method: str
    file1_value: object
    file2_value: object


class RowDiff(BaseModel):
    """A row (key group) with differences."""
    key: dict[str, object]
    key_display: str
    diffs: list[CellDiff]


class ExcelCompareSummary(BaseModel):
    """Summary statistics for Excel comparison."""
    total_rows_file1: int
    total_rows_file2: int
    groups_file1: int = 0
    groups_file2: int = 0
    matched: int
    only_in_file1: int
    only_in_file2: int
    rows_with_differences: int
    duplicate_keys_file1: int = 0
    duplicate_keys_file2: int = 0


class ExcelCompareResult(BaseModel):
    """Full result of Excel comparison."""
    summary: ExcelCompareSummary
    sheet1_name: str
    sheet2_name: str
    # The effective mappings (normalized from request)
    key_mapping: list[KeyMapping]
    column_agg_mapping: list[ColumnAggMapping]
    # Legacy fields for backward compatibility
    key_columns: list[str] = []
    column_aggs: list[ColumnAggConfig] = []
    only_in_file1: list[dict[str, object]]
    only_in_file2: list[dict[str, object]]
    differences: list[RowDiff]
    duplicate_warning: str | None = None
    columns_differ: bool = False  # True if column names differed between files
