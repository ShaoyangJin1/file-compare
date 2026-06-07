import { Card, Select, Space, Typography, Alert, Row, Col, Tag, Button, Divider } from 'antd';
import { PlusOutlined, DeleteOutlined, SwapOutlined } from '@ant-design/icons';
import type { KeyMapping, ColumnAggMapping, AggMethod } from '../../types';
import { AGG_METHOD_LABELS } from '../../types';

const { Text } = Typography;

const AGG_OPTIONS: { value: AggMethod; label: string }[] =
  Object.entries(AGG_METHOD_LABELS).map(([value, label]) => ({
    value: value as AggMethod,
    label,
  }));

interface ExcelColumnSelectorProps {
  // Sheet selection
  file1Sheets: string[];
  file2Sheets: string[];
  sheet1Name: string;
  sheet2Name: string;
  onSheet1Change: (s: string) => void;
  onSheet2Change: (s: string) => void;
  // Column data
  file1Columns: string[];
  file2Columns: string[];
  // Whether column names are consistent
  consistent: boolean;
  // Mapping state
  keyMapping: KeyMapping[];
  columnAggMapping: ColumnAggMapping[];
  onKeyMappingChange: (m: KeyMapping[]) => void;
  onColumnAggMappingChange: (m: ColumnAggMapping[]) => void;
}

