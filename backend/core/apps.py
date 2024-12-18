# core/apps.py

from django.apps import AppConfig
import sys
import logging

logger = logging.getLogger(__name__)

class CoreConfig(AppConfig):
    name = 'core'

    def ready(self):
        import sys
        import logging

        def handle_exception(exc_type, exc_value, exc_traceback):
            if issubclass(exc_type, KeyboardInterrupt):
                sys.__excepthook__(exc_type, exc_value, exc_traceback)
                return
            logger.error("Uncaught exception", exc_info=(exc_type, exc_value, exc_traceback))

        sys.excepthook = handle_exception
