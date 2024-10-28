import os
import shutil

from django.conf import settings
from django.db import models

# Create your models here.
from django.db import models
from django.contrib.auth.models import User


# Create your models here.
def sweater_upload_path(instance, filename):
    return f'patterns/pattern_{instance.sweater.id}/{instance.piece_type}.npy'


class Pattern(models.Model):
    """
    Description:
        Represents a knitting pattern that is associated with a single torso projection.
        Each user can have multiple patterns.
    Fields:
        - author: ForeignKey to associate the pattern with a User.
        - name: CharField to store the name of the pattern.
        - content: TextField to store the pattern details.
        - created_on: DateTimeField to track when the pattern was created.
        - edited_on: DateTimeField to track when the pattern was last edited.
        - torso_projection: OneToOneField linking to a Torso_Projection.
    """
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

    def delete(self, *args, **kwargs):
        folder_path = os.path.join(settings.MEDIA_ROOT, f'patterns/pattern_{self.id}/')

        if os.path.exists(folder_path):
            shutil.rmtree(folder_path)

        super().delete(*args, **kwargs)

    def __str__(self):
        return self.name


class Sweater(Pattern):
    SWEATER_TYPE_CHOICES = [
        ('basic', 'Basic'),
        ('mable', 'Mable'),
        ('dipper', 'Dipper'),
    ]

    sweater_type = models.CharField(
        max_length=7,
        choices=SWEATER_TYPE_CHOICES,
        default='basic'
    )


class SweaterPiece(models.Model):
    SWEATER_PIECE_CHOICES = [
        ('front_torso', 'Front Torso'),
        ('back_torso', 'Back Torso'),
        ('left_sleeve', 'Left Sleeve'),
        ('right_sleeve', 'Right Sleeve'),
    ]
    sweater = models.ForeignKey(Sweater, related_name='pieces', on_delete=models.CASCADE)
    piece_type = models.CharField(max_length=20, choices=SWEATER_PIECE_CHOICES)
    sweater_file = models.FileField(upload_to=sweater_upload_path)
    edited_on = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.sweater.name} - {self.get_piece_type_display()}"

    def delete(self, *args, **kwargs):
        # Delete the file associated with this instance
        if self.sweater_file:
            self.sweater_file.delete(save=False)
        super(SweaterPiece, self).delete(*args, **kwargs)

    def save(self, *args, **kwargs):
        try:
            old_instance = SweaterPiece.objects.get(pk=self.pk)
            if old_instance.sweater_file != self.sweater_file:
                old_instance.sweater_file.delete(save=False)
        except SweaterPiece.DoesNotExist:
            pass  # The instance is new
        super(SweaterPiece, self).save(*args, **kwargs)


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
    pattern = models.OneToOneField(Pattern, on_delete=models.CASCADE, related_name='torso_projection')
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

    pattern = models.OneToOneField(Pattern, on_delete=models.CASCADE, related_name='sleeve_projection')
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