import { useState } from 'react';
import { Button, message } from 'antd';
import { FilePdfOutlined, LoadingOutlined } from '@ant-design/icons';
import { saveAs } from 'file-saver';
import { exportPdf } from '../../api/client';
import type { PdfExportRequest } from '../../types';

interface PdfExportButtonProps {
  compareType: 'text' | 'excel';
  data: Record<string, unknown>;
  disabled?: boolean;
  title?: string;
}

export default function PdfExportButton({
  compareType,
  data,
  disabled = false,
  title = '对比报告',
}: PdfExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const request: PdfExportRequest = {
        type: compareType,
        data,
        options: {
          title,
          include_summary: true,
          include_details: true,
        },
      };

      const blob = await exportPdf(request);
      const filename = `comparison_report_${Date.now()}.pdf`;
      saveAs(blob, filename);
      message.success('PDF 报告已下载');
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'PDF导出失败';
      message.error(msg);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      type="primary"
      icon={
        exporting ? <LoadingOutlined /> : <FilePdfOutlined />
      }
      onClick={handleExport}
      disabled={disabled || exporting}
      loading={exporting}
      size="large"
    >
      {exporting ? '正在生成 PDF...' : '导出 PDF 报告'}
    </Button>
  );
}
