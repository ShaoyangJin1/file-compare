"""Excel diff service — group-by aggregation + column mapping support."""

import math
from typing import Any

import pandas as pd
import numpy as np

from models.excel_models import (
    SheetInfo,
    FileSheetsInfo,
    AggMethod,
    KeyMapping,
    ColumnAggMapping,
    ColumnAggConfig,
    ExcelCompareResult,
    ExcelCompareSummary,
    RowDiff,
    CellDiff,
)


NUMERIC_TOLERANCE = 1e-9


def _concat_distinct(series: pd.Series) -> str:
    """Concatenate distinct non-null values."""
    vals = series.dropna().unique()
    return ", ".join(str(v) for v in vals)


_AGG_FUNCS: dict[AggMethod, Any] = {
    AggMethod.COUNT: "count",
    AggMethod.COUNT_DISTINCT: "nunique",
    AggMethod.SUM: "sum",
    AggMethod.AVG: "mean",
    AggMethod.MIN: "min",
    AggMethod.MAX: "max",
    AggMethod.FIRST: "first",
    AggMethod.LAST: "last",
    AggMethod.CONCAT: _concat_distinct,
}


def _make_agg_dict(mappings: list[ColumnAggMapping]) -> dict[str, Any]:
    """Build agg dict using file1 column names (after renaming file2)."""
    agg_dict: dict[str, Any] = {}
    for m in mappings:
        if m.method == AggMethod.CONCAT:
            agg_dict[m.col1] = _concat_distinct
        else:
            agg_dict[m.col1] = _AGG_FUNCS[m.method]
    return agg_dict


# ====== Public API ======


def get_excel_info(file_path: str, file_name: str) -> FileSheetsInfo:
    """Extract sheet names and column info from an Excel file."""
    if file_path.endswith(".csv"):
        df = pd.read_csv(file_path)
        sheets = {"Sheet1": df}
    else:
        sheets = pd.read_excel(file_path, sheet_name=None, engine=None)

    sheet_infos = []
    for sheet_name, df in sheets.items():
        columns = [str(c) for c in df.columns.tolist()]
        sheet_infos.append(
            SheetInfo(name=str(sheet_name), columns=columns, row_count=len(df))
        )
    return FileSheetsInfo(name=file_name, path=file_path, sheets=sheet_infos)


def read_excel_sheet(file_path: str, sheet_name: str) -> pd.DataFrame:
    """Read a specific sheet from an Excel file."""
    if file_path.endswith(".csv"):
        df = pd.read_csv(file_path)
    else:
        df = pd.read_excel(file_path, sheet_name=sheet_name)
    df.columns = [str(c) for c in df.columns]
    return df


