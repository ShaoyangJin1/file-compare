import axios from 'axios';
import type {
  TextCompareResult,
  ExcelInfoResponse,
  ExcelCompareRequest,
  ExcelCompareResult,
  PdfExportRequest,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
});

// ====== Text Compare ======

export async function compareTextFiles(
  file1: File,
  file2: File,
  encoding: string = 'auto',
): Promise<TextCompareResult> {
  const formData = new FormData();
  formData.append('file1', file1);
  formData.append('file2', file2);
  formData.append('encoding', encoding);

  const { data } = await api.post<TextCompareResult>(
    '/text/compare',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data;
}

// ====== Excel Compare ======

export async function getExcelInfo(
  file1: File,
  file2: File,
): Promise<ExcelInfoResponse> {
  const formData = new FormData();
  formData.append('file1', file1);
  formData.append('file2', file2);

  const { data } = await api.post<ExcelInfoResponse>(
    '/excel/info',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data;
}

export async function compareExcelFiles(
  request: ExcelCompareRequest,
): Promise<ExcelCompareResult> {
  const { data } = await api.post<ExcelCompareResult>(
    '/excel/compare',
    request,
  );
  return data;
}

// ====== PDF Export ======

export async function exportPdf(request: PdfExportRequest): Promise<Blob> {
  const { data } = await api.post<Blob>(
    '/pdf/export',
    request,
    { responseType: 'blob' },
  );
  return data;
}

export default api;
