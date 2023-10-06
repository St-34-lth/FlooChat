from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.urls import reverse,reverse_lazy
from django.http import JsonResponse,HttpResponseNotFound
from django.views.decorators.csrf import csrf_exempt
from rest_framework.parsers import JSONParser
from django.shortcuts import redirect
from django.contrib.auth import logout,login,authenticate
from rest_framework.decorators import api_view,authentication_classes,permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework import generics
from rest_framework import mixins
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework.authentication import SessionAuthentication
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.core.exceptions import ObjectDoesNotExist
from PIL import *
from .tasks import *
#my code starts here 
from .serializers import *
from .serializers import *
from .models import * 
import os 

""""
API views handle business logic, orchestrate different components, and manage HTTP-specifics (like status codes, methods allowed, etc.).
"""
#my code begins here 

# This class handles the retrieval of the current logged-in user's details.
class CurrentUserView(APIView):
    # Specifies that only authenticated users can access this view
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        # Check if the user is authenticated
        if user.is_authenticated:
            # Serialize the user data
            serializer = CurrentUserSerializer(request.user)
            # Return the serialized data with a 200 OK status
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            # Return an error message with a 401 Unauthorized status if the user is not authenticated
            return Response({"error": "user not authenticated"}, status=status.HTTP_401_UNAUTHORIZED)


# This class handles user login functionality
class UserLoginCall(APIView):
    # Specifies that any user, authenticated or not, can access this view
    permission_classes = [AllowAny]

    def post(self, request):
        # If the user is already authenticated, notify them and redirect to the user profile view
        if request.user.is_authenticated:
            return Response({"message": "User already authenticated", "redirect": reverse('currentuserprofile')}, status=status.HTTP_200_OK)

        # Get the username and password from the request data
        username = request.data.get('username')
        password = request.data.get('password')

        # Attempt to authenticate the user with the provided credentials
        user = authenticate(username=username, password=password)
        if user is not None:
            # If authentication is successful, log the user in and redirect to the user profile view
            login(request, user)
            return Response({"message": "Successfully authenticated", "redirect": reverse('currentuserprofile')}, status=status.HTTP_200_OK)

        # If authentication fails, return an error message with a 401 Unauthorized status
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)


# This class handles user logout functionality
class UserLogoutCall(APIView):
    def post(self, request):
        # Log the user out, which clears the session
        logout(request)
        # Return a success message with a 200 OK status
        return Response({"message": "Successfully logged out!"}, status=status.HTTP_200_OK)


