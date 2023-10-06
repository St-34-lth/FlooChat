# Generated by Django 4.1.3 on 2023-08-17 16:08

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0006_alter_post_post_type'),
    ]

    operations = [
        migrations.CreateModel(
            name='FriendshipRequest',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('status', models.CharField(choices=[('PENDING', 'Pending'), ('ACCEPTED', 'Accepted'), ('DECLINED', 'Declined')], default='PENDING', max_length=10)),
                ('message', models.TextField(blank=True, null=True)),
                ('receiver', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='received_requests', to=settings.AUTH_USER_MODEL)),
                ('sender', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sent_requests', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'unique_together': {('sender', 'receiver')},
            },
        ),
    ]