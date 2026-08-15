"""Account models: the custom User, artist profiles, and follows.

Design decisions:
- "Artist" is NOT a separate identity table. An artist is a `User` with
  role=ARTIST plus a one-to-one `ArtistProfile` carrying verification state.
- The subscription tier is derived from the user's active UserSubscription
  (see `subscription_tier`) rather than stored here, to avoid drift.
"""

import uuid

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models

from apps.common.validators import validate_image_file


class UserRole(models.TextChoices):
    """The four platform user categories."""

    LISTENER = "listener", "Listener"
    ARTIST = "artist", "Artist"
    SUPPORT = "support", "Support staff"
    ADMIN = "admin", "System admin"


class AccountStatus(models.TextChoices):
    ACTIVE = "active", "Active"
    BANNED = "banned", "Banned"


class Gender(models.TextChoices):
    MALE = "male", "Male"
    FEMALE = "female", "Female"
    OTHER = "other", "Other"
    UNSPECIFIED = "unspecified", "Unspecified"


class UserManager(BaseUserManager):
    """Manager for the email-as-login custom user model."""

    use_in_migrations = True

    def _generate_username(self, email: str) -> str:
        """Build a unique, system-assigned handle from the email local part."""
        base = email.split("@")[0].lower()
        base = "".join(ch for ch in base if ch.isalnum()) or "user"
        candidate = base
        while self.model.objects.filter(username=candidate).exists():
            candidate = f"{base}{uuid.uuid4().hex[:6]}"
        return candidate

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address.")
        email = self.normalize_email(email)
        extra_fields.setdefault("username", self._generate_username(email))
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("role", UserRole.ADMIN)
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """Custom user: email login + role + profile fields.

    `username` is kept (system-assigned, not user-editable) as a stable public
    handle; authentication is by `email`.
    """

    email = models.EmailField(unique=True)

    role = models.CharField(
        max_length=20, choices=UserRole.choices, default=UserRole.LISTENER
    )
    status = models.CharField(
        max_length=20, choices=AccountStatus.choices, default=AccountStatus.ACTIVE
    )

    full_name = models.CharField(max_length=150, blank=True)
    birthdate = models.DateField(null=True, blank=True)
    gender = models.CharField(
        max_length=20, choices=Gender.choices, default=Gender.UNSPECIFIED
    )
    bio = models.TextField(blank=True)
    # Avatar image stored under media/avatars/ (Step 4).
    avatar = models.ImageField(
        upload_to="avatars/",
        null=True,
        blank=True,
        validators=[validate_image_file],
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []  # email + password are prompted by createsuperuser

    objects = UserManager()

    class Meta:
        ordering = ["-date_joined"]

    def __str__(self):
        return f"{self.email} ({self.role})"

    # --- Derived read-only aggregates -------------------------------------
    @property
    def follower_count(self) -> int:
        return self.follower_links.count()

    @property
    def following_count(self) -> int:
        return self.following_links.count()

    @property
    def is_artist(self) -> bool:
        return self.role == UserRole.ARTIST

    @property
    def subscription_tier(self) -> str:
        """Return 'free', 'silver', or 'gold' from the active subscription."""
        sub = (
            self.subscriptions.filter(is_active=True)
            .select_related("plan")
            .order_by("-end_date")
            .first()
        )
        if sub is not None and sub.is_currently_active:
            return sub.plan.tier
        return "free"


class ArtistProfile(models.Model):
    """Verification & portfolio state for a user acting as an artist."""

    class VerificationStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        VERIFIED = "verified", "Verified"
        REJECTED = "rejected", "Rejected"

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="artist_profile"
    )
    verification_status = models.CharField(
        max_length=20,
        choices=VerificationStatus.choices,
        default=VerificationStatus.PENDING,
    )
    portfolio_summary = models.TextField(blank=True)
    rejection_reason = models.TextField(blank=True)
    # Dedicated artist image stored under media/artists/ (Step 4).
    profile_image = models.ImageField(
        upload_to="artists/",
        null=True,
        blank=True,
        validators=[validate_image_file],
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"ArtistProfile<{self.user.email}: {self.verification_status}>"

    @property
    def is_verified(self) -> bool:
        return self.verification_status == self.VerificationStatus.VERIFIED


class Follow(models.Model):
    """Directed follow relationship between two users."""

    follower = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="following_links"
    )
    following = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="follower_links"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["follower", "following"], name="unique_follow_pair"
            ),
            models.CheckConstraint(
                check=~models.Q(follower=models.F("following")),
                name="no_self_follow",
            ),
        ]

    def __str__(self):
        return f"{self.follower_id} -> {self.following_id}"
