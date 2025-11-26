import os
import shutil

from django.conf import settings
from django.db import models
from django.core.files.storage import default_storage

# Create your models here.
from django.db import models
from django.contrib.auth.models import User


# Create your models here.
def sweater_upload_path(instance, filename):
    return f'patterns/pattern_{instance.id}/{filename}'


class Pattern(models.Model):
    """
    Base model for all knitting patterns.
    """
    PATTERN_TYPE_CHOICES = [
        ('separated', 'Separated Sweater Pieces'),
    ]
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='patterns'
    )
    name = models.CharField(max_length=100)
    content = models.TextField()
    created_on = models.DateTimeField(auto_now_add=True)
    edited_on = models.DateTimeField(auto_now=True)
    thumbnail = models.ImageField(null=True, blank=True)
    pattern_type = models.CharField(
        max_length=10,
        choices=PATTERN_TYPE_CHOICES,
        default='separated',
    )

    def delete(self, *args, **kwargs):
        # File cleanup is handled by the FileField in SeparatedSweater
        # No need to manually delete files here
        super().delete(*args, **kwargs)

    def __str__(self):
        return self.name


class SeparatedSweater(Pattern):
    """
    Represents a separated sweater pattern, inheriting from Pattern.
    Each instance has its own data file.
    """
    sweater_file = models.FileField(upload_to=sweater_upload_path)

    def save(self, *args, **kwargs):
        self.pattern_type = 'separated'  # Ensure the pattern_type is set correctly
        # Handle old file deletion if updating
        if self.pk:
            old_instance = SeparatedSweater.objects.get(pk=self.pk)
            if old_instance.sweater_file != self.sweater_file:
                old_instance.sweater_file.delete(save=False)
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        # Delete the file associated with this instance
        if self.sweater_file:
            self.sweater_file.delete(save=False)
        super().delete(*args, **kwargs)

    def __str__(self):
        return f"Separated Sweater: {self.name}"


class Swatch(models.Model):
    """
    Description: There can be many swatches per 1 user.
    Access_Through using user.swatches.all()
    Fields:
        - user: ForeignKey to associate Swatches with a User.
        - width: FloatField to store the width of the swatch.
        - height: FloatField to store the height of the swatch.
        - stitches: IntegerField to store the number of stitches.
        - rows: IntegerField to store the number of rows.
    """
    name = models.CharField(max_length=100, blank=True)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='swatches'
    )
    pattern = models.OneToOneField(Pattern, on_delete=models.CASCADE, related_name='swatch', null=True, blank=True)
    width = models.FloatField()
    height = models.FloatField()
    stitches = models.IntegerField()
    rows = models.IntegerField()
    needle_size = models.FloatField()

    def __str__(self):
        if self.name != '':
            return self.name
        else:
            return f'Width: {self.width}, Height: {self.height}, Stitches: {self.stitches}, Rows: {self.rows}, Needle_Size: {self.needle_size}'


class Torso_Projection(models.Model):
    """
    Description:
        Represents a collection of desired torso sizes for generating patterns.
        It is linked to a pattern, not directly to a user.
    Fields:
        - width: FloatField representing the width.
        - height: FloatField representing the height.
        - ribbing: CharField with choices (Thin, Normal, Thick).
        - taper_offset: FloatField.
        - taper_hem: FloatField.
        - neck_offset_width: FloatField.
        - neck_offset_height: FloatField.
        - neck_depth: FloatField.
    """
    RIBBING_CHOICES = [
        ('thin', 'Thin'),
        ('normal', 'Normal'),
        ('thick', 'Thick'),
    ]
    sweater = models.OneToOneField(SeparatedSweater, on_delete=models.CASCADE, related_name='torso_projection')
    width = models.FloatField()
    height = models.FloatField()
    ribbing = models.CharField(
        max_length=6,
        choices=RIBBING_CHOICES,
        default=None,
        null=True,
        blank=True,
    )
    taper_offset = models.FloatField(default=0,)
    taper_hem = models.FloatField(default=0,)
    neck_offset_width = models.FloatField(default=0,)
    neck_offset_height = models.FloatField(default=0,)
    neck_depth = models.FloatField(default=0,)

    def __str__(self):
        return f"Torso Projection (Width: {self.width}, Height: {self.height})"


class Sleeve_Projection(models.Model):
    """
    Description:
        Represents a collection of desired sleeve sizes for generating patterns.
        It is linked to a pattern, not directly to a user.
    Fields:
        - width: FloatField representing the width.
        - height: FloatField representing the height.
        - ribbing: CharField with choices (Thin, Normal, Thick).
        - taper_offset: FloatField.
        - taper_hem: FloatField.
        - neck_offset_width: FloatField.
        - neck_offset_height: FloatField.
        - neck_depth: FloatField.
    """
    RIBBING_CHOICES = [
        ('thin', 'Thin'),
        ('normal', 'Normal'),
        ('thick', 'Thick'),
    ]
    TAPER_STYLE_CHOICES = [
        ('both', 'Both'),
        ('top', 'Top'),
        ('bottom', 'Bottom'),
    ]

    sweater = models.OneToOneField(SeparatedSweater, on_delete=models.CASCADE, related_name='sleeve_projection')
    width = models.FloatField()
    height = models.FloatField()
    ribbing = models.CharField(
        max_length=6,
        choices=RIBBING_CHOICES,
        default=None,
        null=True,
        blank=True,
    )
    taper_offset = models.FloatField(default=0,)
    taper_hem = models.FloatField(default=0,)
    taper_style = models.CharField(
        max_length=6,
        choices=TAPER_STYLE_CHOICES,
        default='both'
    )
    neck_offset_width = models.FloatField(default=0,)
    neck_offset_height = models.FloatField(default=0,)
    neck_depth = models.FloatField(default=0,)

    def __str__(self):
        return f"Sleeve Projection (Width: {self.width}, Height: {self.height})"