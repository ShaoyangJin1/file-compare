import { useState, useCallback, useMemo } from 'react';
import { getExcelInfo, compareExcelFiles } from '../api/client';
import type {
  ExcelInfoResponse, ExcelCompareResult,
  SheetInfo, KeyMapping, ColumnAggMapping, AggMethod,
} from '../types';

/**
 * Check if the two files have consistent column names.
 * Returns true if at least one column is shared, suggesting same schema.
 */
export function columnsAreConsistent(
  cols1: string[],
  cols2: string[],
): boolean {
  if (cols1.length === 0 || cols2.length === 0) return true;
  const set1 = new Set(cols1);
  const set2 = new Set(cols2);
  const intersection = cols1.filter((c) => set2.has(c));
  // Consistent if >=50% of file1 columns are also in file2 (or all match)
  return intersection.length >= Math.min(cols1.length, cols2.length) * 0.5;
}

export function useExcelCompare() {
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [info, setInfo] = useState<ExcelInfoResponse | null>(null);
  const [sheet1Name, setSheet1Name] = useState<string>('');
  const [sheet2Name, setSheet2Name] = useState<string>('');
  // Mapping format (always used internally)
  const [keyMapping, setKeyMapping] = useState<KeyMapping[]>([]);
  const [columnAggMapping, setColumnAggMapping] = useState<ColumnAggMapping[]>([]);
  const [result, setResult] = useState<ExcelCompareResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Must be defined BEFORE consistent useMemo (temporal dead zone)
  const getSheet1 = useCallback((): SheetInfo | undefined => {
    if (!info) return undefined;
    return info.file1.sheets.find((s) => s.name === sheet1Name);
  }, [info, sheet1Name]);

  const getSheet2 = useCallback((): SheetInfo | undefined => {
    if (!info) return undefined;
    return info.file2.sheets.find((s) => s.name === sheet2Name);
  }, [info, sheet2Name]);

  // Derived: are column names consistent between the selected sheets?
  const consistent = useMemo(() => {
    const s1 = getSheet1();
    const s2 = getSheet2();
    if (!s1 || !s2) return true;
    return columnsAreConsistent(s1.columns, s2.columns);
  }, [getSheet1, getSheet2]);

  const fetchSheetInfo = useCallback(async () => {
    if (!file1 || !file2) { setError('请上传两个Excel文件'); return; }
    setLoading(true); setError(null);
    try {
      const data = await getExcelInfo(file1, file2);
      setInfo(data);
      if (data.file1.sheets.length > 0) {
        const s1 = data.file1.sheets[0];
        const s2 = data.file2.sheets[0];
        setSheet1Name(s1.name);
        setSheet2Name(s2.name);

        const cols1 = s1.columns;
        const cols2 = s2.columns;
        const consistent = columnsAreConsistent(cols1, cols2);

        if (consistent) {
          // Unified mode: find common columns
          const common = cols1.filter((c) => cols2.includes(c));
          if (common.length > 0) {
            setKeyMapping([{ col1: common[0], col2: common[0] }]);
            const rest = common.slice(1).length > 0 ? common.slice(1) : common;
            setColumnAggMapping(rest.map((c) => ({ col1: c, col2: c, method: 'first' as AggMethod })));
          }
        } else {
          // Mapped mode: default first columns as key pair, rest as compare
          if (cols1.length > 0 && cols2.length > 0) {
            setKeyMapping([{ col1: cols1[0], col2: cols2[0] }]);
            const maxLen = Math.max(cols1.length, cols2.length);
            const mappings: ColumnAggMapping[] = [];
            for (let i = 1; i < maxLen; i++) {
              const c1 = cols1[i] ?? '';
              const c2 = cols2[i] ?? '';
              if (c1 || c2) {
                mappings.push({ col1: c1 || c2, col2: c2 || c1, method: 'first' as AggMethod });
              }
            }
            setColumnAggMapping(mappings);
          }
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '读取Excel失败');
    } finally { setLoading(false); }
  }, [file1, file2]);

  const runCompare = useCallback(async () => {
    if (!info || !sheet1Name || !sheet2Name || keyMapping.length === 0 || columnAggMapping.length === 0) {
      setError('请选择Sheet、Key列和对比列'); return;
    }
    setLoading(true); setError(null);
    try {
      const data = await compareExcelFiles({
        session_id: info.session_id,
        sheet1_name: sheet1Name,
        sheet2_name: sheet2Name,
        key_columns: [],
        column_aggs: [],
        key_mapping: keyMapping,
        column_agg_mapping: columnAggMapping,
        compare_columns: [],
        ignore_columns: [],
      });
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Excel对比失败');
    } finally { setLoading(false); }
  }, [info, sheet1Name, sheet2Name, keyMapping, columnAggMapping]);

  const clearResult = useCallback(() => { setResult(null); setError(null); }, []);
  const resetAll = useCallback(() => {
    setFile1(null); setFile2(null); setInfo(null);
    setSheet1Name(''); setSheet2Name('');
    setKeyMapping([]); setColumnAggMapping([]);
    setResult(null); setError(null);
  }, []);

  const keyColumns1 = useMemo(() => keyMapping.map((m) => m.col1), [keyMapping]);
  const keyColumns2 = useMemo(() => keyMapping.map((m) => m.col2), [keyMapping]);

  return {
    file1, file2, info,
    sheet1Name, sheet2Name,
    keyMapping, columnAggMapping,
    consistent,  // whether columns are consistent between files
    result, loading, error,
    setFile1, setFile2,
    setSheet1Name, setSheet2Name,
    setKeyMapping, setColumnAggMapping,
    fetchSheetInfo, runCompare, clearResult, resetAll,
    getSheet1, getSheet2,
    keyColumns1, keyColumns2,
  };
}
