import { useEffect, useRef, useState } from 'react';
import { Segmented, Card, Typography } from 'antd';
import {
  Diff2HtmlUI,
  type Diff2HtmlUIConfig,
} from 'diff2html/lib/ui/js/diff2html-ui-base';
import 'diff2html/bundles/css/diff2html.min.css';
import type { TextCompareResult } from '../../types';

const { Text } = Typography;

const OUTPUT_FORMATS: Record<string, 'side-by-side' | 'line-by-line'> = {
  'Side-by-Side': 'side-by-side',
  'Line-by-Line': 'line-by-line',
};

interface TextDiffViewProps {
  result: TextCompareResult;
}

export default function TextDiffView({ result }: TextDiffViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] =
    useState<keyof typeof OUTPUT_FORMATS>('Side-by-Side');

  useEffect(() => {
    if (!containerRef.current || !result.unified_diff) return;

    // Clear previous content
    containerRef.current.innerHTML = '';

    const diff2htmlUi = new Diff2HtmlUI(
      containerRef.current,
      result.unified_diff,
      {
        outputFormat: OUTPUT_FORMATS[viewMode],
        drawFileList: false,
        matching: 'lines',
        highlight: true,
        fileListToggle: false,
      } as Diff2HtmlUIConfig,
    );
    diff2htmlUi.draw();
  }, [result.unified_diff, viewMode]);

  return (
    <Card
      title="对比结果"
      extra={
        <Segmented
          options={['Side-by-Side', 'Line-by-Line']}
          value={viewMode}
          onChange={(val) =>
            setViewMode(val as keyof typeof OUTPUT_FORMATS)
          }
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
