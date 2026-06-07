import { useMemo } from 'react';
import { Card, Table, Tabs, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ExcelCompareResult, RowDiff } from '../../types';
import { AGG_METHOD_LABELS } from '../../types';

const { Text } = Typography;

interface ExcelDiffTableProps {
  result: ExcelCompareResult;
}

export default function ExcelDiffTable({ result }: ExcelDiffTableProps) {
  const colNameDiffer = result.columns_differ;

  // Build columns for diff table
  const diffColumns: ColumnsType<Record<string, unknown>> = useMemo(() => {
    const cols: ColumnsType<Record<string, unknown>> = [];

    cols.push({
      title: 'Key',
      dataIndex: '_key_display',
      key: '_key_display',
      fixed: 'left' as const,
      width: 180,
      ellipsis: true,
      render: (val: string) => (
        <Text code style={{ fontSize: 12 }}>{val}</Text>
      ),
    });

    // When columns differ, show both names
    if (colNameDiffer) {
      cols.push({
        title: '文件1列',
        dataIndex: '_diff_column',
        key: '_diff_column',
        width: 120,
        render: (val: string) => (
          <Text strong style={{ color: '#1677ff' }}>{val}</Text>
        ),
      });
      cols.push({
        title: '文件2列',
        dataIndex: '_col2',
        key: '_col2',
        width: 120,
        render: (val: string) =>
          val ? <Text style={{ color: '#52c41a' }}>{val}</Text> : <Text type="secondary">(同)</Text>,
      });
    } else {
      cols.push({
        title: '差异列',
        dataIndex: '_diff_column',
        key: '_diff_column',
        width: 120,
        render: (val: string) => (
          <Text strong style={{ color: '#fa8c16' }}>{val}</Text>
        ),
      });
    }

    cols.push({
      title: '聚合方式',
      dataIndex: '_diff_method',
      key: '_diff_method',
      width: 110,
      render: (val: string) => (
        <Tag color="purple">
          {AGG_METHOD_LABELS[val as keyof typeof AGG_METHOD_LABELS] ?? val}
        </Tag>
      ),
    });
    cols.push({
      title: '文件1 的值',
      dataIndex: '_file1_val',
      key: '_file1_val',
      width: 180,
      render: (val: unknown) => (
        <Text delete style={{ color: '#cf1322', background: '#fff2f0',
          padding: '2px 6px', borderRadius: 3 }}>
          {String(val ?? '(空)')}
        </Text>
      ),
    });
    cols.push({
      title: '文件2 的值',
      dataIndex: '_file2_val',
      key: '_file2_val',
      width: 180,
      render: (val: unknown) => (
        <Text style={{ color: '#3f8600', background: '#f6ffed',
          padding: '2px 6px', borderRadius: 3 }}>
          {String(val ?? '(空)')}
        </Text>
      ),
    });

    return cols;
  }, [colNameDiffer]);

  // Flatten diff rows
  const diffData = useMemo(() => {
    return result.differences.flatMap((row: RowDiff, rowIdx: number) =>
      row.diffs.map((diff, diffIdx) => ({
        _row_key: rowIdx,
        _diff_key: `${rowIdx}-${diffIdx}`,
        _key_display: row.key_display,
        _diff_column: diff.column,
        _col2: diff.column2,
        _diff_method: diff.method,
        _file1_val: diff.file1_value,
        _file2_val: diff.file2_value,
      })),
    );
  }, [result.differences]);

  // Build columns for only-in-file tables
  const rowColumns: ColumnsType<Record<string, unknown>> = useMemo(() => {
    const cols: ColumnsType<Record<string, unknown>> = [];

    // Key columns — show mapping info when names differ
    result.key_mapping.forEach((km) => {
      const title = colNameDiffer && km.col1 !== km.col2
        ? `${km.col1} → ${km.col2}`
        : km.col1;
      cols.push({
        title: <span>{title} <Tag color="blue" style={{ fontSize: 10 }}>Key</Tag></span>,
        dataIndex: km.col1,
        key: km.col1,
        width: 130,
        ellipsis: true,
      });
    });

    // Compare columns
    result.column_agg_mapping.forEach((cm) => {
      const title = colNameDiffer && cm.col1 !== cm.col2
        ? `${cm.col1} → ${cm.col2}`
        : cm.col1;
      cols.push({
        title: (
          <span>
            {title}
            <Tag color="purple" style={{ fontSize: 10, marginLeft: 4 }}>
              {AGG_METHOD_LABELS[cm.method]}
            </Tag>
          </span>
        ),
        dataIndex: cm.col1,
        key: cm.col1,
        width: 150,
        ellipsis: true,
      });
    });

    return cols;
  }, [result.key_mapping, result.column_agg_mapping, colNameDiffer]);

  const tabItems = [
    {
      key: 'differences',
      label: (
        <span>
          差异分组 <Tag color="warning" style={{ marginLeft: 4 }}>{result.differences.length}</Tag>
        </span>
      ),
      children: (
        <>
          {result.duplicate_warning && (
            <Text type="warning" style={{ display: 'block', marginBottom: 12 }}>
              ⚠ {result.duplicate_warning}
            </Text>
          )}
          {diffData.length === 0 ? (
            <Text type="secondary">没有差异 — 完全一致 ✓</Text>
          ) : (
            <Table columns={diffColumns} dataSource={diffData} rowKey="_diff_key"
              size="small" bordered scroll={{ x: 'max-content' }}
              pagination={{ pageSize: 50, showSizeChanger: true,
                showTotal: (total) => `共 ${total} 个差异单元格` }} />
          )}
        </>
      ),
    },
    {
      key: 'only_in_file1',
      label: (
        <span>
          仅在文件1 <Tag color="red" style={{ marginLeft: 4 }}>{result.only_in_file1.length}</Tag>
        </span>
      ),
      children: (
        <Table columns={rowColumns}
          dataSource={result.only_in_file1.map((row, i) => ({ ...row, _key: `f1-${i}` }))}
          rowKey="_key" size="small" bordered scroll={{ x: 'max-content' }}
          pagination={{ pageSize: 50, showSizeChanger: true }} />
      ),
    },
    {
      key: 'only_in_file2',
      label: (
        <span>
          仅在文件2 <Tag color="green" style={{ marginLeft: 4 }}>{result.only_in_file2.length}</Tag>
        </span>
      ),
      children: (
        <Table columns={rowColumns}
          dataSource={result.only_in_file2.map((row, i) => ({ ...row, _key: `f2-${i}` }))}
          rowKey="_key" size="small" bordered scroll={{ x: 'max-content' }}
          pagination={{ pageSize: 50, showSizeChanger: true }} />
      ),
    },
  ];

  return (
    <Card title="差异详情" styles={{ body: { padding: 12 } }}>
      <Tabs items={tabItems} />
    </Card>
  );
}
