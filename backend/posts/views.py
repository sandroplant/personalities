import os
from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
from .models import Post  # Import your Post model
from django.utils.decorators import method_decorator
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import generics
from .serializers import PostSerializer  # Create a serializer for Post

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
        new_post = Post(title=title, content=content, author=author)
        new_post.save()
        return JsonResponse({'message': 'Post created'}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Get all posts
@api_view(['GET'])
def get_posts(request):
    try:
        posts = Post.objects.all()
        serializer = PostSerializer(posts, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return JsonResponse({'error': 'Error fetching posts'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Get post by ID
@api_view(['GET'])
def get_post_by_id(request, id):
    try:
        post = Post.objects.get(id=id)
        serializer = PostSerializer(post)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Post.DoesNotExist:
        return JsonResponse({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return JsonResponse({'error': 'Error fetching post'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Delete post by ID
@api_view(['DELETE'])
def delete_post(request, id):
    try:
        post = Post.objects.get(id=id)
        post.delete()
        return JsonResponse({'message': 'Post deleted'}, status=status.HTTP_200_OK)
    except Post.DoesNotExist:
        return JsonResponse({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return JsonResponse({'error': 'Error deleting post'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
