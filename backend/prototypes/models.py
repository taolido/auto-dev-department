from django.db import models
from django.conf import settings
import uuid

class Prototype(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    file = models.FileField(upload_to='prototypes/')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='prototypes_created')
    last_modified_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='prototypes_modified')

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        try:
            super().save(*args, **kwargs)
        except Exception as e:
            # Log the error or handle it appropriately
            print(f"Error saving prototype: {e}")
            raise

    def delete(self, *args, **kwargs):
        try:
            # Delete the file from storage before deleting the model
            storage, path = self.file.storage, self.file.path
            super().delete(*args, **kwargs)
            storage.delete(path)
        except Exception as e:
            print(f"Error deleting prototype: {e}")
            raise