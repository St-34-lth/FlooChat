# Generated by Django 4.2.4 on 2023-08-23 18:04

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0011_rename_created_at_album_created_date"),
    ]

    operations = [
        migrations.AlterField(
            model_name="photo",
            name="album",
            field=models.ForeignKey(
                blank=True,
                on_delete=django.db.models.deletion.CASCADE,
                to="users.album",
            ),
        ),
    ]
