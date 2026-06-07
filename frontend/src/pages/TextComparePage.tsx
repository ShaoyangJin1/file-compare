import { Typography, Button, Space, Alert, Card } from 'antd';
import { SwapOutlined, ClearOutlined } from '@ant-design/icons';
import { useTextCompare } from '../hooks/useTextCompare';
import FilePairUpload from '../components/upload/FilePairUpload';
import TextCompareConfig from '../components/text/TextCompareConfig';
import TextDiffView from '../components/text/TextDiffView';
import PdfExportButton from '../components/pdf/PdfExportButton';

const { Title } = Typography;

export default function TextComparePage() {
  const {
    file1,
    file2,
    encoding,
    result,
    loading,
    error,
    setFile1,
    setFile2,
    setEncoding,
    runCompare,
    resetAll,
  } = useTextCompare();

  const canCompare = file1 !== null && file2 !== null;
  const hasResult = result !== null;

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <Title level={3}>📝 文本文件对比</Title>

      {error && (
        <Alert
          type="error"
          message={error}
          closable
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Upload Area */}
      <Card style={{ marginBottom: 16 }}>
        <FilePairUpload
          file1={file1}
          file2={file2}
          onFile1Change={setFile1}
          onFile2Change={setFile2}
          label1="文件 1 (原始版本)"
          label2="文件 2 (新版本)"
          accept=".txt,.csv,.json,.xml,.html,.css,.js,.ts,.py,.java,.go,.rs,.c,.cpp,.h,.log,.md,.yaml,.yml,.ini,.cfg,.conf,.sh,.bat,.ps1,.sql,.env,.gitignore"
        />

        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <TextCompareConfig
            encoding={encoding}
            onEncodingChange={setEncoding}
          />

          <Space>
            {hasResult && (
              <Button
                icon={<ClearOutlined />}
                onClick={resetAll}
              >
                清空重来
              </Button>
            )}
            <Button
              type="primary"
              icon={<SwapOutlined />}
              onClick={runCompare}
              disabled={!canCompare}
              loading={loading}
              size="large"
            >
              开始对比
            </Button>
          </Space>
        </div>
      </Card>

      {/* Result */}
      {hasResult && (
        <>
          <TextDiffView result={result} />
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <PdfExportButton
              compareType="text"
              data={result as unknown as Record<string, unknown>}
              title={`文本对比报告 - ${result.file1_name} vs ${result.file2_name}`}
            />
          </div>
        </>
      )}

      {!hasResult && !loading && (
        <Card style={{ textAlign: 'center', padding: 80 }}>
          <Typography.Text type="secondary" style={{ fontSize: 16 }}>
            请上传两个文本文件，然后点击「开始对比」
          </Typography.Text>
        </Card>
      )}
    </div>
  );
}
