"""Account routes: JWT auth, current user, artist directory."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import ArtistApplicationView, ArtistViewSet, MeView, RegisterView

# Slash-less URLs for a consistent, frontend-friendly REST surface.
router = DefaultRouter(trailing_slash=False)
router.register(r"artists", ArtistViewSet, basename="artist")

urlpatterns = [
    # Authentication (JWT).
    path("auth/register", RegisterView.as_view(), name="auth-register"),
    path("auth/login", TokenObtainPairView.as_view(), name="auth-login"),
    path("auth/refresh", TokenRefreshView.as_view(), name="auth-refresh"),
    # Current user.
    path("me", MeView.as_view(), name="me"),
    path("me/artist-application", ArtistApplicationView.as_view(), name="artist-application"),
    # Public artist directory (+ follow action).
    path("", include(router.urls)),
]
