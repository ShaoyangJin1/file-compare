"""Text comparison API routes."""

from fastapi import APIRouter, File, Form, UploadFile

from models.text_models import TextCompareResult
from models.common import ErrorResponse
from services.text_diff import compute_text_diff
from utils.file_handler import get_session_dir, save_upload_file, cleanup_session

router = APIRouter(prefix="/api/text", tags=["text"])


@router.post(
    "/compare",
    response_model=TextCompareResult,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def compare_text_files(
    file1: UploadFile = File(...),
    file2: UploadFile = File(...),
    encoding: str = Form("auto"),
):
    """Upload two text files and compare them line by line.

    Returns a unified diff and side-by-side HTML table with statistics.
    """
    session_dir = get_session_dir()

    try:
        # Save both uploaded files
        path1 = await save_upload_file(file1, session_dir)
        path2 = await save_upload_file(file2, session_dir)

        name1 = file1.filename or "文件1"
        name2 = file2.filename or "文件2"

        # Compute diff
        result = compute_text_diff(
            file1_path=path1,
            file2_path=path2,
            file1_name=name1,
            file2_name=name2,
            encoding=encoding,
        )

        return result

    except UnicodeDecodeError as e:
        return ErrorResponse(
            detail=f"编码错误: {str(e)}。请尝试其他编码格式。",
            error_code="ENCODING_ERROR",
        )
    except ValueError as e:
        return ErrorResponse(detail=str(e), error_code="VALUE_ERROR")
    except Exception as e:
        return ErrorResponse(detail=f"服务器错误: {str(e)}", error_code="SERVER_ERROR")

    finally:
        # Schedule cleanup (in production, use a background task)
        # For simplicity, cleanup immediately since results are returned
        cleanup_session(session_dir)
