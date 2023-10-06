from __future__ import absolute_import

import os 
import time 
from celery import Celery 
from django.conf import settings

# CELERY_BROKER_URL = 'redis://localhost:6379/0' 
os.environ.setdefault('DJANGO_SETTINGS_MODULE','FlooChat.settings')
app = Celery('FlooChat',broker='redis://localhost:6379/0',backend='redis://localhost:6379/0')
app.config_from_object('django.conf:settings',namespace='CELERY')
app.autodiscover_tasks()