# This class allows for updating user details, only authenticated users can access this endpoint
# Authentication is done via sessions
class UserUpdateCall(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [SessionAuthentication]


# This class handles user registration using a mix of CreateModelMixin and GenericAPIView
# It allows any user (even unauthenticated) to create a new user account
class UserRegistrationCall(mixins.CreateModelMixin, generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = UserRegistrationSerializer

    def perform_create(self, serializer):
        # Checks if the serializer is valid and then saves the user instance
        # Additionally, it triggers a task to create a profile image asynchronously
        if serializer.is_valid():
            user = serializer.save()
            makeProfileImg.delay(user.profile_pic.path) 

    def post(self, request, *args, **kwargs):
        # Handles the POST request to create a new user
        return self.create(request, *args, **kwargs)


# This class allows for listing all albums of the authenticated user
# It uses the GenericAPIView and ListModelMixin to create the list view
class AlbumListCall(generics.GenericAPIView, mixins.ListModelMixin):
    permission_classes = [IsAuthenticated]
    serializer_class = AlbumSerializer
    authentication_classes = [SessionAuthentication]

    def get_queryset(self):
        # Returns a queryset containing all albums of the authenticated user
        return self.request.user.album_set.all()

    def get(self, request, *args, **kwargs):
        # Handles the GET request to retrieve the list of albums
        # It fetches the user instance and then gets all albums related to that user
        # Then it serializes the data and returns the serialized list of albums
        user = User.objects.get(id=request.user.id)
        albums = user.album_set.all()
        serializer = AlbumSerializer(albums, many=True)
        return self.list(request, *args, **kwargs)


 
# URL configuration for the AlbumDetailCall view
# It maps a URL pattern to the view and assigns a name to it
"""
path('api/albums/<str:album_id>/', api.AlbumDetailCall.as_view(), name='api-user-album-details'),
fields = ['title', 'description', 'id']
"""
# This class provides detailed view for a specific album including options to update or delete the album
class AlbumDetailCall(generics.GenericAPIView, mixins.DestroyModelMixin, mixins.RetrieveModelMixin, mixins.UpdateModelMixin):
    queryset = Album.objects.all()  # Queryset contains all Album objects
    serializer_class = AlbumPhotosSerializer  # Specifies the serializer class to be used
    lookup_field = 'id'  # Specifies the field to be used for lookup
    lookup_url_kwarg = 'album_id'  # Specifies the keyword argument in the URL conf to be used for lookup

    def put(self, request, *args, **kwargs):
        # Handles the PUT request to fully update an album
        return self.update(request, *args, **kwargs)

    def patch(self, request, *args, **kwargs):
        # Handles the PATCH request to partially update an album
        return self.partial_update(request, *args, **kwargs)

    def delete(self, request, *args, **kwargs):
        # Handles the DELETE request to delete an album
        return self.destroy(request, *args, **kwargs)

    def get(self, request, *args, **kwargs):
        # Handles the GET request to retrieve the details of an album
        return self.retrieve(request, *args, **kwargs)


# This class handles album creation functionality
class AlbumCreateCall(generics.GenericAPIView, mixins.CreateModelMixin):
    serializer_class = AlbumSerializer
    
    def get_serializer_context(self):
        context =  super().get_serializer_context()
        context['request'] =self.request
        return context 
    
    def post(self, request, *args, **kwargs):
        # Handles the POST request to create a new album
        try:
            data = request.data.copy()  # Copy the request data to make it mutable
            data['user'] = request.user.id  # Add the user ID to the data

            # Create a serializer instance with the modified data and current context
            serializer = AlbumSerializer(data=data, context={'request': request})

            # If the serializer is valid, save the instance and return a success message with 201 CREATED status
            if serializer.is_valid():
                serializer.save()
                return Response({'message': 'success', 'data': serializer.data}, status=status.HTTP_201_CREATED)
            else:
                # If the serializer is not valid, print the errors and return them with 400 BAD REQUEST status
                print(serializer.errors)
                return Response({"errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        except ValidationError as e:
            # In case of a validation error, return the error message with 400 BAD REQUEST status
            return Response({"errors": 'exception' + str(e)}, status=status.HTTP_400_BAD_REQUEST)

class PhotoDetailView(APIView, mixins.UpdateModelMixin, mixins.DestroyModelMixin):
    """
    API endpoint for detailed view of a photo. Supports GET, POST, PATCH, and DELETE methods.
    URL path: 'api/photo/<int:photo_id>/'
    Fields: 'user', 'image', 'id', 'album', 'caption', 'created_at', 'post'
    """
    permission_classes = [IsAuthenticated]
    authentication_classes = [SessionAuthentication]
    
    def get_object(self):
        # Retrieves the photo object using the ID passed in the URL
        try:
            return Photo.objects.get(id=self.kwargs['photo_id'])
        except Photo.DoesNotExist as e:
            raise e

    def get_serializer(self, *args, **kwargs):
        # Returns an instance of the PhotoSerializer
        return PhotoSerializer(*args, **kwargs)

    def post(self, request, *args, **kwargs):
        # Handles the POST request to create a new photo entry
        try:
            data = request.data.copy()
            data['user'] = request.user.id

            serializer = PhotoSerializer(data=data, context={'request': request})
            if serializer.is_valid():
                serializer.save()
                return Response({'message': 'success', 'data': serializer.data}, status=status.HTTP_201_CREATED)
            else:
                print(serializer.errors)
                return Response({"errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        except ValidationError as e:
            return Response({"errors": 'exception' + str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request, *args, **kwargs):
        # Handles the GET request to retrieve photo details
        try:
            queryset = Photo.objects.get(id=self.kwargs['photo_id'])
            serializer = PhotoSerializer(queryset, context={'request': request})
            return Response({'message': 'success', 'data': serializer.data}, status=status.HTTP_200_OK)
        except Photo.DoesNotExist:
            return Response({'message': 'failed', 'errors': "no photo"}, status=status.HTTP_404_NOT_FOUND)
        except ValidationError as e:
            return Response({'message': 'failed', 'errors': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, *args, **kwargs):
        # Handles the PATCH request to partially update photo details
        try:
            return self.partial_update(request, *args, **kwargs)
        except Photo.DoesNotExist:
            return Response({'message': 'failed', 'errors': 'Photo not found'}, status=status.HTTP_404_NOT_FOUND)
        except ValidationError as e:
            return Response({'message': 'failed', 'errors': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, *args, **kwargs):
        # Handles the DELETE request to remove a photo entry
        try:
            return self.destroy(request, *args, **kwargs)
        except Photo.DoesNotExist:
            return Response({'message': 'failed', 'errors': 'Photo not found'}, status=status.HTTP_404_NOT_FOUND)


class PhotosListCall(generics.GenericAPIView, mixins.ListModelMixin):
    """
    API endpoint to list all photos for authenticated users.
    """
    serializer_class = PhotoListSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [SessionAuthentication]
 

class FriendRequestDetailCall(APIView):
    """
    API endpoint to handle individual friend requests. Supports GET, POST, and PUT methods.
    """
    permission_classes = [IsAuthenticated]
    authentication_classes = [SessionAuthentication]

    def get_queryset(self):
        # Gets the queryset of friendship requests involving the current user
        queryset = FriendshipRequest.objects.filter(Q(sender=self.request.user) | Q(receiver=self.request.user))
        return queryset

    def get(self, request):
        """Handles the GET request to list the friend requests involving the current user."""
        try:
            queryset = self.get_queryset()
            serializer = FriendshipRequestSerializer(queryset, many=True)
            return Response({'message': 'success', 'data': serializer.data}, status.HTTP_200_OK)
        except FriendshipRequest.DoesNotExist:
            return Response({'message': 'failed', 'errors': "Friendship request does not exist."}, status.HTTP_400_BAD_REQUEST)
        except ValidationError as e:
            return Response({'message': 'failed', 'errors': str(e)}, status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        """Handles the POST request to create a new friend request."""
        try:
            data = dict(request.data)
            serializer = FriendshipRequestSerializer(data=data)

            if serializer.is_valid(raise_exception=True):
                friendship = serializer.save()
                return Response({'message': 'success', 'data': serializer.data}, status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response({'message': 'validation exception raised', 'errors': str(e)}, status.HTTP_400_BAD_REQUEST)

    def put(self, request, request_id):
        """
        Handles the PUT request to update the status of a friend request.
        """
        try:
            receiver = request.user
            fRequest = get_object_or_404(FriendshipRequest, id=request_id)
            serializer = FriendshipRequestSerializer(instance=fRequest, data={"status": request.data.get('status')}, partial=True)

            if serializer.is_valid(raise_exception=True):
                serializer.save()
                return Response({'message': 'success', 'data': serializer.data}, status.HTTP_202_ACCEPTED)
            else:
                print(serializer.errors)
                return Response({'message': 'failed', 'errors': serializer.errors}, status.HTTP_400_BAD_REQUEST)
        except ValidationError as e:
            return Response({'message': 'exception raised', "errors": str(e)}, status.HTTP_400_BAD_REQUEST)


class FriendRequestListCall(generics.GenericAPIView, mixins.ListModelMixin):
    """
    API endpoint to list all friend requests for the authenticated user. Supports GET method.
    """
    serializer_class = FriendshipRequestSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [SessionAuthentication]

    def get_queryset(self):
        # Gets the queryset of friendship requests involving the current user
        queryset = FriendshipRequest.objects.filter(Q(sender=self.request.user) | Q(receiver=self.request.user))
        return queryset

    def get(self, request, *args, **kwargs):
        """Handles the GET request to list all friend requests."""
        return self.list(request, *args, **kwargs)

class PostListCall(generics.GenericAPIView, mixins.ListModelMixin):
    """
    Returns a user's list of posts based on user_id.
    
    URL pattern: path('api/posts/<str:user_id>/', api.PostListCall.as_view(), name='api-posts-all')
    """
    
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [SessionAuthentication]
    lookup_url_kwarg = 'user_id'
    
    def get_queryset(self):
        """
        Retrieve the queryset of posts by the user specified in the URL kwargs.

        Raises:
            Exception: Any exception raised during the process of fetching the queryset.
        """
        try:
            user = User.objects.get(id=self.kwargs['user_id'])
            queryset = Post.objects.filter(user=user)
            return queryset
        except Exception as e:
            raise e   
        
    def get(self, request, *args, **kwargs):
        """
        Handles GET requests and returns a list of posts by invoking the list method.
        """
        return self.list(request, *args, **kwargs)


class PostDetailCall(APIView):
    """
    Handles CRUD operations for a Post instance.
    
    URL pattern: path('api/post-details/<str:user_id>/', ...)
    """

    permission_classes = [IsAuthenticated]
    authentication_classes = [SessionAuthentication]
    
    def usersAreFriends(self, postViewer, poster):
        """
        Checks if the post viewer and poster are friends.

        Args:
            postViewer: The user viewing the post.
            poster: The user who created the post.

        Returns:
            bool: True if they are friends, False otherwise.
        """
        return Friend.objects.filter(
            user_1=postViewer, user_2=poster
        ).exists() or Friend.objects.filter(
            user_1=poster, user_2=postViewer
        ).exists()
    
    def get_queryset(self, user_id):
        """
        Retrieves a queryset of posts based on the friendship status between the requester and the user specified by user_id.

        Args:
            user_id: The ID of the user whose posts are being retrieved.

        Raises:
            Exception: Any exception raised during the process of fetching the queryset.
        """
        try:
            requester = self.request.user
            postsForUser = User.objects.get(id=user_id)

            if requester.id == postsForUser.id:
                queryset = Post.objects.filter(user=requester)
            else:
                if self.usersAreFriends(requester.id, postsForUser):
                    queryset = Post.objects.filter(user=postsForUser)
            
            return queryset
        except Exception as e:
            raise e
        
    def get(self, request, *args, **kwargs):
        """
        Handles GET requests to retrieve details of a specific post based on post_id and photo_id query parameters.

        Returns:
            Response: A JSON response containing the post details or an error message.
        """
        try:
            post_id = request.query_params.get('post_id')
            photo_id = request.query_params.get('photo_id')
            serializer = PostSerializer(instance=Post.objects.get(id=post_id), context={'post_id': post_id, 'photo_id': photo_id})
            return Response({'message': 'success', 'data': serializer.data}, status.HTTP_200_OK)
        except Post.DoesNotExist as e:
            return Response({'message': 'failed', 'errors': str(e)}, status.HTTP_400_BAD_REQUEST)
        except ValidationError as e:
            return Response({'message': 'failed', 'errors': str(e)}, status.HTTP_400_BAD_REQUEST)
        
    
    def post(self, request, *args, **kwargs):
        """
        Handles POST requests to create a new post.

        Returns:
            Response: A JSON response containing the created post details or an error message.
        """
        try: 
            data = request.data.copy()
            image = data.get('image')
            serializer = PostSerializer(data=data, context={'request': request, 'image': image})
            
            if serializer.is_valid(raise_exception=True):
                serializer.save()
                return Response({'message': 'success', 'data': serializer.data}, status=status.HTTP_201_CREATED)
            else:
                return Response({'message': 'failed', 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            return Response({'message': 'failed', 'errors': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        

    def put(self, request, *args, **kwargs):
        """
        Handles PUT requests to update an existing post based on the post_id query parameter.

        Returns:
            Response: A JSON response containing the updated post details or an error message.
        """
        try:
            user = self.request.user
            post_id = self.request.query_params.get('post_id')
            post = get_object_or_404(Post, id=post_id)
            data = request.data.copy()
            
            if self.request.data.get('photo') is not None:
                photo = Photo.objects.create(user=user, image=self.request.data.get('photo'), caption="")
                photo.post = post
                photo.save()
                data['photo_id'] = photo.id 
            
            serializer = PostSerializer(instance=post, data=data, partial=True)
            
            if serializer.is_valid(raise_exception=True):
                serializer.save()
                return Response({'message': 'success', 'data': serializer.data}, status=status.HTTP_202_ACCEPTED)
            else:
                return Response({'message': 'failed', 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            return Response({'message': 'failed', 'errors': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        

    def delete(self, request, *args, **kwargs):    
        """
        Handles DELETE requests to remove a post based on the post_id query parameter.

        Returns:
            Response: A JSON response indicating whether the deletion was successful or an error message.
        """
        try: 
            user = request.user
            post_id = self.request.query_params.get('post_id')
            post = get_object_or_404(Post, id=post_id, user=user)
            post.delete()
            return Response({'message': 'success deletion'}, status=status.HTTP_202_ACCEPTED)
        
        except Post.DoesNotExist as e:
            return Response({'message': 'failed', 'errors': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    
class CommentDetailCall(APIView):
    """
    API view to handle the CRUD operations for comments.
    """
    permission_classes = [IsAuthenticated]
    authentication_classes = [SessionAuthentication]

    def get_queryset(self):
        """
        Retrieves the queryset of comments related to a specific post.

        Returns:
            QuerySet: A queryset containing the comments of the specified post.
        """
        queryset = Comment.objects.all()
        post = Post.objects.get(id=self.kwargs['post_id'])
        
        return queryset.filter(post=post)

    def get(self, request, *args, **kwargs):
        """
        Handles GET requests to retrieve comments for a specific post.

        Returns:
            Response: A JSON response containing the comments or an error message.
        """
        try:
            queryset = self.get_queryset()
            serializer = CommentSerializer(queryset, many=True)

            return Response({'message': 'success', 'data': serializer.data}, status=status.HTTP_200_OK)
        except Post.DoesNotExist:
            return Response({'message': 'failed', 'errors': 'Post not found'}, status=status.HTTP_400_BAD_REQUEST)
        except ValidationError as e:
            return Response({'message': 'failed', 'errors': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request, *args, **kwargs):
        """
        Handles POST requests to create a new comment on a specific post.

        Returns:
            Response: A JSON response containing the created comment details or an error message.
        """
        try:
            data = {'user': self.request.user.id, "post": self.kwargs['post_id'], "content": self.request.data.get('content')}
            serializer = CommentSerializer(data=data)

            if serializer.is_valid():
                serializer.save()
                return Response({'message': 'success', 'data': serializer.data}, status=status.HTTP_200_OK)
            else:
                return Response({'message': 'Validation error', 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        
        except Post.DoesNotExist:
            return Response({'message': 'post not found', 'errors': 'Post not found'}, status=status.HTTP_204_NO_CONTENT)
        except ValidationError as e:
            return Response({'message': 'Invalid data', 'errors': str(e)}, status=status.HTTP_406_NOT_ACCEPTABLE)

    def delete(self, request, *args, **kwargs):
        """
        Handles DELETE requests to remove a specific comment based on the comment_id query parameter.

        Returns:
            Response: A JSON response indicating whether the deletion was successful or an error message.
        """
        try:
            comment_id = self.request.query_params.get('comment_id')
            comment = get_object_or_404(Comment, id=comment_id)
            comment.delete()
            return Response({'message': 'success deletion'}, status=status.HTTP_202_ACCEPTED)

        except Comment.DoesNotExist as e:
            return Response({'message': 'failed', 'errors': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
class FriendsListCall(generics.GenericAPIView, mixins.ListModelMixin):
    """
    API View class to handle retrieving the list of friends for the authenticated user.

    """
    
    serializer_class = FriendListSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [SessionAuthentication]

    def get_queryset(self):
        """
        Retrieves the queryset of friends related to the authenticated user. 
        Filters the queryset to only include relationships where the authenticated user 
        is either the user_1 or user_2 in the friendship relationship.

        Returns:
            QuerySet: A queryset containing the friends of the authenticated user.
        """
        queryset = Friend.objects.all()
        queryset = queryset.filter(Q(user_1=self.request.user) | Q(user_2=self.request.user))

        return queryset

    def get(self, request, *args, **kwargs):
        """
        Handles GET requests to retrieve the list of friends for the authenticated user.

        Returns:
            Response: A JSON response containing the list of friends or an error message.
        """
        return self.list(request, *args, **kwargs)
    
class FriendDetailCall(APIView):
    """
    This view handles the details of a single friend entity.
    It allows retrieving details of a friend by their ID and deleting a friend entity.
    """
    permission_classes = [IsAuthenticated]
    authentication_classes = [SessionAuthentication]
    kwargs = 'friend_id'

    def get(self, request, *args, **kwargs):
        """
        Handle GET requests to retrieve details of a friend by their ID.

        Returns:
            Response: A JSON response containing the friend details or an error message.
        """
        try:
            friend = get_object_or_404(Friend, id=self.kwargs['friend_id'])
            serializer = FriendListSerializer(friend)
            return Response({'message': 'success', 'data': serializer.data}, status.HTTP_200_OK)
        except Exception as e:
            return Response({'message': 'failed', 'errors': str(e)}, status.HTTP_400_BAD_REQUEST)

    def delete(self, request, *args, **kwargs):
        """
        Handle DELETE requests to remove a friend entity from the database by their ID.

        Returns:
            Response: A JSON response indicating the success or failure of the deletion operation.
        """
        try:
            friend = get_object_or_404(Friend, id=self.kwargs['friend_id'])
            friend.delete()
            return Response({'message': 'success deletion'}, status.HTTP_202_ACCEPTED)
        except Friend.DoesNotExist as e:
            return Response({'message': 'failed', 'errors': str(e)}, status.HTTP_400_BAD_REQUEST)

class FriendSearchCall(APIView):
    """
    This view handles the search functionality for friends.
    It allows searching for a friend by username and retrieving details of the friend relationship.
    """
    permission_classes = [IsAuthenticated]
    authentication_classes = [SessionAuthentication]

    def get_queryset(self):
        """
        Retrieves the friend entity based on the username provided in the request.

        Returns:
            QuerySet: A queryset containing the friend entity or raises an exception if not found.
        """
        try:
            user = self.request.user
            searching_for = User.objects.get(username=self.kwargs['username'])
            queryset = Friend.objects.get(user_1=user, user_2=searching_for)
            return queryset
        except ObjectDoesNotExist as e:
            raise e

    def get(self, request, *args, **kwargs):
        """
        Handles GET requests to retrieve the friend entity based on the search query.

        Returns:
            Response: A JSON response containing the friend details or an error message.
        """
        try:
            queryset = self.get_queryset()
            serializer = FriendListSerializer(queryset)
            return Response({'message': 'success', 'data': serializer.data}, status.HTTP_200_OK)
        except ObjectDoesNotExist:
            return Response({'message': 'failed', 'errors': "No friends with this username found"}, status.HTTP_204_NO_CONTENT)
        except ValidationError as e:
            return Response({'message': 'failed', 'errors': str(e)}, status.HTTP_400_BAD_REQUEST)
        
        
class UserSearchCall(generics.GenericAPIView, mixins.ListModelMixin):
    """
    This view facilitates the user search functionality by a query which can be either
    username, first name or last name.
    """
    permission_classes = [AllowAny]
    authentication_classes = [SessionAuthentication]
    serializer_class = CurrentUserSerializer

    def get_queryset(self):
        """
        Retrieves a queryset of users matching the search query which can be a username,
        first name, or last name.

        Returns:
            QuerySet: A queryset of matching users or raises an exception if not found.
        """
        try:
            query = self.kwargs['query']
            queryset = User.objects.filter(Q(username=query) | Q(first_name=query) | Q(last_name=query))
            return queryset
        except ObjectDoesNotExist as e:
            raise e

    def get(self, request, *args, **kwargs):
        """
        Handles GET requests to retrieve a list of users matching the search query.

        Returns:
            Response: A JSON response containing a list of users or an error message.
        """
        try:
            return self.list(request, *args, **kwargs)
        except ObjectDoesNotExist:
            return Response({'message': 'failed', 'errors': "No users found with this query"}, status.HTTP_204_NO_CONTENT)
        except ValidationError as e:
            return Response({'message': 'failed', 'errors': str(e)}, status.HTTP_400_BAD_REQUEST)

class UserDetailCall(generics.GenericAPIView, mixins.RetrieveModelMixin):
    """
    This view handles the retrieval of detailed information about a user identified by their ID.
    """
    permission_classes = [AllowAny]
    authentication_classes = [SessionAuthentication]
    serializer_class = CurrentUserSerializer
    lookup_field = 'id'
    lookup_url_kwarg = 'user_id'
    queryset = User.objects.all()

    def get(self, request, *args, **kwargs):
        """
        Handles GET requests to retrieve the details of a user by their ID.

        Returns:
            Response: A JSON response containing the user details or initiates a retrieve action
            in case of model mixins.
        """
        return self.retrieve(request, *args, **kwargs)
