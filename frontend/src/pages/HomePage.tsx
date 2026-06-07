import { Card, Row, Col, Typography, Space } from 'antd';
import { FileTextOutlined, TableOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph, Text } = Typography;

const options = [
  {
    key: 'text',
    title: '文本文件对比',
    description:
      '类似于 WinMerge 的文本差异对比工具。支持 side-by-side 和 line-by-line 两种视图，自动检测文件编码 (UTF-8/GBK 等)。',
    icon: <FileTextOutlined style={{ fontSize: 48, color: '#4a90d9' }} />,
    path: '/text-compare',
  },
  {
    key: 'excel',
    title: 'Excel 文件对比',
    description:
      '按照数据透视表的方式，选择 Key 列进行行匹配，对比其他列的差异。支持多个 Sheet、列级别差异展示。',
    icon: <TableOutlined style={{ fontSize: 48, color: '#52c41a' }} />,
    path: '/excel-compare',
  },
];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 800, margin: '60px auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ textAlign: 'center' }}>
          <Title level={2}>📁 文件对比工具</Title>
          <Paragraph type="secondary">
            支持文本文件对比（类 WinMerge）和 Excel 文件对比（按关键列匹配），结果可导出为 PDF
          </Paragraph>
        </div>

        <Row gutter={[24, 24]}>
          {options.map((opt) => (
            <Col xs={24} sm={12} key={opt.key}>
              <Card
                hoverable
                onClick={() => navigate(opt.path)}
                style={{ height: '100%', cursor: 'pointer' }}
                styles={{ body: { textAlign: 'center', padding: 32 } }}
              >
                <div style={{ marginBottom: 16 }}>{opt.icon}</div>
                <Title level={4}>{opt.title}</Title>
                <Text type="secondary">{opt.description}</Text>
              </Card>
            </Col>
          ))}
        </Row>
      </Space>
    </div>
  );
}
