from django.urls import path

from .views import AuthView, create_post

urlpatterns = [
    path("register/", AuthView.as_view(), {"action": "register"}, name="register"),
    path("login/", AuthView.as_view(), {"action": "login"}, name="login"),
    path("create_post/", create_post, name="create_post"),
    # Add other URLs as needed
]

# Add CSRF endpoint under the same 'auth/' prefix so /auth/csrf/ resolves
try:
    from django.urls import path as _path  # ensure path is available

    from core.csrf_views import csrf as csrf_view

    try:
        urlpatterns.insert(0, _path("csrf/", csrf_view, name="csrf"))
    except Exception:
        urlpatterns += [_path("csrf/", csrf_view, name="csrf")]
except Exception:
    pass
