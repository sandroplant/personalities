from rest_framework import serializers
from .models import Criterion, Evaluation
from django.contrib.auth import get_user_model


class CriterionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Criterion
        fields = ['id', 'name']


class EvaluationSerializer(serializers.ModelSerializer):
    evaluator = serializers.ReadOnlyField(source='evaluator.id')
    subject = serializers.ReadOnlyField(source='subject.id')
    criterion = CriterionSerializer(read_only=True)
    criterion_id = serializers.PrimaryKeyRelatedField(queryset=Criterion.objects.all(), source='criterion', write_only=True)
      subject_id = serializers.PrimaryKeyRelatedField(queryset=get_user_model().objects.all(), source='subject', write_only=True)


    class Meta:

            model = Evaluation
      
      f        fields = ['id', 'evaluator', 'subject', 'criterion', 'criterion_id', 'subject_id', 'score', 'created_at']
