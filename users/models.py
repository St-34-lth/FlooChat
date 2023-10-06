from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone, timesince
from django.utils.translation import gettext_lazy as _
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.exceptions import ValidationError
import uuid

#my code begins here

# Defines the directories where user photos and profile pictures will be stored.
def userPhotoDir(instance, filename):
    """Stores the image in a folder named after the user's ID under 'user_photos'."""
    return f'user_photos/{instance.user.id}/{filename}'

def userPicsDir(instance, filename):
    """Stores the image in a folder named after the user's ID under 'profile_pics'."""
    return f'profile_pics/{instance.id}/{filename}'


class User(AbstractUser):
    """User model extending AbstractUser with additional fields for profile pictures and thumbnails."""
    profile_pic = models.ImageField(upload_to=userPicsDir, null=False, blank=True, default='images/default_pic.jpeg')
    thumbnail = models.ImageField(upload_to=userPicsDir, null=True)
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)


class Conversation(models.Model):
    """Model representing a conversation between users."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    users = models.ManyToManyField(User, related_name='conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)

    def modified_at_formatted(self):
        """Returns a human-readable representation of the time since the conversation was modified."""
        return timesince.timesince(self.created_at)


class ConversationMessage(models.Model):
    """Model representing a message within a conversation."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, related_name='messages', on_delete=models.CASCADE)
    body = models.TextField()
    sent_to = models.ForeignKey(User, related_name='received_messages', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, related_name='sent_messages', on_delete=models.CASCADE)

    def created_at_formatted(self):
        """Returns a human-readable representation of the time since the message was created."""
        return timesince.timesince(self.created_at)


class PostType(models.TextChoices):
    """Enumeration defining the types of posts that can be created."""
    REGULAR_POST = "R", _('Regular Post')
    STATUS_UPDATE = "SU", _('Status Update')


class Post(models.Model):
    """Model representing a post created by a user."""
    class PostType(models.TextChoices):  # Use TextChoices so that the database stores human-readable values
        REGULAR_POST = "R",_('Regular Post')
        STATUS_UPDATE = "SU",_('Status Update')
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    post_type = models.CharField(choices=PostType.choices, max_length=2, default=PostType.REGULAR_POST)


class Album(models.Model):
    """Model representing an album created by a user."""
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    created_date = models.DateTimeField(auto_now_add=True)


class Photo(models.Model):
    """Model representing a photo uploaded by a user."""
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, blank=False)
    album = models.ForeignKey(Album, on_delete=models.CASCADE, blank=True, null=True)
    image = models.ImageField(upload_to=userPhotoDir)
    caption = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    post = models.ForeignKey(Post, on_delete=models.SET_NULL, blank=True, null=True)


class Comment(models.Model):
    """Model representing a comment on a post."""
    id = models.BigAutoField(primary_key=True)
    post = models.ForeignKey(Post, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)


class StatusUpdate(models.Model):
    """Model representing a status update tied to a post."""
    post = models.ForeignKey(Post, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)


class Friend(models.Model):
    """Model representing a friendship between two users."""
    id = models.BigAutoField(primary_key=True)
    user_1 = models.ForeignKey(User, related_name='user1', on_delete=models.DO_NOTHING)
    user_2 = models.ForeignKey(User, related_name='user2', on_delete=models.DO_NOTHING)

    class Meta:
        unique_together = ('user_1', 'user_2')
        indexes = [models.Index(fields=['user_1', 'user_2'])]


class FriendshipRequest(models.Model):
    """Model representing a friendship request between two users, with status tracking."""
    PENDING = 'pending'
    ACCEPTED = 'accepted'
    REJECTED = 'rejected'

    STATUS_CHOICES = (
        (PENDING, 'Pending'),
        (ACCEPTED, 'Accepted'),
        (REJECTED, 'Rejected'),
    )

    id = models.BigAutoField(primary_key=True)
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_requests')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_requests')
    timestamp = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    message = models.TextField(blank=True, null=True)

    def clean(self):
        """Prevents users from sending friendship requests to themselves."""
        if self.receiver == self.sender:
            raise ValidationError('cannot send friend request to the same user id')

    def save(self, *args, **kwargs):
        """Overrides save method to incorporate clean method for validation before saving."""
        self.full_clean()
        super().save(*args, **kwargs)

    class Meta:
        unique_together = ('sender', 'receiver')


@receiver(post_save, sender=FriendshipRequest)
def create_friendship(sender, instance, created, **kwargs):
    """Signal handler to manage the creation and deletion of friendship records based on the status of friend requests."""

    # Check if a friendship already exists between the sender and receiver.
    friendship_exists = Friend.objects.filter(
        user_1=instance.sender, user_2=instance.receiver
    ).exists() or Friend.objects.filter(
        user_1=instance.receiver, user_2=instance.sender
    ).exists()

    if created and friendship_exists:
        # If a friend request is created and a friendship already exists, raise a validation error.
        raise ValidationError("already friends")

    if not created and instance.status == FriendshipRequest.ACCEPTED:
        # If the friend request status is changed to accepted, create a new friendship record if one doesn't already exist.
        if not friendship_exists:
            Friend.objects.create(user_1=instance.sender, user_2=instance.receiver)
            instance.delete()

    if not created and instance.status == FriendshipRequest.REJECTED:
        # If the friend request status is changed to rejected, delete the friend request record.
        instance.delete()


# Connecting the create_friendship signal handler to the post_save signal of the FriendshipRequest model.
post_save.connect(create_friendship, sender=FriendshipRequest)
