# Generated by Django 4.2.4 on 2023-09-03 09:08

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0020_alter_friendshiprequest_status"),
    ]

    operations = [
        migrations.AlterField(
            model_name="friendshiprequest",
            name="status",
            field=models.CharField(
                choices=[
                    ("pending", "Pending"),
                    ("accepted", "Accepted"),
                    ("rejected", "Rejected"),
                ],
                default="Pending",
                max_length=10,
            ),
        ),
    ]