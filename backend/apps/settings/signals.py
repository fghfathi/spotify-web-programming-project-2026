"""Auto-create default settings for every new user (Step 5 initialization)."""

from django.conf import settings as django_settings
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import UserSettings


@receiver(post_save, sender=django_settings.AUTH_USER_MODEL)
def create_default_settings(sender, instance, created, **kwargs):
    if created:
        UserSettings.objects.get_or_create(user=instance)
