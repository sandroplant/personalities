#!/usr/bin/env bash
set -euo pipefail
BASE_BRANCH="${BASE_BRANCH:-main}"
STAMP="$(date +%Y%m%d-%H%M)"
INTEG_BRANCH="${INTEG_BRANCH:-codex/integration-$STAMP}"
RAW_PATTERN="${1:-origin/codex/.*}"
PATTERN="${RAW_PATTERN#origin/}"

git fetch origin --prune
# collect codex branches
CODEX_BRANCHES=()
while IFS= read -r br; do [[ -n "$br" ]] && CODEX_BRANCHES+=("$br"); done < <(
  git for-each-ref --format='%(refname:short)' refs/remotes/origin |
  sed -E 's#^origin/##' | grep -E "^${PATTERN}$" | grep -v '^codex/integration' || true
)

[[ ${#CODEX_BRANCHES[@]} -eq 0 ]] && { echo "No codex branches found"; exit 0; }

git checkout "$BASE_BRANCH"
git pull --rebase origin "$BASE_BRANCH"
# **reuse** existing integration branch if present
if git rev-parse --verify "$INTEG_BRANCH" >/dev/null 2>&1; then
  git checkout "$INTEG_BRANCH"
else
  git checkout -b "$INTEG_BRANCH"
fi

for br in "${CODEX_BRANCHES[@]}"; do
  git merge-base --is-ancestor "origin/$br" HEAD 2>/dev/null && { echo "Already merged: $br"; continue; }
  echo "Merging origin/$br ..."
  git merge --no-ff --no-edit "origin/$br" || {
    echo "Fix conflicts, then: git add -A && git commit --no-edit"
    echo "Resume with: INTEG_BRANCH=$INTEG_BRANCH ./scripts/aggregate_codex.sh '$RAW_PATTERN'"
    exit 1
  }
done

# hooks
command -v pre-commit >/dev/null 2>&1 || python -m pip install -q pre-commit || pip install -q pre-commit
python -m pre_commit run --all-files || true
git diff --quiet || { git add -A && git commit -m "style(pre-commit): apply hooks"; }

# tests
python backend/manage.py test -q || { echo "Tests failed. Fix & commit, then rerun."; exit 1; }

git push -u origin "$INTEG_BRANCH"
command -v gh >/dev/null 2>&1 && gh pr create -B "$BASE_BRANCH" -H "$INTEG_BRANCH" -t "Batch Codex Integration ($STAMP)" -b "Batch integration" || true
