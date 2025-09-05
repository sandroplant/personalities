from __future__ import annotations

from collections import defaultdict
from statistics import mean, pstdev
from typing import Dict, List, Tuple

from django.apps import apps
from django.core.management.base import BaseCommand
from django.db.models import Avg, F
from django.conf import settings


def _pick_fk_field(model, preferred_names):
    for f in model._meta.get_fields():
        if getattr(f, "is_relation", False) and not getattr(f, "many_to_many", False):
            if f.name in preferred_names:
                return f.name
    for f in model._meta.get_fields():
        if getattr(f, "is_relation", False) and not getattr(f, "many_to_many", False):
            for p in preferred_names:
                if p in f.name:
                    return f.name
    return None


def _pick_numeric_field(model, preferred_names):
    for f in model._meta.get_fields():
        if hasattr(f, "get_internal_type") and f.get_internal_type() in (
            "IntegerField",
            "SmallIntegerField",
            "PositiveIntegerField",
            "PositiveSmallIntegerField",
            "BigIntegerField",
            "FloatField",
            "DecimalField",
        ):
            if f.name in preferred_names:
                return f.name
    for f in model._meta.get_fields():
        if hasattr(f, "get_internal_type") and f.get_internal_type() in (
            "IntegerField",
            "SmallIntegerField",
            "PositiveIntegerField",
            "PositiveSmallIntegerField",
            "BigIntegerField",
            "FloatField",
            "DecimalField",
        ):
            for p in preferred_names:
                if p in f.name:
                    return f.name
    return None


class Command(BaseCommand):
    help = "Recompute per-rater statistics (mean/std/extreme rate/reliability) for evaluations."

    def add_arguments(self, parser):
        parser.add_argument("--subject-field", type=str, help="Evaluation FK field name for subject user")
        parser.add_argument("--rater-field", type=str, help="Evaluation FK field name for rater user")
        parser.add_argument("--criterion-field", type=str, help="Evaluation FK field name for criterion")
        parser.add_argument("--score-field", type=str, help="Evaluation numeric score field name")
        parser.add_argument("--list-fields", action="store_true", help="List detected Evaluation fields and exit")

    def handle(self, *args, **options):
        Evaluation = apps.get_model('evaluations', 'Evaluation')
        RaterStats = apps.get_model('evaluations', 'RaterStats')
        EvaluationMeta = None
        try:
            EvaluationMeta = apps.get_model('evaluations', 'EvaluationMeta')
        except Exception:
            pass

        # Inspect available fields for better guidance
        all_fields = list(Evaluation._meta.get_fields())
        user_label = settings.AUTH_USER_MODEL
        user_fk_fields = []
        other_fk_fields = []
        numeric_fields = []
        for f in all_fields:
            if getattr(f, "is_relation", False) and not getattr(f, "many_to_many", False):
                rel = getattr(f, "related_model", None)
                if rel is not None and f.concrete:
                    label = f"{rel._meta.app_label}.{rel._meta.model_name}"
                    if label.lower() == user_label.lower():
                        user_fk_fields.append(f.name)
                    else:
                        other_fk_fields.append((f.name, label))
            elif hasattr(f, "get_internal_type") and f.get_internal_type() in ("IntegerField", "FloatField", "DecimalField", "PositiveIntegerField"):
                numeric_fields.append(f.name)

        if options.get("list_fields"):
            self.stdout.write("Detected Evaluation fields:")
            self.stdout.write(f"  User FKs: {user_fk_fields}")
            self.stdout.write(f"  Other FKs: {other_fk_fields}")
            self.stdout.write(f"  Numeric: {numeric_fields}")
            return

        # Resolve fields using options or heuristics
        subject_field = options.get("subject_field") or _pick_fk_field(Evaluation, ["subject", "target", "rated_user", "profile", "user"]) 
        rater_field = options.get("rater_field") or _pick_fk_field(Evaluation, ["rater", "evaluator", "author", "user"]) 
        criterion_field = options.get("criterion_field") or _pick_fk_field(Evaluation, ["criterion", "criteria", "trait"]) 
        score_field = options.get("score_field") or _pick_numeric_field(Evaluation, ["score", "rating", "value"]) 

        # If still ambiguous for subject/rater, attempt to disambiguate two user FKs
        if (not subject_field or not rater_field) and len(user_fk_fields) >= 2:
            # Prefer names containing subject-like and rater-like tokens
            subj_tokens = ("subject", "target", "rated", "profile")
            rater_tokens = ("rater", "evaluator", "author", "from")
            for name in user_fk_fields:
                if not subject_field and any(tok in name for tok in subj_tokens):
                    subject_field = name
                if not rater_field and any(tok in name for tok in rater_tokens):
                    rater_field = name
            # If still missing, pick deterministically
            if not subject_field:
                subject_field = sorted(user_fk_fields)[0]
            if not rater_field:
                rater_field = sorted([n for n in user_fk_fields if n != subject_field] or user_fk_fields)[0]

        if not all([subject_field, rater_field, criterion_field, score_field]):
            self.stderr.write("Could not infer Evaluation model fields. Run with --list-fields and pass --subject-field/--rater-field/--criterion-field/--score-field.")
            return

        qs = Evaluation.objects.all()
        if EvaluationMeta:
            qs = qs.filter(evaluationmeta__status='ACTIVE')

        # Precompute consensus averages per (subject, criterion)
        agg = qs.values(f"{subject_field}_id", f"{criterion_field}_id").annotate(avg=Avg(score_field))
        consensus: Dict[Tuple[int, int], float] = {(row[f"{subject_field}_id"], row[f"{criterion_field}_id"]): float(row["avg"]) for row in agg}

        # Collect per-rater deviations and stats
        by_rater: Dict[int, List[float]] = defaultdict(list)
        raw_scores: Dict[int, List[float]] = defaultdict(list)
        extreme_cnt: Dict[int, int] = defaultdict(int)

        for ev in qs.values(
            f"{rater_field}_id",
            f"{subject_field}_id",
            f"{criterion_field}_id",
            score_field,
        ):
            uid = int(ev[f"{rater_field}_id"]) if ev[f"{rater_field}_id"] is not None else None
            if uid is None:
                continue
            s = float(ev[score_field])
            key = (int(ev[f"{subject_field}_id"]), int(ev[f"{criterion_field}_id"]))
            avg = consensus.get(key)
            if avg is None:
                continue
            by_rater[uid].append(abs(s - avg))
            raw_scores[uid].append(s)
            if s <= 1.0 or s >= 10.0:
                extreme_cnt[uid] += 1

        updated = 0
        for uid, diffs in by_rater.items():
            scores = raw_scores.get(uid, [])
            if not scores:
                continue
            cnt = len(scores)
            mu = mean(scores)
            sd = pstdev(scores) if len(scores) > 1 else 0.0
            e_rate = extreme_cnt.get(uid, 0) / float(cnt)
            # Map mean absolute deviation to reliability in [0.5, 1.0]
            mad = mean(diffs) if diffs else 0.0
            rel = 1.0 / (1.0 + (mad / 3.0))  # scale by 3 to soften
            if rel < 0.5:
                rel = 0.5
            if rel > 1.0:
                rel = 1.0

            obj, _ = RaterStats.objects.get_or_create(user_id=uid)
            obj.ratings_count = cnt
            obj.mean_score = mu
            obj.std_score = sd
            obj.extreme_rate = e_rate
            obj.reliability = rel
            obj.save()
            updated += 1

        self.stdout.write(self.style.SUCCESS(f"Updated RaterStats for {updated} users."))
