import { Typography, Button, Space, Alert, Card, Steps } from 'antd';
import {
  SwapOutlined, ClearOutlined, UploadOutlined,
  SettingOutlined, CheckCircleOutlined,
} from '@ant-design/icons';
import { useExcelCompare } from '../hooks/useExcelCompare';
import FilePairUpload from '../components/upload/FilePairUpload';
import ExcelColumnSelector from '../components/excel/ExcelColumnSelector';
import ExcelDiffSummary from '../components/excel/ExcelDiffSummary';
import ExcelDiffTable from '../components/excel/ExcelDiffTable';
import PdfExportButton from '../components/pdf/PdfExportButton';

const { Title, Text } = Typography;

export default function ExcelComparePage() {
  const {
    file1, file2, info,
    sheet1Name, sheet2Name,
    keyMapping, columnAggMapping,
    consistent,
    result, loading, error,
    setFile1, setFile2,
    setSheet1Name, setSheet2Name,
    setKeyMapping, setColumnAggMapping,
    fetchSheetInfo, runCompare, resetAll,
    getSheet1, getSheet2,
    keyColumns1, keyColumns2,
  } = useExcelCompare();

  const canUpload = file1 !== null && file2 !== null;
  const hasInfo = info !== null;
  const hasResult = result !== null;
  const canCompare = hasInfo
    && sheet1Name !== '' && sheet2Name !== ''
    && keyMapping.length > 0 && columnAggMapping.length > 0;

  const sheet1 = getSheet1();
  const sheet2 = getSheet2();

  let currentStep = 0;
  if (hasResult) currentStep = 3;
  else if (hasInfo) currentStep = 2;
  else if (canUpload) currentStep = 1;

  const pdfTitle = `Excel对比报告 — ${sheet1Name} vs ${sheet2Name}`;

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <Title level={3}>📊 Excel 文件对比</Title>

      {error && (
        <Alert type="error" message={error} closable style={{ marginBottom: 16 }} />
      )}

      <Steps current={currentStep} style={{ marginBottom: 24 }} size="small"
        items={[
          { title: '上传文件', icon: <UploadOutlined /> },
          { title: '读取 Sheet', icon: <UploadOutlined /> },
          { title: '配置列与聚合', icon: <SettingOutlined /> },
          { title: '查看结果', icon: <CheckCircleOutlined /> },
        ]} />

      {/* Upload */}
      {!hasInfo && !hasResult && (
        <Card style={{ marginBottom: 16 }}>
          <FilePairUpload
            file1={file1} file2={file2}
            onFile1Change={setFile1} onFile2Change={setFile2}
            label1="文件 1 (原始版本)" label2="文件 2 (新版本)"
            accept=".xlsx,.xls,.xlsm,.csv" />
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Button type="primary" icon={<UploadOutlined />}
              onClick={fetchSheetInfo} disabled={!canUpload}
              loading={loading} size="large">
              读取文件信息
            </Button>
          </div>
        </Card>
      )}

      {/* Config */}
      {hasInfo && !hasResult && (
        <Card style={{ marginBottom: 16 }}>
          <ExcelColumnSelector
            file1Sheets={info.file1.sheets.map((s) => s.name)}
            file2Sheets={info.file2.sheets.map((s) => s.name)}
            sheet1Name={sheet1Name} sheet2Name={sheet2Name}
            onSheet1Change={setSheet1Name} onSheet2Change={setSheet2Name}
            file1Columns={sheet1?.columns ?? []}
            file2Columns={sheet2?.columns ?? []}
            consistent={consistent}
            keyMapping={keyMapping} columnAggMapping={columnAggMapping}
            onKeyMappingChange={setKeyMapping}
            onColumnAggMappingChange={setColumnAggMapping}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space direction="vertical" size={0}>
              {sheet1 && (
                <Text type="secondary">
                  文件1: {info.file1.name} → {sheet1.name} ({sheet1.row_count} 行, {sheet1.columns.length} 列)
                </Text>
              )}
              {sheet2 && (
                <Text type="secondary">
                  文件2: {info.file2.name} → {sheet2.name} ({sheet2.row_count} 行, {sheet2.columns.length} 列)
                </Text>
              )}
            </Space>
            <Space>
              <Button icon={<ClearOutlined />} onClick={resetAll}>重新上传</Button>
              <Button type="primary" icon={<SwapOutlined />}
                onClick={runCompare} disabled={!canCompare}
                loading={loading} size="large">
                开始对比
              </Button>
            </Space>
          </div>
        </Card>
      )}

      {/* Results */}
      {hasResult && (
        <>
          <ExcelDiffSummary summary={result.summary} />
          <ExcelDiffTable result={result} />
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between' }}>
            <Button icon={<ClearOutlined />} onClick={resetAll}>重新对比</Button>
            <PdfExportButton compareType="excel"
              data={result as unknown as Record<string, unknown>} title={pdfTitle} />
          </div>
        </>
      )}

      {!hasInfo && !hasResult && !loading && (
        <Card style={{ textAlign: 'center', padding: 80 }}>
          <Text type="secondary" style={{ fontSize: 16 }}>
            请上传两个 Excel 文件，然后点击「读取文件信息」
          </Text>
        </Card>
      )}
    </div>
  );
}
