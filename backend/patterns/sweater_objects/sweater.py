import asyncio
from pathlib import Path

from .sweater_pieces import FrontTorso, BackTorso, LeftSleeve, RightSleeve
from .pattern_objects import Swatch
from ..tool_functions import KnittingConversions as knitC, tool_functions as tf

from PIL import Image


class Sweater:
    def __init__(self, front_torso: FrontTorso = None, back_torso: BackTorso = None, left_sleeve: LeftSleeve = None,
                 right_sleeve: RightSleeve = None, swatch: Swatch = None, needle_size: float = 3.5):
        self.front_torso = front_torso
        self.back_torso = back_torso
        self.left_sleeve = left_sleeve
        self.right_sleeve = right_sleeve
        self.swatch = swatch
        self.needle_size = needle_size  # Millimeters  || Eventually account for different size conventions

        self.SPI, self.RPI = None, None
        self.images = []
        self.saved_path = None

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

        # Build outline text
        self.save_arrays()

    def getSpi(self):
        return self.SPI, self.RPI

    def save_arrays(self):
        save_name = 'Basic Pattern'

        self.saved_path = Path(__file__).parent.parent.parent / f"data/patterns/saved_patterns/{save_name}"
        self.saved_path.mkdir(parents=True, exist_ok=True)  # Create the directory if it doesn't exist

        front_path = self.front_torso.save_as_array(self.saved_path, 'front_torso.txt')
        back_path = self.back_torso.save_as_array(self.saved_path, 'back_torso.txt')
        left_path = self.left_sleeve.save_as_array(self.saved_path, 'left_sleeve.txt')
        right_path = self.right_sleeve.save_as_array(self.saved_path, 'right_sleeve.txt')

        '''front_image = tf.array_path_to_image(front_path)
        front_image.show()'''
        # Once they have been saved load images
        self.sweater_image(front_path, back_path, left_path, right_path)

    def sweater_image(self, front_path, back_path, left_path, right_path):
        front_image = tf.array_path_to_image(front_path)
        back_image = tf.array_path_to_image(back_path)
        left_image = tf.array_path_to_image(left_path)
        right_image = tf.array_path_to_image(right_path)

        self.images = [front_image, back_image, left_image, right_image]
        '''front_image.show()
        back_image.show()
        left_image.show()
        right_image.show()'''
