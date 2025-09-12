from django.urls import path

from . import views

urlpatterns = [
    path("register/", views.register_user, name="register"),
    path("login/", views.login_user, name="login"),
    path("create_post/", views.create_post, name="create_post"),
    # Add other URLs as needed
]

# Add CSRF endpoint under the same 'auth/' prefix so /auth/csrf/ resolves
try:
    from core.csrf_views import csrf as csrf_view
    from django.urls import path as _path  # ensure path is available

    try:
        urlpatterns.insert(0, _path("csrf/", csrf_view, name="csrf"))
    except Exception:
        urlpatterns += [_path("csrf/", csrf_view, name="csrf")]
except Exception:
    pass
