"""Excel comparison API routes."""

from fastapi import APIRouter, File, UploadFile

from models.excel_models import (
    ExcelInfoResponse,
    ExcelCompareRequest,
    ExcelCompareResult,
    ColumnAggConfig,
    ColumnAggMapping,
    KeyMapping,
    AggMethod,
)
from models.common import ErrorResponse
from services.excel_diff import get_excel_info, compare_excel
from utils.file_handler import get_session_dir, save_upload_file, cleanup_session

router = APIRouter(prefix="/api/excel", tags=["excel"])

# In-memory store mapping session ID → file paths
_session_store: dict[str, dict[str, str]] = {}


class ExcelInfoWithSession(ExcelInfoResponse):
    """Extends ExcelInfoResponse with session_id for subsequent comparison."""
    session_id: str


@router.post(
    "/info",
    response_model=ExcelInfoWithSession,
    responses={400: {"model": ErrorResponse}},
)
async def get_excel_file_info(
    file1: UploadFile = File(...),
    file2: UploadFile = File(...),
):
    """Upload two Excel files and return their sheet/column information."""
    session_dir = get_session_dir()

    try:
        path1 = await save_upload_file(file1, session_dir)
        path2 = await save_upload_file(file2, session_dir)

        name1 = file1.filename or "文件1"
        name2 = file2.filename or "文件2"

        import os
        session_id = os.path.basename(session_dir)

        _session_store[session_id] = {
            "file1_path": path1,
            "file2_path": path2,
            "file1_name": name1,
            "file2_name": name2,
        }

        info1 = get_excel_info(path1, name1)
        info2 = get_excel_info(path2, name2)

        return ExcelInfoWithSession(
            session_id=session_id,
            file1=info1,
            file2=info2,
        )

    except ValueError as e:
        return ErrorResponse(detail=str(e), error_code="VALUE_ERROR")
    except Exception as e:
        return ErrorResponse(detail=f"读取Excel失败: {str(e)}", error_code="EXCEL_ERROR")


@router.post(
    "/compare",
    response_model=ExcelCompareResult,
    responses={400: {"model": ErrorResponse}},
)
async def compare_excel_files(request: ExcelCompareRequest):
    """Compare two previously-uploaded Excel files with group-by aggregation.

    Supports selecting different sheets per file, multiple key columns
    (concatenated), and per-column aggregation methods.
    """
    session_info = _session_store.get(request.session_id)
    if session_info is None:
        return ErrorResponse(
            detail="会话已过期或不存在，请重新上传文件。",
            error_code="SESSION_NOT_FOUND",
        )

    try:
        # === Normalize to mapping format ===

        # Key mapping
        if request.key_mapping:
            key_mapping = request.key_mapping
        elif request.key_columns:
            key_mapping = [
                KeyMapping(col1=c, col2=c) for c in request.key_columns
            ]
        else:
            return ErrorResponse(
                detail="请选择至少一个 Key 列。",
                error_code="NO_KEY_COLUMNS",
            )

        # Compare column mapping
        if request.column_agg_mapping:
            column_agg_mapping = request.column_agg_mapping
        elif request.column_aggs:
            column_agg_mapping = [
                ColumnAggMapping(col1=ca.column, col2=ca.column, method=ca.method)
                for ca in request.column_aggs
            ]
        elif request.compare_columns:
            column_agg_mapping = [
                ColumnAggMapping(col1=c, col2=c, method=AggMethod.FIRST)
                for c in request.compare_columns
            ]
        else:
            return ErrorResponse(
                detail="请选择至少一个对比列。",
                error_code="NO_COMPARE_COLUMNS",
            )

        result = compare_excel(
            file1_path=session_info["file1_path"],
            file2_path=session_info["file2_path"],
            sheet1_name=request.sheet1_name,
            sheet2_name=request.sheet2_name,
            key_mapping=key_mapping,
            column_agg_mapping=column_agg_mapping,
            ignore_columns=request.ignore_columns,
        )
        return result

    except ValueError as e:
        return ErrorResponse(detail=str(e), error_code="VALUE_ERROR")
    except KeyError as e:
        return ErrorResponse(
            detail=f"列不存在: {str(e)}", error_code="COLUMN_NOT_FOUND"
        )
    except Exception as e:
        return ErrorResponse(detail=f"对比失败: {str(e)}", error_code="COMPARE_ERROR")
