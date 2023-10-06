from django.contrib.auth.forms import UserCreationForm
from .models import User
from django import forms
#my code begins here

class UserRegistrationForm(UserCreationForm):
    class Meta:
        model = User
        fields = ['username', 'first_name', 'last_name', 'password1', 'password2','profile_pic']
        
        

    