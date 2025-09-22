.PHONY: lint test

lint:
	@python - <<'PY'
import importlib.util, sys, subprocess, os, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
if importlib.util.find_spec("pre_commit") is None:
    cmd = [sys.executable, "-m", "pip", "install", "--disable-pip-version-check", "-q"]
    dev_req = root / "requirements-dev.txt"
    if dev_req.exists():
        subprocess.check_call(cmd + ["-r", str(dev_req)])
    else:
        subprocess.check_call(cmd + ["pre-commit"])
PY
	@python -m pre_commit run --all-files

test:
	python manage.py test
