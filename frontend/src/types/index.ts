// ====== Text Compare Types ======

export interface TextCompareStats {
  added: number;
  deleted: number;
  changed: number;
  unchanged: number;
  total_diffs: number;
}

export interface TextCompareResult {
  file1_name: string;
  file2_name: string;
  encoding: string;
  file1_lines: number;
  file2_lines: number;
  unified_diff: string;
  side_by_side_html: string;
  stats: TextCompareStats;
}

// ====== Excel Compare Types ======

export type AggMethod =
  | 'count' | 'count_distinct' | 'sum' | 'avg'
  | 'min' | 'max' | 'first' | 'last' | 'concat';

export const AGG_METHOD_LABELS: Record<AggMethod, string> = {
  count: '计数', count_distinct: '非重复计数', sum: '求和',
  avg: '平均值', min: '最小值', max: '最大值',
  first: '第一条', last: '最后一条', concat: '拼接去重',
};

// ==== Column mapping (supports different column names per file) ====

export interface KeyMapping {
  col1: string;  // file1 column name
  col2: string;  // file2 column name (may differ from col1)
}

export interface ColumnAggMapping {
  col1: string;
  col2: string;
  method: AggMethod;
}

// Legacy unified format (col1 === col2 implied)
export interface ColumnAggConfig {
  column: string;
  method: AggMethod;
}

// ==== Sheet info ====

export interface SheetInfo {
  name: string;
  columns: string[];
  row_count: number;
}

export interface FileSheetsInfo {
  name: string;
  path: string;
  sheets: SheetInfo[];
}

export interface ExcelInfoResponse {
  session_id: string;
  file1: FileSheetsInfo;
  file2: FileSheetsInfo;
}

// ==== Request / Response ====

export interface ExcelCompareRequest {
  session_id: string;
  sheet1_name: string;
  sheet2_name: string;
  // Unified mode (columns same)
  key_columns: string[];
  column_aggs: ColumnAggConfig[];
  // Mapped mode (columns differ)
  key_mapping: KeyMapping[];
  column_agg_mapping: ColumnAggMapping[];
  // Legacy
  compare_columns: string[];
  ignore_columns: string[];
}

export interface CellDiff {
  column: string;
  column2: string;
  method: string;
  file1_value: unknown;
  file2_value: unknown;
}

export interface RowDiff {
  key: Record<string, unknown>;
  key_display: string;
  diffs: CellDiff[];
}

export interface ExcelCompareSummary {
  total_rows_file1: number;
  total_rows_file2: number;
  groups_file1: number;
  groups_file2: number;
  matched: number;
  only_in_file1: number;
  only_in_file2: number;
  rows_with_differences: number;
  duplicate_keys_file1: number;
  duplicate_keys_file2: number;
}

export interface ExcelCompareResult {
  summary: ExcelCompareSummary;
  sheet1_name: string;
  sheet2_name: string;
  key_mapping: KeyMapping[];
  column_agg_mapping: ColumnAggMapping[];
  key_columns: string[];
  column_aggs: ColumnAggConfig[];
  only_in_file1: Record<string, unknown>[];
  only_in_file2: Record<string, unknown>[];
  differences: RowDiff[];
  duplicate_warning: string | null;
  columns_differ: boolean;
}

// ====== PDF Export Types ======

export interface PdfExportOptions {
  title: string;
  include_summary: boolean;
  include_details: boolean;
}

export interface PdfExportRequest {
  type: 'text' | 'excel';
  data: Record<string, unknown>;
  options: PdfExportOptions;
}
