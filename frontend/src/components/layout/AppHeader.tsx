import { Layout, Menu } from 'antd';
import {
  FileTextOutlined,
  TableOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Header } = Layout;

const menuItems = [
  {
    key: '/',
    icon: <FileTextOutlined />,
    label: '首页',
  },
  {
    key: '/text-compare',
    icon: <FileTextOutlined />,
    label: '文本对比',
  },
  {
    key: '/excel-compare',
    icon: <TableOutlined />,
    label: 'Excel 对比',
  },
];

export default function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();

  const selectedKey =
    menuItems.find((item) => item.key === location.pathname)?.key ?? '/';

  return (
    <Header
      style={{
        display: 'flex',
        alignItems: 'center',
        background: '#001529',
        padding: '0 24px',
        gap: 24,
      }}
    >
      <div
        style={{
          color: '#fff',
          fontSize: 18,
          fontWeight: 700,
          whiteSpace: 'nowrap',
          cursor: 'pointer',
        }}
        onClick={() => navigate('/')}
      >
        📁 文件对比工具
      </div>
      <Menu
        theme="dark"
        mode="horizontal"
        selectedKeys={[selectedKey]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
        style={{ flex: 1, minWidth: 0 }}
      />
    </Header>
  );
}
