@echo off
chcp 65001 >nul
title 文件对比工具

echo ========================================
echo   📁 文件对比工具
echo ========================================
echo.

echo [1/2] 启动后端服务 (FastAPI)...
start "FileCompare-Backend" cmd /k "cd /d "%~dp0backend" && python main.py"

echo [2/2] 启动前端服务 (Vite+React)...
start "FileCompare-Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ✅ 服务启动中...
echo    后端: http://localhost:8000
echo    前端: http://localhost:5173
echo.
echo 请稍等几秒后，在浏览器中打开 http://localhost:5173
echo.
pause
