import os
import bcrypt
import jwt
from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
from auth.models import User, Post  # Import your models
from django.contrib.auth.hashers import make_password
from django.conf import settings
from django.contrib.auth.hashers import check_password
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics
from rest_framework.response import Response
from .serializers import UserSerializer, PostSerializer  # Create serializers as needed

# Rate limiting can be handled using Django Rest Framework throttling

# Register a new user
@csrf_exempt
@api_view(['POST'])
def register_user(request):
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return JsonResponse({'error': 'Username and password are required'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return JsonResponse({'error': 'Username already exists'}, status=status.HTTP_409_CONFLICT)

    hashed_password = make_password(password)

    user = User(username=username, password=hashed_password)
    user.save()

    return JsonResponse({'message': 'User registered successfully'}, status=status.HTTP_201_CREATED)

# Login a user
@csrf_exempt
@api_view(['POST'])
def login_user(request):
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return JsonResponse({'error': 'Username and password are required'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.filter(username=username).first()
    if user and check_password(password, user.password):
        if not settings.JWT_SECRET:
            return JsonResponse({'error': 'JWT secret not configured'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        token = jwt.encode({'userId': str(user.id)}, settings.JWT_SECRET, algorithm='HS256')
        return JsonResponse({'message': 'User logged in', 'token': token}, status=status.HTTP_200_OK)
    else:
        return JsonResponse({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

# Create a new post
@csrf_exempt
@api_view(['POST'])
def create_post(request):
    title = request.data.get('title')
    content = request.data.get('content')
    author = request.data.get('author')

    if not title or not content or not author:
        return JsonResponse({'error': 'Title, content, and author are required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        post = Post(title=title, content=content, author=author)
        post.save()
        return JsonResponse({'message': 'Post created'}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
