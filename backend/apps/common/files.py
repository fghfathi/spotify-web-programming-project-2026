"""Helpers to delete orphaned media files from disk (Step 4 clean-up).

When a record's file field is replaced or the record is deleted, the previous
file on disk becomes an orphan. These helpers, wired through model signals,
remove those files so the media directory does not accumulate dead uploads.
"""


def delete_file_field(file_field):
    """Delete the file backing a FileField/ImageField from storage, if any."""
    if not file_field:
        return
    storage = file_field.storage
    name = file_field.name
    if name and storage.exists(name):
        storage.delete(name)


def delete_old_file_on_change(model_cls, instance, field_names):
    """On pre_save, delete files replaced by a new upload.

    Compares the incoming instance's file fields against the version currently
    stored in the database and deletes any file that is being replaced.
    """
    if not instance.pk:
        return  # New record, nothing to replace yet.
    try:
        previous = model_cls.objects.get(pk=instance.pk)
    except model_cls.DoesNotExist:
        return
    for field_name in field_names:
        old = getattr(previous, field_name)
        new = getattr(instance, field_name)
        if old and old != new:
            delete_file_field(old)
