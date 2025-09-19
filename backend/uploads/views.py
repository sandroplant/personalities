from urllib.parse import urljoin

from django.conf import settings
from django.core.files.storage import FileSystemStorage
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from rest_framework import status
from rest_framework.decorators import api_view

from .validators import (  # Custom validators for file upload
    validate_file_extension,
    validate_file_size,
)


# Upload a single file route with CSRF protection and rate limiting
@csrf_exempt
@api_view(["POST"])
def upload_file(request):
    if "file" not in request.FILES:
        return JsonResponse({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

    file = request.FILES["file"]

    # Validate file size and extension
    file_size_error = validate_file_size(file.size)
    if file_size_error:
        return JsonResponse({"error": file_size_error}, status=status.HTTP_400_BAD_REQUEST)

    file_extension_error = validate_file_extension(file.name)
    if file_extension_error:
        return JsonResponse({"error": file_extension_error}, status=status.HTTP_400_BAD_REQUEST)

    # Save the file
    fs = FileSystemStorage()
    filename = fs.save(file.name, file)
    file_url = urljoin(settings.MEDIA_URL, filename)

    return JsonResponse(
        {
            "message": "File uploaded successfully",
            "file": {
                "name": file.name,
                "url": file_url,
                "size": file.size,
                "content_type": file.content_type,
            },
        },
        status=status.HTTP_200_OK,
    )
