import jwt

from django.http import JsonResponse
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password, check_password
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings

from rest_framework.decorators import api_view
from rest_framework import status

from userprofiles.models import Profile  # Updated import
from posts.models import Post


# Register a new user
@csrf_exempt
@api_view(["POST"])
def register_user(request):
    username = request.data.get("username")
    password = request.data.get("password")

    if not username or not password:
        return JsonResponse(
            {"error": "Username and password are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(username=username).exists():
        return JsonResponse(
            {"error": "Username already exists"}, status=status.HTTP_409_CONFLICT
        )

    hashed_password = make_password(password)

    user = User(username=username, password=hashed_password)
    user.save()

    # Optionally create a Profile for the new user
    Profile.objects.create(user=user)

    return JsonResponse(
        {"message": "User registered successfully"}, status=status.HTTP_201_CREATED
    )


# Login a user
@csrf_exempt
@api_view(["POST"])
def login_user(request):
    username = request.data.get("username")
    password = request.data.get("password")

    if not username or not password:
        return JsonResponse(
            {"error": "Username and password are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = User.objects.filter(username=username).first()
    if user and check_password(password, user.password):
        jwt_secret = getattr(settings, "JWT_SECRET", None)
        if not jwt_secret:
            return JsonResponse(
                {"error": "JWT secret not configured"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        token = jwt.encode({"userId": str(user.id)}, jwt_secret, algorithm="HS256")
        return JsonResponse(
            {"message": "User logged in", "token": token}, status=status.HTTP_200_OK
        )
    else:
        return JsonResponse(
            {"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED
        )


# Create a new post
@csrf_exempt
@api_view(["POST"])
def create_post(request):
    title = request.data.get("title")
    content = request.data.get("content")
    author_id = request.data.get("author")  # Expecting author ID

    if not title or not content or not author_id:
        return JsonResponse(
            {"error": "Title, content, and author are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        author = User.objects.get(id=author_id)
    except User.DoesNotExist:
        return JsonResponse(
            {"error": "Author not found"}, status=status.HTTP_404_NOT_FOUND
        )

    try:
        post = Post(title=title, content=content, author=author)
        post.save()
        return JsonResponse({"message": "Post created"}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return JsonResponse(
            {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
