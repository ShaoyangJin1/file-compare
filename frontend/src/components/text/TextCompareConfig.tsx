import { Select, Space, Typography } from 'antd';

const { Text } = Typography;

const ENCODING_OPTIONS = [
  { value: 'auto', label: '自动检测 (推荐)' },
  { value: 'utf-8', label: 'UTF-8' },
  { value: 'gbk', label: 'GBK (简体中文)' },
  { value: 'gb2312', label: 'GB2312' },
  { value: 'gb18030', label: 'GB18030' },
  { value: 'big5', label: 'Big5 (繁体中文)' },
  { value: 'utf-16', label: 'UTF-16' },
  { value: 'shift_jis', label: 'Shift-JIS (日文)' },
  { value: 'euc-kr', label: 'EUC-KR (韩文)' },
  { value: 'iso-8859-1', label: 'ISO-8859-1 (Latin-1)' },
];

interface TextCompareConfigProps {
  encoding: string;
  onEncodingChange: (enc: string) => void;
}

export default function TextCompareConfig({
  encoding,
  onEncodingChange,
}: TextCompareConfigProps) {
  return (
    <Space align="center" style={{ marginBottom: 16 }}>
      <Text strong>文本编码:</Text>
      <Select
        value={encoding}
        onChange={onEncodingChange}
        options={ENCODING_OPTIONS}
        style={{ width: 220 }}
        size="middle"
      />
    </Space>
  );
}
