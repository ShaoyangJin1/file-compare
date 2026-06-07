"""FastAPI application entry point — production mode.

Serves both the API and the frontend static files from a single port.
"""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from config import HOST, PORT
from routers import text_compare, excel_compare, pdf_export

app = FastAPI(
    title="文件对比工具",
    description="支持文本文件对比（类WinMerge）和 Excel 文件对比（按关键列匹配），结果可导出为 PDF。",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
app.include_router(text_compare.router)
app.include_router(excel_compare.router)
app.include_router(pdf_export.router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "file-compare"}


# ====== Serve frontend static files (production) ======

FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
FRONTEND_DIST = os.path.abspath(FRONTEND_DIST)

if os.path.exists(FRONTEND_DIST):
    # Mount /assets/ for JS/CSS files
    assets_dir = os.path.join(FRONTEND_DIST, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    # Serve index.html for all other routes (SPA fallback)
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        file_path = os.path.join(FRONTEND_DIST, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main_prod:app",
        host="0.0.0.0",
        port=PORT,
    )
