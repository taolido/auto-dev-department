from django.db import models
from django.utils import timezone

class Meeting(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    location = models.CharField(max_length=200, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    def is_upcoming(self) -> bool:
        """
        Check if the meeting is in the future.
        """
        return self.start_time > timezone.now()

    class Meta:
        ordering = ['start_time']