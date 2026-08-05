from django.urls import path

from .views import MySettingsView

urlpatterns = [
    path("me/settings/", MySettingsView.as_view(), name="my-settings"),
]
