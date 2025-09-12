from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        # The two divergent leaves in userprofiles
        ("userprofiles", "0003_merge_20250912_0001"),
        ("userprofiles", "0004_friendship"),
    ]

    operations = [
        # No-op: this only merges migration branches.
    ]
