"""Account API views: register, login, current user, public profiles,
artist detail, and follow/unfollow."""

from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import ArtistProfile, Follow, UserRole
from .serializers import (
    ArtistSerializer,
    CurrentUserSerializer,
    LoginSerializer,
    PublicUserSerializer,
    RegisterSerializer,
    UpdateProfileSerializer,
)

User = get_user_model()


def _tokens_for(user):
    refresh = RefreshToken.for_user(user)
    return {"access": str(refresh.access_token), "refresh": str(refresh)}


class RegisterView(APIView):
    """POST /api/auth/register/ — create an account and return JWT tokens."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        tokens = _tokens_for(user)
        return Response(
            {
                **tokens,
                "user": CurrentUserSerializer(
                    user, context={"request": request}
                ).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(TokenObtainPairView):
    """POST /api/auth/login/ — email/password -> tokens + user."""

    permission_classes = [AllowAny]
    serializer_class = LoginSerializer


class MeView(APIView):
    """GET / PATCH /api/me/ — current user profile (personal info + avatar)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(
            CurrentUserSerializer(request.user, context={"request": request}).data
        )

    def patch(self, request):
        serializer = UpdateProfileSerializer(
            request.user, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            CurrentUserSerializer(request.user, context={"request": request}).data
        )


class PublicUserView(APIView):
    """GET /api/users/<id>/ — public profile with follow state."""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        data = CurrentUserSerializer(user, context={"request": request}).data
        data["isFollowedByCurrentUser"] = Follow.objects.filter(
            follower=request.user, following=user
        ).exists()
        return Response(data)


class ArtistDetailView(APIView):
    """GET /api/artists/<id>/ — artist detail (profile + releases)."""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        artist = get_object_or_404(User, pk=pk, role=UserRole.ARTIST)
        data = ArtistSerializer(artist, context={"request": request}).data
        data["isFollowedByCurrentUser"] = Follow.objects.filter(
            follower=request.user, following=artist
        ).exists()
        return Response(data)


class ArtistListView(APIView):
    """GET /api/artists/ — list of artists (for browse/discovery)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        artists = User.objects.filter(role=UserRole.ARTIST).order_by("full_name")
        return Response(
            PublicUserSerializer(
                artists, many=True, context={"request": request}
            ).data
        )


class FollowView(APIView):
    """POST / DELETE /api/users/<id>/follow/ — follow or unfollow a user."""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        target = get_object_or_404(User, pk=pk)
        if target == request.user:
            return Response(
                {"detail": "You cannot follow yourself."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        Follow.objects.get_or_create(follower=request.user, following=target)
        return Response(
            {"following": True, "followerCount": target.follower_count},
            status=status.HTTP_201_CREATED,
        )

    def delete(self, request, pk):
        target = get_object_or_404(User, pk=pk)
        Follow.objects.filter(follower=request.user, following=target).delete()
        return Response(
            {"following": False, "followerCount": target.follower_count}
        )


class BecomeArtistView(APIView):
    """POST /api/me/become-artist/ — promote the current user to artist."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.role in (UserRole.SUPPORT, UserRole.ADMIN):
            return Response(
                {"detail": "Staff accounts cannot become artists."},
                status=status.HTTP_403_FORBIDDEN,
            )
        user.role = UserRole.ARTIST
        user.save(update_fields=["role"])
        ArtistProfile.objects.get_or_create(user=user)
        return Response(
            CurrentUserSerializer(user, context={"request": request}).data
        )