def compare_excel(
    file1_path: str,
    file2_path: str,
    sheet1_name: str,
    sheet2_name: str,
    key_mapping: list[KeyMapping],
    column_agg_mapping: list[ColumnAggMapping],
    ignore_columns: list[str] | None = None,
) -> ExcelCompareResult:
    """Compare two Excel files with column-name mapping support.

    When column names differ between files, file2 columns are renamed to
    match file1 before processing. The result reports using file1 names
    as the canonical names, with file2 names recorded in column2 fields.
    """
    if ignore_columns is None:
        ignore_columns = []

    # === Read data ===
    df1 = read_excel_sheet(file1_path, sheet1_name)
    df2 = read_excel_sheet(file2_path, sheet2_name)

    # Validate source columns exist
    key_cols1 = [m.col1 for m in key_mapping]
    key_cols2 = [m.col2 for m in key_mapping]
    compare_cols1 = [m.col1 for m in column_agg_mapping]
    compare_cols2 = [m.col2 for m in column_agg_mapping]

    _validate_columns(df1, key_cols1 + compare_cols1, "文件1")
    _validate_columns(df2, key_cols2 + compare_cols2, "文件2")

    # === Check if columns differ ===
    columns_differ = any(
        m.col1 != m.col2 for m in key_mapping + column_agg_mapping
    )

    # === Rename file2 columns to match file1 ===
    rename_map: dict[str, str] = {}
    for m in key_mapping:
        if m.col2 != m.col1:
            rename_map[m.col2] = m.col1
    for m in column_agg_mapping:
        if m.col2 != m.col1:
            rename_map[m.col2] = m.col1

    if rename_map:
        df2 = df2.rename(columns=rename_map)

    # After renaming, we work with file1 column names only
    canonical_keys = key_cols1
    canonical_compares = compare_cols1

    # === Group and aggregate ===
    agg_dict = _make_agg_dict(column_agg_mapping)

    grouped1 = (
        df1[canonical_keys + canonical_compares]
        .groupby(canonical_keys, dropna=False)
        .agg(agg_dict)
    )
    grouped2 = (
        df2[canonical_keys + canonical_compares]
        .groupby(canonical_keys, dropna=False)
        .agg(agg_dict)
    )

    grouped1 = grouped1.reset_index()
    grouped2 = grouped2.reset_index()

    if isinstance(grouped1.columns, pd.MultiIndex):
        grouped1.columns = ["_".join(c).strip("_") for c in grouped1.columns]
    if isinstance(grouped2.columns, pd.MultiIndex):
        grouped2.columns = ["_".join(c).strip("_") for c in grouped2.columns]

    # === Display key ===
    grouped1["_key_display"] = _make_key_display(grouped1, canonical_keys)
    grouped2["_key_display"] = _make_key_display(grouped2, canonical_keys)

    # === Duplicates ===
    dup1 = int(grouped1.duplicated(subset=canonical_keys).sum())
    dup2 = int(grouped2.duplicated(subset=canonical_keys).sum())
    dup_warning = _build_dup_warning(dup1, dup2)

    # === Merge ===
    merged = pd.merge(
        grouped1, grouped2,
        on=canonical_keys,
        how="outer",
        suffixes=("_file1", "_file2"),
        indicator=True,
    )

    only_file1_mask = merged["_merge"] == "left_only"
    only_file2_mask = merged["_merge"] == "right_only"
    both_mask = merged["_merge"] == "both"

    # === Extract results using mappings (for col2 display names) ===
    col2_map = {m.col1: m.col2 for m in column_agg_mapping}

    only_in_file1 = _extract_group_rows(
        merged[only_file1_mask], key_mapping, column_agg_mapping, "_file1",
    )
    only_in_file2 = _extract_group_rows(
        merged[only_file2_mask], key_mapping, column_agg_mapping, "_file2",
    )
    differences = _find_group_differences(
        merged[both_mask], key_mapping, column_agg_mapping,
    )

    summary = ExcelCompareSummary(
        total_rows_file1=len(df1),
        total_rows_file2=len(df2),
        groups_file1=len(grouped1),
        groups_file2=len(grouped2),
        matched=int(both_mask.sum()),
        only_in_file1=int(only_file1_mask.sum()),
        only_in_file2=int(only_file2_mask.sum()),
        rows_with_differences=len(differences),
        duplicate_keys_file1=dup1,
        duplicate_keys_file2=dup2,
    )

    # Build legacy-compatible fields
    legacy_keys = [m.col1 for m in key_mapping]
    legacy_aggs = [
        ColumnAggConfig(column=m.col1, method=m.method)
        for m in column_agg_mapping
    ]

    return ExcelCompareResult(
        summary=summary,
        sheet1_name=sheet1_name,
        sheet2_name=sheet2_name,
        key_mapping=key_mapping,
        column_agg_mapping=column_agg_mapping,
        key_columns=legacy_keys,
        column_aggs=legacy_aggs,
        only_in_file1=only_in_file1,
        only_in_file2=only_in_file2,
        differences=differences,
        duplicate_warning=dup_warning,
        columns_differ=columns_differ,
    )


# ====== Internal helpers ======


def _validate_columns(df: pd.DataFrame, required: list[str], label: str) -> None:
    existing = set(df.columns)
    missing = [c for c in required if c not in existing]
    if missing:
        raise ValueError(f"{label}中缺少列: {', '.join(missing)}")


