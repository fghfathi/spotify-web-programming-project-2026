"""Settings API: fetch and update the current user's preferences."""

from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import UserSettings
from .serializers import UserSettingsSerializer


class MySettingsView(generics.RetrieveUpdateAPIView):
    """GET / PUT / PATCH /api/me/settings/ — the current user's preferences."""

    serializer_class = UserSettingsSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        # Defensive get_or_create in case a legacy user predates the signal.
        settings_obj, _ = UserSettings.objects.get_or_create(user=self.request.user)
        return settings_obj
