"""Playlist media clean-up: delete replaced/removed cover images."""

from django.db.models.signals import post_delete, pre_save
from django.dispatch import receiver

from apps.common.files import delete_file_field, delete_old_file_on_change

from .models import Playlist


@receiver(pre_save, sender=Playlist)
def playlist_cover_replace(sender, instance, **kwargs):
    delete_old_file_on_change(Playlist, instance, ["cover_image"])


@receiver(post_delete, sender=Playlist)
def playlist_cover_delete(sender, instance, **kwargs):
    delete_file_field(instance.cover_image)
