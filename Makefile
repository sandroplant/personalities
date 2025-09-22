.PHONY: lint format test

lint:
	@python - <<'PY'
import importlib.util, sys, subprocess, os
if importlib.util.find_spec("pre_commit") is None:
    cmd = [sys.executable, "-m", "pip", "install", "--disable-pip-version-check", "-q"]
    if os.path.exists("requirements-dev.txt"):
        subprocess.check_call(cmd + ["-r", "requirements-dev.txt"])
    else:
        subprocess.check_call(cmd + ["pre-commit"])
PY
	@$(PYTHON) -m pre_commit run --all-files || python -m pre_commit run --all-files

format:
	@$(MAKE) lint

test:
	python backend/manage.py test
