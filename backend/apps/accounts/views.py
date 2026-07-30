"""Account views: registration, current-user profile, artist directory, follow.

RBAC is intentionally light here (step 3.1). Step 3.3 tightens per-endpoint
authorization and adds role-based permission classes.
"""

from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import generics, mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.streaming.models import StreamEvent
from apps.subscriptions.services import get_effective_plan, require_feature

from .models import ArtistProfile, Follow, UserRole
from .serializers import (
    ArtistApplicationSerializer,
    PublicArtistSerializer,
    RegisterSerializer,
    UserSerializer,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register — create a listener account."""

    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class MeView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/me — read or edit the authenticated user's own profile.

    PATCH is exposed (not PUT) because only a subset of profile fields is
    editable; full replacement is never required.
    """

    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "patch", "head", "options"]

    def get_object(self):
        return self.request.user

    def perform_update(self, serializer):
        # Uploading a profile image is a Silver/Gold feature.
        if serializer.validated_data.get("profile_image"):
            require_feature(
                self.request.user,
                "can_add_cover",
                "Adding a profile image requires a Silver or Gold subscription.",
            )
        serializer.save()


class ArtistApplicationView(generics.GenericAPIView):
    """POST /api/me/artist-application — apply to become an artist.

    Creates a pending ArtistProfile and flips the user's role to ARTIST. The
    account only becomes *active* as an artist once support/admin verifies it
    (enforced in the catalog write rules in step 3.3).
    """

    serializer_class = ArtistApplicationSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Only plain listeners may apply; support/admin cannot become artists.
        if request.user.role not in (UserRole.LISTENER, UserRole.ARTIST):
            raise PermissionDenied("Only listener accounts can apply to become an artist.")

        if hasattr(request.user, "artist_profile"):
            return Response(
                {"detail": "An artist application already exists."},
                status=status.HTTP_409_CONFLICT,
            )

        ArtistProfile.objects.create(
            user=request.user,
            portfolio_summary=serializer.validated_data.get("portfolio_summary", ""),
        )
        request.user.role = UserRole.ARTIST
        request.user.save(update_fields=["role"])
        return Response(
            UserSerializer(request.user, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class ArtistViewSet(
    mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet
):
    """Read-only public directory of artists (artist profile pages)."""

    serializer_class = PublicArtistSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        # Only approved artists are publicly listed (they become active on
        # verification). Follow/stats resolve artists directly, so those still
        # work regardless of this listing filter.
        return (
            User.objects.filter(
                role=UserRole.ARTIST,
                artist_profile__verification_status=ArtistProfile.VerificationStatus.VERIFIED,
            )
            .select_related("artist_profile")
            .order_by("full_name")
        )

    @action(detail=True, methods=["post", "delete"], permission_classes=[IsAuthenticated])
    def follow(self, request, pk=None):
        """POST/DELETE /api/artists/{id}/follow — follow or unfollow an artist."""
        target = get_object_or_404(User, pk=pk, role=UserRole.ARTIST)
        if target == request.user:
            return Response(
                {"detail": "You cannot follow yourself."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if request.method == "POST":
            Follow.objects.get_or_create(follower=request.user, following=target)
            return Response(status=status.HTTP_204_NO_CONTENT)

        Follow.objects.filter(follower=request.user, following=target).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["get"], permission_classes=[IsAuthenticated])
    def stats(self, request, pk=None):
        """GET /api/artists/{id}/stats — total streams + unique listeners.

        Visible to the artist about themselves, or to a Gold listener (the
        "view listener stats" feature).
        """
        artist = get_object_or_404(User, pk=pk, role=UserRole.ARTIST)
        if artist.id != request.user.id and not get_effective_plan(
            request.user
        ).can_view_stats:
            raise PermissionDenied("Viewing stats requires a Gold subscription.")
        events = StreamEvent.objects.filter(song__artist=artist)
        return Response(
            {
                "total_streams": events.count(),
                "total_listeners": events.values("user").distinct().count(),
                "follower_count": artist.follower_count,
            }
        )
