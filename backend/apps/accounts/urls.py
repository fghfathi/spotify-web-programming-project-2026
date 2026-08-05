"""Account and authentication routes (all mounted under /api/)."""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    ArtistDetailView,
    ArtistListView,
    BecomeArtistView,
    FollowView,
    LoginView,
    MeView,
    PublicUserView,
    RegisterView,
)

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("me/", MeView.as_view(), name="me"),
    path("me/become-artist/", BecomeArtistView.as_view(), name="become-artist"),
    path("users/<int:pk>/", PublicUserView.as_view(), name="public-user"),
    path("users/<int:pk>/follow/", FollowView.as_view(), name="follow"),
    path("artists/", ArtistListView.as_view(), name="artist-list"),
    path("artists/<int:pk>/", ArtistDetailView.as_view(), name="artist-detail"),
]
