from django.urls import path
from . import views

urlpatterns = [
    path('', views.get_posts, name='get_posts'),
    path('create/', views.create_post, name='create_post'),
    path('<str:id>/', views.get_post_by_id, name='get_post_by_id'),
    path('<str:id>/delete/', views.delete_post, name='delete_post'),
]
