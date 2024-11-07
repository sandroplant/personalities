# core/utils/path_util.py

from pathlib import Path

# Get the absolute path of the current file
__filename = Path(__file__).resolve()

# Get the directory name of the current file
__dirname = __filename.parent

# Optional: Define functions for dynamic usage
def get_filename():
    return __filename

def get_dirname():
    return __dirname
