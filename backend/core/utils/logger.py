# core/utils/logger.py

import logging
import re
import bleach

class SensitiveInfoFormatter(logging.Formatter):
    """
    Custom formatter to mask sensitive information in logs.
    """

    def format(self, record):
        original = super().format(record)
        # Example: Mask email addresses
        masked = re.sub(r'[\w\.-]+@[\w\.-]+', '****@****.***', original)
        # Add more masking rules as needed
        return masked

logger = logging.getLogger(__name__)

# Optional: Configure logger if needed (handlers are already set in settings.py)
# Example:
# if not logger.handlers:
#     handler = logging.StreamHandler()
#     formatter = SensitiveInfoFormatter('%(asctime)s [%(levelname)s]: %(message)s')
#     handler.setFormatter(formatter)
#     logger.addHandler(handler)
#     logger.setLevel(logging.INFO)
