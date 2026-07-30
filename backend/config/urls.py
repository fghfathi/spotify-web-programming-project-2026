"""Root URL configuration.

All application routes are namespaced under `/api/`. During development the
media files uploaded to MEDIA_ROOT are served directly by Django.
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("apps.accounts.urls")),
    path("api/", include("apps.catalog.urls")),
    path("api/", include("apps.playlists.urls")),
    path("api/", include("apps.subscriptions.urls")),
    path("api/", include("apps.support.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
