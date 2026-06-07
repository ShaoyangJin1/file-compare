"""Text diff service using Python difflib."""

import difflib
from models.text_models import TextCompareStats, TextCompareResult
from utils.encoding import read_file_with_encoding


def compute_text_diff(
    file1_path: str,
    file2_path: str,
    file1_name: str,
    file2_name: str,
    encoding: str = "auto",
    context_lines: int = 3,
) -> TextCompareResult:
    """Compute differences between two text files.

    Args:
        file1_path: Path to the first file.
        file2_path: Path to the second file.
        file1_name: Display name for file 1.
        file2_name: Display name for file 2.
        encoding: File encoding or "auto" for detection.
        context_lines: Number of context lines in unified diff.

    Returns:
        TextCompareResult with diff and statistics.
    """
    content1, used_encoding = read_file_with_encoding(file1_path, encoding)
    content2, _ = read_file_with_encoding(file2_path, used_encoding)

    lines1 = content1.splitlines(keepends=True)
    lines2 = content2.splitlines(keepends=True)

    # Generate unified diff
    unified_diff = difflib.unified_diff(
        lines1,
        lines2,
        fromfile=file1_name,
        tofile=file2_name,
        n=context_lines,
    )
    unified_diff_text = "".join(unified_diff)

    # Generate side-by-side HTML (fallback / alternative view)
    html_diff = difflib.HtmlDiff(wrapcolumn=80)
    side_by_side_html = html_diff.make_table(
        lines1,
        lines2,
        fromdesc=file1_name,
        todesc=file2_name,
        context=True,
        numlines=context_lines,
    )

    # Compute statistics
    stats = _compute_stats(lines1, lines2)

    return TextCompareResult(
        file1_name=file1_name,
        file2_name=file2_name,
        encoding=used_encoding,
        file1_lines=len(lines1),
        file2_lines=len(lines2),
        unified_diff=unified_diff_text,
        side_by_side_html=side_by_side_html,
        stats=stats,
    )


def _compute_stats(lines1: list[str], lines2: list[str]) -> TextCompareStats:
    """Compute diff statistics using SequenceMatcher."""
    matcher = difflib.SequenceMatcher(None, lines1, lines2)
    added = 0
    deleted = 0
    changed = 0
    unchanged = 0

    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == "equal":
            unchanged += i2 - i1
        elif tag == "insert":
            added += j2 - j1
        elif tag == "delete":
            deleted += i2 - i1
        elif tag == "replace":
            # A replace is one changed block
            span_diff = abs((i2 - i1) - (j2 - j1))
            min_span = min(i2 - i1, j2 - j1)
            changed += min_span
            if i2 - i1 > j2 - j1:
                deleted += span_diff
            else:
                added += span_diff

    return TextCompareStats(
        added=added,
        deleted=deleted,
        changed=changed,
        unchanged=unchanged,
        total_diffs=added + deleted + changed,
    )
