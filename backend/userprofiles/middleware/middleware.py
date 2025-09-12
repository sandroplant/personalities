import os
from functools import wraps

import jwt
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views import View
from rest_framework import status
from your_app.models import User  # Adjust import based on your User model


# Middleware to ensure user is authenticated
def authenticate_user(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        auth_header = request.META.get("HTTP_AUTHORIZATION")

        if not auth_header or not auth_header.startswith("Bearer "):
            return JsonResponse(
                {"error": "Access denied. No token provided."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        token = auth_header.replace("Bearer ", "").strip()

        try:
            # Verify the token
            decoded = jwt.decode(token, os.getenv("JWT_SECRET"), algorithms=["HS256"])
            user_id = decoded.get("id")

            # Attach user to request
            request.user = User.objects.get(id=user_id)
            return view_func(request, *args, **kwargs)

        except jwt.ExpiredSignatureError:
            return JsonResponse(
                {"error": "Token has expired."}, status=status.HTTP_401_UNAUTHORIZED
            )
        except jwt.InvalidTokenError:
            return JsonResponse(
                {"error": "Invalid token."}, status=status.HTTP_401_UNAUTHORIZED
            )
        except User.DoesNotExist:
            return JsonResponse(
                {"error": "User not found."}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return JsonResponse(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    return _wrapped_view


# Example of how to use the middleware
@method_decorator(authenticate_user, name="dispatch")
class YourViewClass(View):
    def get(self, request, *args, **kwargs):
        return JsonResponse({"message": "This is a GET request"})