export default function ExcelColumnSelector({
  file1Sheets, file2Sheets,
  sheet1Name, sheet2Name,
  onSheet1Change, onSheet2Change,
  file1Columns, file2Columns,
  consistent,
  keyMapping, columnAggMapping,
  onKeyMappingChange, onColumnAggMappingChange,
}: ExcelColumnSelectorProps) {

  // === Column options ===
  const opts1 = file1Columns.map((c) => ({ value: c, label: c }));
  const opts2 = file2Columns.map((c) => ({ value: c, label: c }));

  // Used columns
  const used1 = new Set([
    ...keyMapping.map((m) => m.col1),
    ...columnAggMapping.map((m) => m.col1),
  ]);
  const used2 = new Set([
    ...keyMapping.map((m) => m.col2),
    ...columnAggMapping.map((m) => m.col2),
  ]);

  // === Handlers for CONSISTENT (unified) mode ===
  const handleUnifiedKeyChange = (values: string[]) => {
    const newAgg = columnAggMapping.filter((m) => !values.includes(m.col1));
    onKeyMappingChange(values.map((v) => ({ col1: v, col2: v })));
    onColumnAggMappingChange(newAgg);
  };

  const handleUnifiedAddCompare = (col: string) => {
    if (!col) return;
    onColumnAggMappingChange([
      ...columnAggMapping,
      { col1: col, col2: col, method: 'first' as AggMethod },
    ]);
  };

  const handleUnifiedRemoveCompare = (idx: number) => {
    onColumnAggMappingChange(columnAggMapping.filter((_, i) => i !== idx));
  };

  const handleUnifiedAggChange = (idx: number, method: AggMethod) => {
    onColumnAggMappingChange(
      columnAggMapping.map((m, i) => (i === idx ? { ...m, method } : m)),
    );
  };

  // === Handlers for MAPPED mode ===
  const handleAddKeyMapping = () => {
    const avail1 = file1Columns.find((c) => !used1.has(c)) ?? '';
    const avail2 = file2Columns.find((c) => !used2.has(c)) ?? '';
    if (!avail1 && !avail2) return;
    onKeyMappingChange([
      ...keyMapping,
      { col1: avail1 || avail2, col2: avail2 || avail1 },
    ]);
  };

  const handleRemoveKeyMapping = (idx: number) => {
    onKeyMappingChange(keyMapping.filter((_, i) => i !== idx));
  };

  const handleKeyMappingChange = (idx: number, side: 'col1' | 'col2', val: string) => {
    const updated = keyMapping.map((m, i) =>
      i === idx ? { ...m, [side]: val } : m,
    );
    onKeyMappingChange(updated);
  };

  const handleAddCompareMapping = () => {
    const avail1 = file1Columns.find((c) => !used1.has(c)) ?? '';
    const avail2 = file2Columns.find((c) => !used2.has(c)) ?? '';
    if (!avail1 && !avail2) return;
    onColumnAggMappingChange([
      ...columnAggMapping,
      { col1: avail1 || avail2, col2: avail2 || avail1, method: 'first' as AggMethod },
    ]);
  };

  const handleRemoveCompareMapping = (idx: number) => {
    onColumnAggMappingChange(columnAggMapping.filter((_, i) => i !== idx));
  };

  const handleCompareMappingColChange = (
    idx: number, side: 'col1' | 'col2', val: string,
  ) => {
    onColumnAggMappingChange(
      columnAggMapping.map((m, i) =>
        i === idx ? { ...m, [side]: val } : m,
      ),
    );
  };

  const handleCompareMappingAggChange = (idx: number, method: AggMethod) => {
    onColumnAggMappingChange(
      columnAggMapping.map((m, i) => (i === idx ? { ...m, method } : m)),
    );
  };

  // ============================================

  return (
    <Card size="small" title="对比配置" style={{ marginBottom: 16 }}>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">

        {/* Sheet selection */}
        <Row gutter={16}>
          <Col span={12}>
            <Text strong style={{ display: 'block', marginBottom: 4 }}>文件1 Sheet:</Text>
            <Select value={sheet1Name || undefined} onChange={onSheet1Change}
              options={file1Sheets.map((s) => ({ value: s, label: s }))}
              style={{ width: '100%' }} placeholder="选择文件1的Sheet" />
          </Col>
          <Col span={12}>
            <Text strong style={{ display: 'block', marginBottom: 4 }}>文件2 Sheet:</Text>
            <Select value={sheet2Name || undefined} onChange={onSheet2Change}
              options={file2Sheets.map((s) => ({ value: s, label: s }))}
              style={{ width: '100%' }} placeholder="选择文件2的Sheet" />
          </Col>
        </Row>

        {!consistent && (
          <Alert type="warning" showIcon
            message="两个文件的列名不完全一致，请分别映射"
            style={{ marginBottom: 0 }} />
        )}

        {/* ====== CONSISTENT MODE ====== */}
        {consistent && (
          <>
            {/* Key columns */}
            <div>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>
                Key 列 (多选自动拼接):
              </Text>
              <Select mode="multiple"
                value={keyMapping.map((m) => m.col1)}
                onChange={handleUnifiedKeyChange}
                options={opts1.filter((o) => !columnAggMapping.some((m) => m.col1 === o.value))}
                style={{ width: '100%' }}
                placeholder="选择匹配 Key 列"
                maxTagCount="responsive"
                tagRender={(props) => (
                  <Tag color="blue" closable={props.closable} onClose={props.onClose}>
                    🔑 {props.label}
                  </Tag>
                )} />
              {keyMapping.length > 1 && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  组合Key: {keyMapping.map((m) => m.col1).join(' | ')}
                </Text>
              )}
            </div>

            {/* Compare columns */}
            <div>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>
                对比列 (含聚合方式):
              </Text>
              {columnAggMapping.map((m, idx) => (
                <Row key={idx} gutter={8} align="middle" style={{ marginBottom: 8 }}>
                  <Col flex="auto">
                    <Select value={m.col1} disabled style={{ width: '100%' }}
                      options={[{ value: m.col1, label: m.col1 }]} />
                  </Col>
                  <Col style={{ width: 140 }}>
                    <Select value={m.method}
                      onChange={(v) => handleUnifiedAggChange(idx, v)}
                      options={AGG_OPTIONS} style={{ width: '100%' }} />
                  </Col>
                  <Col>
                    <Button type="text" danger icon={<DeleteOutlined />}
                      onClick={() => handleUnifiedRemoveCompare(idx)} />
                  </Col>
                </Row>
              ))}
              <Select value={undefined} onChange={handleUnifiedAddCompare}
                options={opts1.filter((o) => !used1.has(o.value))}
                style={{ width: '100%' }}
                placeholder="+ 添加对比列"
                showSearch suffixIcon={<PlusOutlined />} />
            </div>
          </>
        )}

        {/* ====== MAPPED MODE (columns differ) ====== */}
        {!consistent && (
          <>
            {/* Key mapping */}
            <div>
              <Space style={{ marginBottom: 8 }}>
                <Text strong>Key 列映射 (多选自动拼接):</Text>
                {file1Columns.length > 0 && file2Columns.length > 0 && keyMapping.length === 0 && (
                  <Button size="small" type="dashed" icon={<PlusOutlined />}
                    onClick={handleAddKeyMapping}>添加 Key 映射</Button>
                )}
              </Space>
              {keyMapping.length > 0 && (
                <div style={{
                  background: '#fafafa', padding: 8, borderRadius: 6,
                  border: '1px solid #e8e8e8', marginBottom: 4,
                }}>
                  {/* Header */}
                  <Row gutter={8} style={{ marginBottom: 4 }}>
                    <Col span={11}>
                      <Text type="secondary" style={{ fontSize: 11 }}>← 文件1 列名</Text>
                    </Col>
                    <Col span={2} style={{ textAlign: 'center' }}>
                      <SwapOutlined style={{ color: '#bbb' }} />
                    </Col>
                    <Col span={11}>
                      <Text type="secondary" style={{ fontSize: 11 }}>文件2 列名 →</Text>
                    </Col>
                  </Row>
                  {keyMapping.map((m, idx) => (
                    <Row key={idx} gutter={8} align="middle" style={{ marginBottom: 4 }}>
                      <Col span={11}>
                        <Select value={m.col1 || undefined}
                          onChange={(v) => handleKeyMappingChange(idx, 'col1', v)}
                          options={opts1.filter((o) => o.value === m.col1 || !used1.has(o.value))}
                          style={{ width: '100%' }} size="small"
                          placeholder="文件1列" showSearch />
                      </Col>
                      <Col span={2} style={{ textAlign: 'center' }}>
                        <Tag color="blue" style={{ margin: 0, fontSize: 10 }}>KEY</Tag>
                      </Col>
                      <Col span={10}>
                        <Select value={m.col2 || undefined}
                          onChange={(v) => handleKeyMappingChange(idx, 'col2', v)}
                          options={opts2.filter((o) => o.value === m.col2 || !used2.has(o.value))}
                          style={{ width: '100%' }} size="small"
                          placeholder="文件2列" showSearch />
                      </Col>
                      <Col span={1}>
                        <Button type="text" danger size="small" icon={<DeleteOutlined />}
                          onClick={() => handleRemoveKeyMapping(idx)} />
                      </Col>
                    </Row>
                  ))}
                  <Button size="small" type="dashed" icon={<PlusOutlined />} block
                    onClick={handleAddKeyMapping}>添加 Key 映射行</Button>
                </div>
              )}
              {keyMapping.length > 1 && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  组合Key: {keyMapping.map((m) => m.col1 || m.col2 || '?').join(' | ')}
                </Text>
              )}
            </div>

            <Divider style={{ margin: '8px 0' }} />

            {/* Compare column mapping */}
            <div>
              <Space style={{ marginBottom: 8 }}>
                <Text strong>对比列映射 (含聚合方式):</Text>
                <Button size="small" type="dashed" icon={<PlusOutlined />}
                  onClick={handleAddCompareMapping}>添加对比列</Button>
              </Space>
              {columnAggMapping.length === 0 && (
                <Alert type="info" message="请添加至少一个对比列映射" showIcon style={{ marginBottom: 8 }} />
              )}
              {columnAggMapping.map((m, idx) => (
                <div key={idx} style={{
                  background: '#fafafa', padding: 8, borderRadius: 6,
                  border: '1px solid #e8e8e8', marginBottom: 8,
                }}>
                  <Row gutter={8} align="middle">
                    <Col span={7}>
                      <Select value={m.col1 || undefined}
                        onChange={(v) => handleCompareMappingColChange(idx, 'col1', v)}
                        options={opts1.filter((o) => o.value === m.col1 || !used1.has(o.value))}
                        style={{ width: '100%' }} size="small"
                        placeholder="文件1列" showSearch />
                    </Col>
                    <Col span={1} style={{ textAlign: 'center' }}>
                      <SwapOutlined style={{ color: '#999' }} />
                    </Col>
                    <Col span={7}>
                      <Select value={m.col2 || undefined}
                        onChange={(v) => handleCompareMappingColChange(idx, 'col2', v)}
                        options={opts2.filter((o) => o.value === m.col2 || !used2.has(o.value))}
                        style={{ width: '100%' }} size="small"
                        placeholder="文件2列" showSearch />
                    </Col>
                    <Col style={{ width: 120 }}>
                      <Select value={m.method}
                        onChange={(v) => handleCompareMappingAggChange(idx, v)}
                        options={AGG_OPTIONS} style={{ width: '100%' }} size="small" />
                    </Col>
                    <Col>
                      <Button type="text" danger size="small" icon={<DeleteOutlined />}
                        onClick={() => handleRemoveCompareMapping(idx)} />
                    </Col>
                  </Row>
                </div>
              ))}
            </div>
          </>
        )}

      </Space>
    </Card>
  );
}
