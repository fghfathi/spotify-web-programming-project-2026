"""Catalog media clean-up: delete replaced/removed audio and cover files."""

from django.db.models.signals import post_delete, pre_save
from django.dispatch import receiver

from apps.common.files import delete_file_field, delete_old_file_on_change

from .models import Album, Song


@receiver(pre_save, sender=Song)
def song_files_replace(sender, instance, **kwargs):
    delete_old_file_on_change(Song, instance, ["audio_file", "cover_image"])


@receiver(post_delete, sender=Song)
def song_files_delete(sender, instance, **kwargs):
    delete_file_field(instance.audio_file)
    delete_file_field(instance.cover_image)


@receiver(pre_save, sender=Album)
def album_cover_replace(sender, instance, **kwargs):
    delete_old_file_on_change(Album, instance, ["cover_image"])


@receiver(post_delete, sender=Album)
def album_cover_delete(sender, instance, **kwargs):
    delete_file_field(instance.cover_image)
