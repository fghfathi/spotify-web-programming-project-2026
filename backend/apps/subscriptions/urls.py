"""Subscription routes."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    MyPaymentsView,
    MySubscriptionView,
    PurchaseView,
    SubscriptionPlanViewSet,
)

router = DefaultRouter(trailing_slash=False)
router.register(r"subscription-plans", SubscriptionPlanViewSet, basename="plan")

urlpatterns = [
    path("subscriptions/purchase", PurchaseView.as_view(), name="subscription-purchase"),
    path("me/subscription", MySubscriptionView.as_view(), name="my-subscription"),
    path("me/payments", MyPaymentsView.as_view(), name="my-payments"),
    path("", include(router.urls)),
]
