# evaluations package
"""Ensure additive models are registered with Django."""
try:
    from .meta_models import EvaluationMeta  # noqa: F401
except Exception:
    pass

try:
    from .rater_models import RaterStats  # noqa: F401
except Exception:
    pass
