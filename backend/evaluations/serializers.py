cat > backend/evaluations/serializers.py <<'PY'
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Criterion, Evaluation

class CriterionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Criterion
        fields = ['id', 'name']

class EvaluationSerializer(serializers.ModelSerializer):
    evaluator = serializers.ReadOnlyField(source='evaluator.id')
    subject = serializers.ReadOnlyField(source='subject.id')

    # expose nested read-only criterion (optional for reads)
    criterion = CriterionSerializer(read_only=True)

    # write-only ids to create/update relations
    criterion_id = serializers.PrimaryKeyRelatedField(
        queryset=Criterion.objects.all(),
        source='criterion',
        write_only=True,
    )
    subject_id = serializers.PrimaryKeyRelatedField(
        queryset=get_user_model().objects.all(),
        source='subject',
        write_only=True,
    )

    class Meta:
        model = Evaluation
        fields = [
            'id', 'evaluator', 'subject',
            'criterion', 'criterion_id', 'subject_id',
            'score', 'created_at',
        ]
PY