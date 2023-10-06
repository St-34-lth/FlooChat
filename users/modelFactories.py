import factory
import faker 
from random import randint
from random import choice
from django.test import TestCase
from django.conf import settings
from django.core.files import File
from .models import *
import uuid 
#my code starts here 
f =  faker.Faker()




class UserFactory(factory.django.DjangoModelFactory):
    
    username =  factory.Sequence(lambda n: 'user%d' % n) 
    first_name = factory.Faker('sentence', nb_words=1)
    last_name = factory.Faker('sentence', nb_words=1)
    id = uuid.uuid4()
 
    class Meta:
        model = User

    
    
class FriendFactory(factory.django.DjangoModelFactory):
    
    user_1= factory.SubFactory(UserFactory)
    user_2= factory.SubFactory(UserFactory)

    class Meta:
        model = Friend 


