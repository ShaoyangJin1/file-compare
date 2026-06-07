"""Encoding detection utilities."""

import chardet


def detect_encoding(file_path: str, sample_size: int = 100000) -> str:
    """Detect the encoding of a text file.

    Args:
        file_path: Path to the file.
        sample_size: Number of bytes to sample for detection.

    Returns:
        Detected encoding name, defaults to 'utf-8' if confidence is low.
    """
    with open(file_path, "rb") as f:
        raw = f.read(sample_size)

    result = chardet.detect(raw)
    encoding = result.get("encoding", "utf-8")
    confidence = result.get("confidence", 0)

    # Fall back to utf-8 if confidence is too low
    if confidence < 0.5 or encoding is None:
        encoding = "utf-8"

    # Normalize encoding names
    encoding = encoding.lower()
    if encoding in ("ascii", "iso-8859-1"):
        encoding = "utf-8"

    return encoding


def read_file_with_encoding(file_path: str, encoding: str = "auto") -> tuple[str, str]:
    """Read a file with the specified or auto-detected encoding.

    Args:
        file_path: Path to the file.
        encoding: Encoding to use, or "auto" for detection.

    Returns:
        Tuple of (file_content, detected_encoding).
    """
    if encoding == "auto":
        encoding = detect_encoding(file_path)

    with open(file_path, "r", encoding=encoding, errors="replace") as f:
        content = f.read()

    return content, encoding
