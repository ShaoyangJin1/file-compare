import { Upload, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';

const { Dragger } = Upload;

interface FileDropZoneProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  label: string;
  accept?: string;
}

export default function FileDropZone({
  file,
  onFileChange,
  label,
  accept,
}: FileDropZoneProps) {
  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept,
    maxCount: 1,
    showUploadList: true,
    fileList: file ? [{ uid: '-1', name: file.name, status: 'done' } as never] : [],
    beforeUpload: (f: File) => {
      onFileChange(f);
      return false; // Prevent auto-upload
    },
    onRemove: () => {
      onFileChange(null);
    },
    onChange(info) {
      const { file: f } = info;
      if (f.status === 'error') {
        message.error(`${f.name} 上传失败`);
      }
    },
  };

  return (
    <div style={{ flex: 1 }}>
      <div style={{ marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
        {label}
      </div>
      <Dragger
        {...uploadProps}
        style={{
          borderColor: file ? '#52c41a' : undefined,
          background: file ? '#f6ffed' : undefined,
        }}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">
          {file
            ? `已选择: ${file.name}`
            : '点击或拖拽文件到此处'}
        </p>
        <p className="ant-upload-hint">
          {file
            ? `大小: ${(file.size / 1024).toFixed(1)} KB`
            : '支持单个文件上传'}
        </p>
      </Dragger>
    </div>
  );
}
