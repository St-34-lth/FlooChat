# Generated by Django 4.2.4 on 2023-08-26 07:47

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0015_alter_photo_image_alter_user_profile_pic"),
    ]

    operations = [
        migrations.AlterField(
            model_name="user",
            name="profile_pic",
            field=models.ImageField(
                blank=True, default="images/default_pic.jpeg", upload_to="profile_pics/"
            ),
        ),
    ]