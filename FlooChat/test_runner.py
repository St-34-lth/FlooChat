# your_app/test_runner.py
from django.test.runner import DiscoverRunner
from django.conf import settings 
from celery import *
import os

import redis

class CustomTestRunner(DiscoverRunner):

    def setup_test_environment(self, **kwargs):
        super().setup_test_environment(**kwargs)
        
        # Point Celery to the test Redis database
        from celery import current_app
        test_broker_url = 'redis://localhost:6379/1'
        current_app.conf.update(BROKER_URL=test_broker_url)

        # Flush the Redis test database
        r = redis.StrictRedis(host='localhost', port=6379, db=1)
        r.flushdb()

    def teardown_test_environment(self, **kwargs):
        # Reset settings to the development database
        os.environ.setdefault('DJANGO_SETTINGS_MODULE','FlooChat.settings')
        app = Celery('FlooChat', broker='redis://localhost:6379/0', backend='redis://localhost:6379/0')
        app.config_from_object('django.conf:settings', namespace='CELERY')
        app.autodiscover_tasks()

        # Flush the Redis test database again
        r = redis.StrictRedis(host='localhost', port=6379, db=1)
        r.flushdb()

        super().teardown_test_environment(**kwargs)
