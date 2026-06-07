import { Row, Col, Card, Statistic } from 'antd';
import {
  SwapOutlined,
  CheckCircleOutlined,
  FileAddOutlined,
  FileTextOutlined,
  ApartmentOutlined,
} from '@ant-design/icons';
import type { ExcelCompareSummary } from '../../types';

interface ExcelDiffSummaryProps {
  summary: ExcelCompareSummary;
}

export default function ExcelDiffSummary({ summary }: ExcelDiffSummaryProps) {
  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
      <Col xs={12} sm={8} md={4}>
        <Card size="small">
          <Statistic
            title="文件1 行数"
            value={summary.total_rows_file1}
            prefix={<FileTextOutlined />}
          />
        </Card>
      </Col>
      <Col xs={12} sm={8} md={4}>
        <Card size="small">
          <Statistic
            title="文件2 行数"
            value={summary.total_rows_file2}
            prefix={<FileTextOutlined />}
          />
        </Card>
      </Col>
      <Col xs={12} sm={8} md={4}>
        <Card size="small">
          <Statistic
            title="文件1 分组数"
            value={summary.groups_file1}
            prefix={<ApartmentOutlined />}
          />
        </Card>
      </Col>
      <Col xs={12} sm={8} md={4}>
        <Card size="small">
          <Statistic
            title="文件2 分组数"
            value={summary.groups_file2}
            prefix={<ApartmentOutlined />}
          />
        </Card>
      </Col>
      <Col xs={12} sm={8} md={4}>
        <Card size="small">
          <Statistic
            title="匹配分组"
            value={summary.matched}
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: '#3f8600' }}
          />
        </Card>
      </Col>
      <Col xs={12} sm={8} md={4}>
        <Card size="small">
          <Statistic
            title="仅在文件1"
            value={summary.only_in_file1}
            prefix={<FileAddOutlined />}
            valueStyle={{ color: '#cf1322' }}
          />
        </Card>
      </Col>
      <Col xs={12} sm={8} md={4}>
        <Card size="small">
          <Statistic
            title="仅在文件2"
            value={summary.only_in_file2}
            prefix={<FileAddOutlined />}
            valueStyle={{ color: '#cf1322' }}
          />
        </Card>
      </Col>
      <Col xs={12} sm={8} md={4}>
        <Card size="small">
          <Statistic
            title="差异分组"
            value={summary.rows_with_differences}
            prefix={<SwapOutlined />}
            valueStyle={{
              color: summary.rows_with_differences > 0 ? '#faad14' : '#3f8600',
            }}
          />
        </Card>
      </Col>
    </Row>
  );
}
