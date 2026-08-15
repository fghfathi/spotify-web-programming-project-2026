"""Root URL configuration.

All application routes are namespaced under `/api/`. Uploaded media is served
by Django during development, and in the demo container when SERVE_MEDIA=1.
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.static import serve

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("apps.accounts.urls")),
    path("api/", include("apps.catalog.urls")),
    path("api/", include("apps.playlists.urls")),
    path("api/", include("apps.streaming.urls")),
    path("api/", include("apps.settings.urls")),
    path("api/", include("apps.subscriptions.urls")),
    path("api/", include("apps.support.urls")),
    path("api/", include("apps.reports.urls")),
    path("api/", include("apps.recommendations.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
elif settings.SERVE_MEDIA:
    # `static()` is a no-op once DEBUG is off, so wire the view up directly.
    urlpatterns += [
        re_path(
            r"^media/(?P<path>.*)$", serve, {"document_root": settings.MEDIA_ROOT}
        )
    ]
