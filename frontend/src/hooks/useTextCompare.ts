import { useState, useCallback } from 'react';
import { compareTextFiles } from '../api/client';
import type { TextCompareResult } from '../types';

export function useTextCompare() {
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [encoding, setEncoding] = useState('auto');
  const [result, setResult] = useState<TextCompareResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runCompare = useCallback(async () => {
    if (!file1 || !file2) {
      setError('请上传两个文件');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await compareTextFiles(file1, file2, encoding);
      setResult(data);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : '对比失败，请重试';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [file1, file2, encoding]);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  const resetAll = useCallback(() => {
    setFile1(null);
    setFile2(null);
    setEncoding('auto');
    setResult(null);
    setError(null);
  }, []);

  return {
    file1,
    file2,
    encoding,
    result,
    loading,
    error,
    setFile1,
    setFile2,
    setEncoding,
    runCompare,
    clearResult,
    resetAll,
  };
}
