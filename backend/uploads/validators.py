# uploads/validators.py


def validate_file_size(size):
    """Validate the file size (max 2MB)."""
    if size > 2 * 1024 * 1024:  # 2MB limit
        return "File size is too large."
    return None


def validate_file_extension(filename):
    """Validate the file extension."""
    allowed_extensions = [".jpg", ".jpeg", ".png", ".gif"]
    if not any(filename.endswith(ext) for ext in allowed_extensions):
        return "Only images are allowed."
    return None
