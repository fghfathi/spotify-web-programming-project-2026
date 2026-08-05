from django.urls import path

from .views import (
    MySubscriptionView,
    PaymentCallbackView,
    PaymentHistoryView,
    PaymentInitiateView,
    PaymentStatusView,
    PlanListView,
)

urlpatterns = [
    path("plans/", PlanListView.as_view(), name="plans"),
    path("me/subscription/", MySubscriptionView.as_view(), name="my-subscription"),
    path("payments/", PaymentHistoryView.as_view(), name="payment-history"),
    path("payments/create/", PaymentInitiateView.as_view(), name="payment-create"),
    path("payments/callback/", PaymentCallbackView.as_view(), name="payment-callback"),
    path(
        "payments/<str:invoice_id>/",
        PaymentStatusView.as_view(),
        name="payment-status",
    ),
]
