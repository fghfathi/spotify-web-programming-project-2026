from django.urls import path

from .views import AdminReportView, ArtistReportView, SupportReportView

urlpatterns = [
    path("reports/admin/", AdminReportView.as_view(), name="report-admin"),
    path("reports/support/", SupportReportView.as_view(), name="report-support"),
    path("reports/artist/", ArtistReportView.as_view(), name="report-artist"),
]
