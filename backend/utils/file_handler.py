"""File upload and temporary storage utilities."""

import os
import uuid
import shutil
from pathlib import Path
from datetime import datetime, timedelta

from fastapi import UploadFile

from config import TEMP_DIR, MAX_UPLOAD_SIZE


def get_session_dir(session_id: str | None = None) -> str:
    """Get or create a session-specific temporary directory.

    Args:
        session_id: Optional session identifier. Auto-generated if not provided.

    Returns:
        Path to the session directory.
    """
    if session_id is None:
        session_id = uuid.uuid4().hex[:12]

    session_dir = os.path.join(TEMP_DIR, session_id)
    os.makedirs(session_dir, exist_ok=True)
    return session_dir


async def save_upload_file(file: UploadFile, session_dir: str) -> str:
    """Save an uploaded file to the session directory.

    Args:
        file: The uploaded file from FastAPI.
        session_dir: Directory to save the file in.

    Returns:
        Full path to the saved file.

    Raises:
        ValueError: If file exceeds size limit.
    """
    # Validate extension
    original_name = file.filename or "unknown"
    ext = Path(original_name).suffix.lower()

    # Read and validate size
    content = await file.read()
    if len(content) > MAX_UPLOAD_SIZE:
        raise ValueError(
            f"文件大小超过限制 ({MAX_UPLOAD_SIZE // 1024 // 1024}MB): "
            f"{original_name}"
        )

    # Save to session directory, preserving original name
    safe_name = f"{uuid.uuid4().hex[:8]}_{original_name}"
    file_path = os.path.join(session_dir, safe_name)

    with open(file_path, "wb") as f:
        f.write(content)

    return file_path


def cleanup_session(session_dir: str) -> None:
    """Remove a session directory and all its contents.

    Args:
        session_dir: Path to the session directory.
    """
    if os.path.exists(session_dir):
        shutil.rmtree(session_dir, ignore_errors=True)


def cleanup_old_sessions(max_age_hours: int = 24) -> int:
    """Clean up session directories older than the specified age.

    Args:
        max_age_hours: Maximum age in hours before cleanup.

    Returns:
        Number of directories cleaned up.
    """
    cutoff = datetime.now() - timedelta(hours=max_age_hours)
    cleaned = 0

    for entry in os.listdir(TEMP_DIR):
        entry_path = os.path.join(TEMP_DIR, entry)
        if os.path.isdir(entry_path):
            mtime = datetime.fromtimestamp(os.path.getmtime(entry_path))
            if mtime < cutoff:
                shutil.rmtree(entry_path, ignore_errors=True)
                cleaned += 1

    return cleaned
