import { Space } from 'antd';
import FileDropZone from './FileDropZone';

interface FilePairUploadProps {
  file1: File | null;
  file2: File | null;
  onFile1Change: (file: File | null) => void;
  onFile2Change: (file: File | null) => void;
  label1?: string;
  label2?: string;
  accept?: string;
}

export default function FilePairUpload({
  file1,
  file2,
  onFile1Change,
  onFile2Change,
  label1 = '文件 1 (原始版本)',
  label2 = '文件 2 (新版本)',
  accept,
}: FilePairUploadProps) {
  return (
    <Space
      direction="horizontal"
      size="large"
      style={{ width: '100%' }}
    >
      <FileDropZone
        file={file1}
        onFileChange={onFile1Change}
        label={label1}
        accept={accept}
      />
      <FileDropZone
        file={file2}
        onFileChange={onFile2Change}
        label={label2}
        accept={accept}
      />
    </Space>
  );
}
