"""Application configuration."""

import os
import tempfile

# Server
HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", "8000"))

# File upload limits (100 MB)
MAX_UPLOAD_SIZE = 100 * 1024 * 1024

# Temporary file storage
TEMP_DIR = os.path.join(tempfile.gettempdir(), "file-compare")
os.makedirs(TEMP_DIR, exist_ok=True)

# Supported encodings for text comparison
SUPPORTED_ENCODINGS = [
    "auto", "utf-8", "utf-16", "utf-32",
    "gbk", "gb2312", "gb18030", "big5",
    "shift_jis", "euc-jp", "euc-kr",
    "iso-8859-1", "windows-1252", "ascii",
]

# Excel supported extensions
EXCEL_EXTENSIONS = {".xlsx", ".xls", ".xlsm", ".csv"}
