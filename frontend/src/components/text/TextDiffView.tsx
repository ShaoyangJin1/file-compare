import { useEffect, useRef, useState, useMemo } from 'react';
import { Segmented, Card, Typography } from 'antd';
import { html } from 'diff2html';
import 'diff2html/bundles/css/diff2html.min.css';
import type { TextCompareResult } from '../../types';

const { Text } = Typography;

type ViewMode = 'side-by-side' | 'line-by-line';

interface TextDiffViewProps {
  result: TextCompareResult;
}

export default function TextDiffView({ result }: TextDiffViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('side-by-side');

  const diffHtml = useMemo(() => {
    if (!result.unified_diff) return '';
    return html(result.unified_diff, {
      outputFormat: viewMode,
      drawFileList: false,
      matching: 'lines',
    });
  }, [result.unified_diff, viewMode]);

  useEffect(() => {
    if (!containerRef.current || !diffHtml) return;
    containerRef.current.innerHTML = diffHtml;
  }, [diffHtml]);

  return (
    <Card
      title="对比结果"
      extra={
        <Segmented
          options={['side-by-side', 'line-by-line']}
          value={viewMode}
          onChange={(val) => setViewMode(val as ViewMode)}
        />
      }
      styles={{ body: { padding: 0 } }}
    >
      <div style={{ padding: '12px 16px', background: '#fafafa' }}>
        <Text type="secondary">
          编码: {result.encoding} &nbsp;|&nbsp;
          文件1: {result.file1_lines} 行 &nbsp;|&nbsp;
          文件2: {result.file2_lines} 行 &nbsp;|&nbsp;
          新增 {result.stats.added} &nbsp;
          删除 {result.stats.deleted} &nbsp;
          修改 {result.stats.changed} &nbsp;
          未变更 {result.stats.unchanged}
        </Text>
      </div>
      <div
        ref={containerRef}
        style={{ maxHeight: 'calc(100vh - 340px)', overflow: 'auto' }}
      />
    </Card>
  );
}
