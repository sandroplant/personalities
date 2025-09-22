from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt

from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response

from core.reactions import build_breakdown

from .models import Comment, CommentReaction, Post
from .serializers import CommentReactionSerializer, PostSerializer


@csrf_exempt
@api_view(["POST"])
def create_post(request):
    serializer = PostSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    serializer.save()
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
def get_posts(request):
    posts = Post.objects.all()
    serializer = PostSerializer(posts, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["GET"])
def get_post_by_id(request, id):
    try:
        post = Post.objects.get(id=id)
    except Post.DoesNotExist:
        return JsonResponse({"error": "Post not found"}, status=status.HTTP_404_NOT_FOUND)

    serializer = PostSerializer(post)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["DELETE"])
def delete_post(request, id):
    try:
        post = Post.objects.get(id=id)
    except Post.DoesNotExist:
        return JsonResponse({"error": "Post not found"}, status=status.HTTP_404_NOT_FOUND)

    post.delete()
    return JsonResponse({"message": "Post deleted"}, status=status.HTTP_200_OK)


@api_view(["GET", "POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticatedOrReadOnly])
def comment_reactions(request, pk):
    comment = get_object_or_404(Comment, pk=pk)

    if request.method == "GET":
        rows = list(CommentReaction.objects.filter(comment=comment).values("user_id", *CommentReaction.DIMENSIONS))
        breakdown = build_breakdown(rows)
        user_reaction = None
        if request.user and request.user.is_authenticated:
            reaction = CommentReaction.objects.filter(comment=comment, user=request.user).first()
            if reaction:
                user_reaction = CommentReactionSerializer(reaction).data
        return Response(
            {
                "comment_id": comment.id,
                "scores": {field: getattr(comment, f"{field}_score") for field in CommentReaction.DIMENSIONS},
                "breakdown": breakdown,
                "user_reaction": user_reaction,
            }
        )

    serializer = CommentReactionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    defaults = {field: serializer.validated_data.get(field, 0) for field in CommentReaction.DIMENSIONS}
    reaction, created = CommentReaction.objects.update_or_create(
        comment=comment,
        user=request.user,
        defaults=defaults,
    )
    data = CommentReactionSerializer(reaction).data
    status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
    return Response(data, status=status_code)
