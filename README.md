# 文件对比工具

支持**文本文件对比**（类 WinMerge）和 **Excel 文件对比**（按关键列匹配行），结果可导出为 PDF。

## 技术栈

- **后端**: Python FastAPI + pandas + WeasyPrint
- **前端**: React + TypeScript + Ant Design + diff2html
- **部署**: 本地单机 Web 服务 (localhost)

## 快速启动

### 1. 环境要求

- Python 3.10+
- Node.js 18+

### 2. 安装依赖

**后端:**
```bash
cd backend
pip install -r requirements.txt
```

**前端:**
```bash
cd frontend
npm install
```

### 3. 启动服务

**方式一：分别启动（开发模式）**

终端 1 — 后端:
```bash
cd backend
python main.py
```

终端 2 — 前端:
```bash
cd frontend
npm run dev
```

**方式二：一键启动**

Windows 双击 `start.bat`

### 4. 访问

浏览器打开 `http://localhost:5173`

## 功能说明

### 文本对比
- 上传两个文本文件，支持自动编码检测（UTF-8/GBK 等）
- Side-by-Side 和 Line-by-Line 两种视图
- 差异行高亮（新增/删除/修改）
- 导出 PDF 对比报告

### Excel 对比
- 上传两个 Excel 文件（.xlsx / .xls / .csv）
- 选择 Sheet 和 Key 列进行行匹配
- 选择需要对比的列，查看单元格级别的差异
- 三个维度展示：差异行 / 仅在文件1 / 仅在文件2
- 导出 PDF 对比报告（含汇总统计和详情表格）
