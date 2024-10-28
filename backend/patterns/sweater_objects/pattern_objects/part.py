from pathlib import Path
import numpy as np

from ..pattern_objects import Ribbing, Taper, Neck
from ...tool_functions import tool_functions as tf


class Part:
    def __init__(self, width: float, height: float, ribbing: str = None, taper_offset: float = 0, taper_hem: float = 0, taper_style: str = None, neck_offset_width: float = 0, neck_offset_height: float = 0, neck_depth: float = 0):
        self.width = width  # width in
        self.height = height  # length in inch

        # Info
        self.ribbing_thickness = ribbing
        self.taper_offset = taper_offset
        self.taper_hem = taper_hem
        self.taper_style = taper_style
        self.neck_offset_width = neck_offset_width
        self.neck_offset_height = neck_offset_height
        self.neck_depth = neck_depth

        # Ribbing vars
        self.ribbing: Ribbing = None
        self.taper: Taper = None
        self.neck: Neck = None

        # Bools to tick
        self.done_calculations = False

        self.RPI = None  # corresponds with width
        self.SPI = None  # corresponds with height
        self.needle_size = None  # important
        self.stitches = None  # width
        self.rows = None  # height
        self.working_rows = None  # height affected by size of ribbing
        self.working_height = height

        self.debug_mode = True  # debug!

    async def do_calculations(self, SPI, RPI, needle_size):
        self.SPI = SPI
        self.RPI = RPI
        self.stitches = round(self.width*self.SPI)
        self.rows = round(self.height*self.RPI)
        self.working_rows = self.rows
        self.needle_size = needle_size

        # Logs
        if self.debug_mode:
            print('\n----------------------------\ncalculations done: ')
            print('SPI', self.SPI)
            print('RPI', self.RPI)
            print('Stitches', self.stitches)
            print('Rows', self.rows)

        # Create the rest of the parts
        self.create_ribbing()
        self.create_taper()
        self.create_neck()
        self.done_calculations = True

    def create_ribbing(self):
        if self.ribbing_thickness is not None:
            self.ribbing = Ribbing(self.needle_size, self.RPI, self.ribbing_thickness, self)

    def create_taper(self):
        if self.taper_offset != 0 and self.taper_hem != 0:
            self.taper = Taper(taper_offset=self.taper_offset, hem_size=self.taper_hem, width=self.width, working_height=self.working_height, total_stitches=self.stitches, working_rows=self.working_rows, taper_style=self.taper_style)

    def create_neck(self):
        if self.neck_offset_width != 0 and self.neck_offset_height != 0 and self.neck_depth != 0:
            self.neck = Neck(self.neck_offset_width, self.neck_offset_height, self.neck_depth, self.width, self.height, self.stitches, self.rows)

    def build_array(self):
        if self.debug_mode:
            print(f'\nInitializing array of size {self.stitches}x{self.rows}')
        array = tf.initialize_array(self.stitches, self.rows)

        if self.ribbing:
            if self.taper:
                self.ribbing.add_to_array(array, hem_stitches=self.taper.hem_stitches, taper_style=self.taper.taper_style)
            else:
                self.ribbing.add_to_array(array)

        # Define the top edge of the torso (including neckline, if applicable)
        x_0, y_0 = 0, 0
        if self.neck:
            # Debug: Print starting stitch, rows decrease, and stitches decrease for the neckline
            if self.debug_mode:
                print(f'starting_stitch: {self.neck.starting_stitch}')
                print(f'rows_decrease: {self.neck.rows_decrease}')
                print(f'stitches_decrease: {self.neck.stitches_decrease}')

            # Draw Neck Line
            self.neck.add_to_array(array)
        else:
            x_0, y_0 = 0, 0
            x_1, y_1 = self.stitches - 1, 0
            tf.draw_path_on_array(array, [(x_0, y_0), (x_1, y_1)])

        if self.taper:
            # Draw Taper Line
            self.taper.add_to_array(array)
        else:
            # Define the sides and bottom edge of the torso
            x_left, y_bottom = 0, self.rows - 1
            x_right = self.stitches - 1

            # Draw left edge
            tf.draw_path_on_array(array, [(0, 0), (x_left, y_bottom)])

            # Draw right edge
            tf.draw_path_on_array(array, [(x_right, 0), (x_right, y_bottom)])

            # Draw bottom edge
            tf.draw_path_on_array(array, [(0, y_bottom), (x_right, y_bottom)])

        # Fill outside to -1
        tf.flood_fill_outside(array)

        return array

    def save_as_array(self, path, part_name):
        if self.debug_mode:
            print(f'\nInitializing array of size {self.stitches}x{self.rows}')
        array = tf.initialize_array(self.stitches, self.rows)

        if self.ribbing:
            if self.taper:
                self.ribbing.add_to_array(array, hem_stitches=self.taper.hem_stitches, taper_style=self.taper.taper_style)
            else:
                self.ribbing.add_to_array(array)

        # Define the top edge of the torso (including neckline, if applicable)
        x_0, y_0 = 0, 0
        if self.neck:
            # Debug: Print starting stitch, rows decrease, and stitches decrease for the neckline
            if self.debug_mode:
                print(f'starting_stitch: {self.neck.starting_stitch}')
                print(f'rows_decrease: {self.neck.rows_decrease}')
                print(f'stitches_decrease: {self.neck.stitches_decrease}')

            # Draw Neck Line
            self.neck.add_to_array(array)
        else:
            x_0, y_0 = 0, 0
            x_1, y_1 = self.stitches - 1, 0
            tf.draw_path_on_array(array, [(x_0, y_0), (x_1, y_1)])

        if self.taper:
            # Draw Taper Line
            self.taper.add_to_array(array)
        else:
            # Define the sides and bottom edge of the torso
            x_left, y_bottom = 0, self.rows - 1
            x_right = self.stitches - 1

            # Draw left edge
            tf.draw_path_on_array(array, [(0, 0), (x_left, y_bottom)])

            # Draw right edge
            tf.draw_path_on_array(array, [(x_right, 0), (x_right, y_bottom)])

            # Draw bottom edge
            tf.draw_path_on_array(array, [(0, y_bottom), (x_right, y_bottom)])

        # Fill outside to -1
        tf.flood_fill_outside(array)

        # Save the array as a text file
        file_path = path / part_name
        tf.save_pattern(array, file_path)
        print(f'Array saved to {file_path}')

        return file_path

    def getSpi(self):
        print(f'width is {self.SPI} spi, and height is {self.RPI} spi')

    def exact(self):
            print(f'Number of stitches is exactly {self.SPI * self.width}')
            print(f'Number of rows is exactly {self.RPI * self.height}')
