"""Signal handlers for the accounts app: media clean-up on avatar changes."""

from django.db.models.signals import post_delete, pre_save
from django.dispatch import receiver

from apps.common.files import delete_file_field, delete_old_file_on_change

from .models import ArtistProfile, User


@receiver(pre_save, sender=User)
def user_avatar_replace(sender, instance, **kwargs):
    delete_old_file_on_change(User, instance, ["avatar"])


@receiver(post_delete, sender=User)
def user_avatar_delete(sender, instance, **kwargs):
    delete_file_field(instance.avatar)


@receiver(pre_save, sender=ArtistProfile)
def artist_image_replace(sender, instance, **kwargs):
    delete_old_file_on_change(ArtistProfile, instance, ["profile_image"])


@receiver(post_delete, sender=ArtistProfile)
def artist_image_delete(sender, instance, **kwargs):
    delete_file_field(instance.profile_image)
