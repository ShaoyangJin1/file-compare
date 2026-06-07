"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import HOST, PORT
from routers import text_compare, excel_compare, pdf_export

app = FastAPI(
    title="文件对比工具",
    description="支持文本文件对比（类WinMerge）和 Excel 文件对比（按关键列匹配），结果可导出为 PDF。",
    version="1.0.0",
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(text_compare.router)
app.include_router(excel_compare.router)
app.include_router(pdf_export.router)


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "file-compare"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=HOST,
        port=PORT,
        reload=True,
    )
