# This merge migration resolves divergent 0002 leaves in the evaluations app.
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("evaluations", "0002_alter_evaluation_unique_together"),
        ("evaluations", "0002_raterstats"),
    ]

    operations = [
        # No-op: just merges the graph
    ]
