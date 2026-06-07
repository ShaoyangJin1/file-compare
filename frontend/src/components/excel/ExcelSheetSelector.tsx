import { Select, Space, Typography } from 'antd';
import type { SheetInfo } from '../../types';

const { Text } = Typography;

interface ExcelSheetSelectorProps {
  sheets: SheetInfo[];
  selectedSheet: string;
  onSelect: (sheet: string) => void;
}

export default function ExcelSheetSelector({
  sheets,
  selectedSheet,
  onSelect,
}: ExcelSheetSelectorProps) {
  const options = sheets.map((s) => ({
    value: s.name,
    label: `${s.name} (${s.row_count} 行, ${s.columns.length} 列)`,
  }));

  return (
    <Space align="center" style={{ marginBottom: 16 }}>
      <Text strong>选择 Sheet:</Text>
      <Select
        value={selectedSheet || undefined}
        onChange={onSelect}
        options={options}
        style={{ width: 320 }}
        placeholder="请选择 Sheet"
        size="middle"
      />
    </Space>
  );
}
