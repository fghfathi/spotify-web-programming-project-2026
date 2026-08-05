from django.urls import path

from .views import RecordStreamView

urlpatterns = [
    path("songs/<int:pk>/play/", RecordStreamView.as_view(), name="record-stream"),
]
