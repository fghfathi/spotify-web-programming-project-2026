from django.urls import path

from .views import (
    ArtistVerifyView,
    FinanceView,
    ManagedArtistListView,
    ManagedUserDetailView,
    ManagedUserListView,
    PayoutSettleView,
    PlatformStatsView,
    SubscriptionSettingsView,
    TicketDetailView,
    TicketListView,
    TicketReplyView,
)

urlpatterns = [
    path("support/users/", ManagedUserListView.as_view(), name="support-users"),
    path(
        "support/users/<int:pk>/",
        ManagedUserDetailView.as_view(),
        name="support-user-detail",
    ),
    path("support/artists/", ManagedArtistListView.as_view(), name="support-artists"),
    path(
        "support/artists/<int:pk>/verify/",
        ArtistVerifyView.as_view(),
        name="support-artist-verify",
    ),
    path("support/tickets/", TicketListView.as_view(), name="support-tickets"),
    path(
        "support/tickets/<int:pk>/",
        TicketDetailView.as_view(),
        name="support-ticket-detail",
    ),
    path(
        "support/tickets/<int:pk>/reply/",
        TicketReplyView.as_view(),
        name="support-ticket-reply",
    ),
    path("support/stats/", PlatformStatsView.as_view(), name="support-stats"),
    path("support/finance/", FinanceView.as_view(), name="support-finance"),
    path(
        "support/finance/payouts/<int:pk>/settle/",
        PayoutSettleView.as_view(),
        name="support-payout-settle",
    ),
    path(
        "support/subscriptions/",
        SubscriptionSettingsView.as_view(),
        name="support-subscriptions",
    ),
]
