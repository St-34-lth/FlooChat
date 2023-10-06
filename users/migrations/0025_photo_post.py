# Generated by Django 4.2.4 on 2023-09-14 15:58

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0024_conversation_conversationmessage"),
    ]

    operations = [
        migrations.AddField(
            model_name="photo",
            name="post",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to="users.post",
            ),
        ),
    ]