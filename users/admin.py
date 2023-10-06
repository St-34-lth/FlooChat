from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import *

admin.site.register(User, UserAdmin)
admin.site.register(Album)
admin.site.register( Photo)
admin.site.register(Friend)
admin.site.register(FriendshipRequest) 
admin.site.register(Post)
admin.site.register(Comment)
