# Generated by Django 4.1.3 on 2023-08-20 09:56

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0010_photo_album_created_at_delete_photograph_photo_album'),
    ]

    operations = [
        migrations.RenameField(
            model_name='album',
            old_name='created_at',
            new_name='created_date',
        ),
    ]
