from django.urls import path,include
import django.contrib.auth.urls 
from . import views



urlpatterns = [
    path('',views.index,name='chat-home'),
    path('<str:room_name>/',views.room,name='room')
    
    ]