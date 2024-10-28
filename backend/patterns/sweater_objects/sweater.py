import asyncio
from pathlib import Path
from ..mappers import map_swatch_model_to_class, map_torso_model_to_classes, map_sleeve_model_to_classes
from ..tool_functions import KnittingConversions as knitC, tool_functions as tf
from PIL import Image

from django.conf import settings


class Sweater:
    def __init__(self, sweater_info):
        self.swatch = map_swatch_model_to_class(sweater_info.swatch)
        self.front_torso, self.back_torso = map_torso_model_to_classes(sweater_info.torso_projection)
        self.left_sleeve, self.right_sleeve = map_sleeve_model_to_classes(sweater_info.sleeve_projection)
        self.needle_size = self.swatch.needle_size  # Millimeters  || Eventually account for different size conventions

        self.SPI, self.RPI = None, None
        self.images = []
        self.saved_path = None
        self.image_paths = None
        self.sweater_id = sweater_info.id

    async def do_calculations(self):
        # Calculate per inch vals
        self.SPI, self.RPI = knitC.calculate_spi(swatch=self.swatch)

        # Run torso and sleeve calculations asynchronously
        await asyncio.gather(
            self.front_torso.do_calculations(self.SPI, self.RPI, self.needle_size),
            self.back_torso.do_calculations(self.SPI, self.RPI, self.needle_size),
            self.left_sleeve.do_calculations(self.SPI, self.RPI, self.needle_size),
            self.right_sleeve.do_calculations(self.SPI, self.RPI, self.needle_size)
        )

        # Build and return arrays
        return self.build_arrays()

    def getSpi(self):
        return self.SPI, self.RPI

    def build_arrays(self):
        front_torso_array = self.front_torso.build_array()
        back_torso_array = self.back_torso.build_array()
        left_sleeve_array = self.left_sleeve.build_array()
        right_sleeve_array = self.right_sleeve.build_array()

        # Once they have been saved load images
        return front_torso_array, back_torso_array, left_sleeve_array, right_sleeve_array

    def save_arrays(self):
        save_name = f'pattern_{self.sweater_id}'
        media_root = settings.MEDIA_ROOT
        self.saved_path = Path(media_root) / f"patterns/{save_name}"
        self.saved_path.mkdir(parents=True, exist_ok=True)

        front_path = self.front_torso.save_as_array(self.saved_path, 'front_torso.npy')
        back_path = self.back_torso.save_as_array(self.saved_path, 'back_torso.npy')
        left_path = self.left_sleeve.save_as_array(self.saved_path, 'left_sleeve.npy')
        right_path = self.right_sleeve.save_as_array(self.saved_path, 'right_sleeve.npy')

        # Once they have been saved load images
        self.sweater_image(front_path, back_path, left_path, right_path)

    def sweater_image(self, front_path, back_path, left_path, right_path):
        front_image = tf.array_path_to_image(front_path)
        back_image = tf.array_path_to_image(back_path)
        left_image = tf.array_path_to_image(left_path)
        right_image = tf.array_path_to_image(right_path)

        # Define the image file paths
        front_image_path = self.saved_path / 'front_torso.png'
        back_image_path = self.saved_path / 'back_torso.png'
        left_image_path = self.saved_path / 'left_sleeve.png'
        right_image_path = self.saved_path / 'right_sleeve.png'

        # Save images to the file system
        front_image.save(front_image_path)
        back_image.save(back_image_path)
        left_image.save(left_image_path)
        right_image.save(right_image_path)

        # Store relative paths to the images (relative to MEDIA_ROOT)
        self.image_paths = {
            'front_torso': str(front_image_path.relative_to(settings.MEDIA_ROOT)),
            'back_torso': str(back_image_path.relative_to(settings.MEDIA_ROOT)),
            'left_sleeve': str(left_image_path.relative_to(settings.MEDIA_ROOT)),
            'right_sleeve': str(right_image_path.relative_to(settings.MEDIA_ROOT)),
        }

    def get_image_paths(self):
        return self.image_paths