def _make_key_display(df: pd.DataFrame, key_columns: list[str]) -> pd.Series:
    if len(key_columns) == 1:
        return df[key_columns[0]].astype(str)
    parts = df[key_columns[0]].astype(str)
    for col in key_columns[1:]:
        parts = parts + " | " + df[col].astype(str)
    return parts


def _build_dup_warning(dup1: int, dup2: int) -> str | None:
    parts = []
    if dup1 > 0:
        parts.append(f"文件1中有 {dup1} 个重复Key组")
    if dup2 > 0:
        parts.append(f"文件2中有 {dup2} 个重复Key组")
    return "; ".join(parts) if parts else None


def _extract_group_rows(
    df: pd.DataFrame,
    key_mapping: list[KeyMapping],
    column_agg_mapping: list[ColumnAggMapping],
    suffix: str,
) -> list[dict[str, object]]:
    """Extract aggregated rows that exist only in one file."""
    rows = []
    for _, row in df.iterrows():
        entry: dict[str, object] = {}
        # Key values
        for km in key_mapping:
            entry[km.col1] = _safe_value(row.get(km.col1))
            if km.col1 != km.col2:
                entry[f"_{km.col1}_col2"] = km.col2
        entry["_key_display"] = _safe_value(row.get(f"_key_display{suffix}"))
        # Compare column values
        for cm in column_agg_mapping:
            entry[cm.col1] = _safe_value(row.get(f"{cm.col1}{suffix}"))
            entry[f"_{cm.col1}_method"] = cm.method.value
            if cm.col1 != cm.col2:
                entry[f"_{cm.col1}_col2"] = cm.col2
        rows.append(entry)
    return rows


def _find_group_differences(
    df: pd.DataFrame,
    key_mapping: list[KeyMapping],
    column_agg_mapping: list[ColumnAggMapping],
) -> list[RowDiff]:
    """Find differences in matched groups, recording col2 names."""
    differences = []

    for _, row in df.iterrows():
        diffs: list[CellDiff] = []

        for cm in column_agg_mapping:
            v1 = row.get(f"{cm.col1}_file1")
            v2 = row.get(f"{cm.col1}_file2")

            if not _values_equal(v1, v2):
                diffs.append(
                    CellDiff(
                        column=cm.col1,
                        column2=cm.col2 if cm.col2 != cm.col1 else "",
                        method=cm.method.value,
                        file1_value=_safe_value(v1),
                        file2_value=_safe_value(v2),
                    )
                )

        if diffs:
            key = {km.col1: _safe_value(row.get(km.col1)) for km in key_mapping}
            key_display = _safe_value(
                row.get("_key_display_file1", row.get("_key_display_file2"))
            ) or ""
            differences.append(
                RowDiff(key=key, key_display=str(key_display), diffs=diffs)
            )

    return differences


def _values_equal(v1: Any, v2: Any) -> bool:
    if pd.isna(v1) and pd.isna(v2):
        return True
    if pd.isna(v1) or pd.isna(v2):
        return False
    if isinstance(v1, (int, float, np.floating, np.integer)) and isinstance(
        v2, (int, float, np.floating, np.integer)
    ):
        f1, f2 = float(v1), float(v2)
        if math.isfinite(f1) and math.isfinite(f2):
            return abs(f1 - f2) < NUMERIC_TOLERANCE
        return False
    return str(v1).strip() == str(v2).strip()


def _safe_value(val: Any) -> object:
    if pd.isna(val):
        return None
    if isinstance(val, (pd.Timestamp,)):
        return val.isoformat()
    if isinstance(val, (np.floating,)):
        fv = float(val)
        if math.isfinite(fv):
            return round(fv, 6)
        return str(val)
    if isinstance(val, (np.integer,)):
        return int(val)
    if isinstance(val, (int, float)):
        if math.isfinite(val):
            if isinstance(val, float):
                return round(val, 6)
            return val
        return str(val)
    return str(val)
