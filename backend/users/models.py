from django.db import models
from django.contrib.auth.models import AbstractUser, PermissionsMixin
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from .managers import CustomUserManager


class CustomUser(AbstractUser, PermissionsMixin):
    email = models.EmailField(_('email address'), unique=True)
    username = None
    first_name = models.CharField(_('first name'), max_length=150, blank=True)
    last_name = models.CharField(_('last name'), max_length=150, blank=True)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(default=timezone.now)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = CustomUserManager()

    def __str__(self):
        return self.email

    def get_full_name(self) -> str:
        """
        Return the first_name plus the last_name, with a space in between.
        """
        full_name = '%s %s' % (self.first_name, self.last_name)
        return full_name.strip() or self.email

    def get_short_name(self) -> str:
        """Return the short name for the user."""
        return self.first_name or self.email


class Role(models.Model):
    name = models.CharField(max_length=100, unique=True)
    permissions = models.ManyToManyField('Permission', blank=True)

    def __str__(self):
        return self.name


class Permission(models.Model):
    name = models.CharField(max_length=100, unique=True)
    codename = models.CharField(max_length=100, unique=True)  # e.g., 'can_view_meeting'

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']