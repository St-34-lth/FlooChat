from rest_framework import serializers
from PIL import *
from django.db.models import Q
from rest_framework.serializers import ImageField, FileField
from .models import *
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from rest_framework.utils.serializer_helpers import ReturnDict
from rest_framework import status


#my code begins here 

# Serializer to handle User details in the current session
class CurrentUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile_pic']


# Serializer to handle Album creation and representation
class AlbumSerializer(serializers.ModelSerializer):
    class Meta:
        model = Album
        fields = ['user', 'title', 'description', 'id']

    def create(self, validated_data):
        album = Album.objects.create(**validated_data)
        return album


# Serializer to handle Photo creation and updates
class PhotoSerializer(serializers.ModelSerializer):
    album = serializers.PrimaryKeyRelatedField(queryset=Album.objects.all(), required=False, allow_null=True)
    user = serializers.PrimaryKeyRelatedField(default=serializers.CurrentUserDefault(), queryset=User.objects.all())
    post = serializers.PrimaryKeyRelatedField(queryset=Post.objects.all(), required=False, allow_null=True)

    def update(self, instance, validated_data):
        allowed_fields = ['caption', 'album', 'post']
        for attr, value in validated_data.items():
            if attr in allowed_fields:
                setattr(instance, attr, value)
        instance.save()
        return instance

    class Meta:
        model = Photo
        fields = ['user', 'image', 'id', 'album', 'caption', 'created_at', 'post']


# Serializer to handle User registration, including password validation
class UserRegistrationSerializer(serializers.ModelSerializer):
    password1 = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password1', 'password2', 'profile_pic']

    def validate(self, data):
        if data['password1'] != data['password2']:
            raise serializers.ValidationError({"password2": "Password fields didn't match."})
        else:
            validate_password(data['password1'])
        return data

    def create(self, validated_data):
        password = validated_data.pop('password1')
        validated_data.pop('password2', None)
        user = User.objects.create_user(
            **validated_data,
            password=password
        )
        return user


# Serializer to represent Album with photos
class AlbumPhotosSerializer(serializers.ModelSerializer):
    photos = PhotoSerializer(source='photo_set', many=True)
    user = CurrentUserSerializer

    class Meta:
        model = Album
        fields = ['title', 'description', 'id', 'photos', 'user']


# Serializer to list Photos with specific fields
class PhotoListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Photo
        fields = ['name', 'image', 'thumbnail']


# Serializer to handle Friendship requests and validations
class FriendshipRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = FriendshipRequest
        fields = ['id', 'sender', 'receiver', 'status']

    def to_representation(self, instance):
        repr = super().to_representation(instance)
        repr['sender'] = CurrentUserSerializer(instance=User.objects.get(id=repr['sender'])).data
        repr['receiver'] = CurrentUserSerializer(instance=User.objects.get(id=repr['receiver'])).data
        return repr

    def validate_status(self, value):
        if value not in ['accepted', 'rejected']:
            raise serializers.ValidationError('invalid status choice')
        return value

    def validate(self, data):
        if self.instance:
            return data

        if FriendshipRequest.objects.filter(sender=data['sender'], receiver=data['receiver']).exists():
            raise serializers.ValidationError("A request from this sender to this receiver already exists.")

        friendship_exists = Friend.objects.filter(
            user_1=data['sender'], user_2=data['receiver']
        ).exists() or Friend.objects.filter(
            user_1=data['receiver'], user_2=data['sender']
        ).exists()

        if friendship_exists:
            raise serializers.ValidationError('Already friends', 406)

        return data

    def update(self, instance, validated_data):
        instance.status = validated_data.get('status', instance.status)
        instance.save()
        return instance

    def create(self, validated_data):
        return FriendshipRequest.objects.create(sender=validated_data['sender'], receiver=validated_data['receiver'])


# Serializer to handle Post creation, representation, and updates
class PostSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(default=serializers.CurrentUserDefault(), queryset=User.objects.all())
    photo = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ['id', 'content', 'photo', 'created_at', 'post_type', 'user']

    def get_photo(self, obj):
        # Logic to handle getting photo details for a post
        try:
            image = self.context.get('image')
            post_id = self.context.get('post_id')
            photo_id = self.context.get('photo_id')

            if post_id is not None:
                post = Post.objects.get(id=post_id)
            else:
                post = Post.objects.get(id=obj.id)

            if image is not None:
                photo, created = Photo.objects.get_or_create(post=obj, user=obj.user, image=image, caption='')
            elif photo_id is not None:
                photo = get_object_or_404(Photo, id=photo_id)
            elif post is not None:
                photo = Photo.objects.get(post=post)

            return PhotoSerializer(photo).data if photo else None

        except Photo.DoesNotExist:
            return None
        except Exception as e:
            return e

    def to_representation(self, instance):
        # Logic to modify how an instance is represented
        try:
            repr = super().to_representation(instance)
            repr['user'] = CurrentUserSerializer(User.objects.get(id=repr['user'])).data
            if repr['photo']:
                photo_id = repr['photo']['id'] if isinstance(repr['photo'], dict) else repr['photo']
                repr['photo'] = PhotoSerializer(Photo.objects.get(id=photo_id)).data
            return repr
        except KeyError as e:
            return e

    def update(self, instance, validated_data):
        allowed_fields = ['content', 'photo']
        for attr, value in validated_data.items():
            if attr in allowed_fields:
                setattr(instance, attr, value)
        instance.save()
        return instance

    def validate(self, data):
        if self.instance:
            return data
        return data

    def create(self, validated_data):
        return Post.objects.create(**validated_data)


# Serializer to list Friends with detailed user information
class FriendListSerializer(serializers.ModelSerializer):
    user_1 = CurrentUserSerializer()
    user_2 = CurrentUserSerializer()

    class Meta:
        model = Friend
        fields = ['user_1', 'user_2', 'id']


# Serializer to handle Comment creation and representation
class CommentSerializer(serializers.ModelSerializer):
    post = serializers.PrimaryKeyRelatedField(queryset=Post.objects.all(), required=True)
    user = serializers.PrimaryKeyRelatedField(default=serializers.CurrentUserDefault(), queryset=User.objects.all())

    class Meta:
        model = Comment
        fields = '__all__'

    def to_representation(self, instance):
        repr = super().to_representation(instance)
        repr['user'] = CurrentUserSerializer(instance.user).data
        return repr

    def validate(self, initial_data):
        return initial_data

    def create(self, validated_data):
        return Comment.objects.create(**validated_data)
