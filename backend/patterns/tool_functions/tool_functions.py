import json
from collections import deque
import numpy as np
from PIL import Image
from pathlib import Path
import sys

from numpy import dtype


# SIMPLIFICATION FUNCTIONS
def is_number(value):
    try:
        float(value)  # Try converting to float
        return True
    except ValueError:
        return False


# NECK TOOLS
def create_stitch_decreases(target):
    result = []
    i = 1

    # Subtract successive integers from the target
    while sum(result) + i <= target:
        result.append(i)
        i += 1

    remainder = target - sum(result)

    # Distribute the remainder by incrementing values in result
    for j in range(remainder):
        result[j] += 1

    return result


def create_row_decreases(value, spaces):
    # Calculate the base value for each space
    quotient = value // spaces
    remainder = value % spaces

    # Create an array filled with the quotient value
    result = [quotient] * spaces

    # Distribute the remainder by adding 1 to some of the elements
    for i in range(remainder):
        result[i] += 1

    return result


# Change to potential just calc vertice
def calculate_neck_vertices(starting_point, stitches_decrease, rows_decrease):
    x = starting_point  # set start x
    y = 0  # set start y

    # Create Vertices for left side
    left_line_vertices = [(x, y)]
    for i in range(len(rows_decrease)):
        y += rows_decrease[i]
        left_line_vertices.append((x, y))
        x += stitches_decrease[i]
        left_line_vertices.append((x, y))
    print(left_line_vertices)

    # Create Vertices for right side
    right_line_vertices = [(x, y)]
    for i in range(len(rows_decrease) - 1, -1, -1):
        x += stitches_decrease[i]
        right_line_vertices.append((x, y))
        y -= rows_decrease[i]
        right_line_vertices.append((x, y))
    print(right_line_vertices)

    return left_line_vertices, right_line_vertices


# READ JSONS
def standard_size_values(pattern, size):
    size_path = "patterns/data/sizes/Pattern Sizes.json"

    # Open and read the JSON file
    with open(size_path, 'r') as file:
        data = json.load(file)

    pattern_data = data['patterns'][pattern]
    size_data = pattern_data['sizes'][size]

    swatch = size_data['swatch']
    torso = size_data['torso']
    sleeve = size_data['sleeve']
    needle_size = size_data['needle_size']
    return swatch, torso, sleeve, needle_size


# ARRAY HANDLER #
def initialize_array(width, height):
    array_dtype = np.dtype([
        ('shape', np.int8),
        ('color', np.int16),
        ('stitch_type', np.int8),
    ])

    pattern_array = np.zeros((height, width), dtype=array_dtype)

    # Set default values
    pattern_array['shape'] = 1
    pattern_array['color'] = 0
    pattern_array['stitch_type'] = 0

    return pattern_array


def bresenham_line(x0, y0, x1, y1):
    points = []
    dx = abs(x1 - x0)
    dy = abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    err = dx - dy

    while True:
        points.append((x0, y0))
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 > -dy:
            err -= dy
            x0 += sx
        if e2 < dx:
            err += dx
            y0 += sy
    return points


def draw_path_on_array(array, vertices, value: int = 2):
    for i in range(len(vertices) - 1):
        # Get the start and end points of the current line segment
        x0, y0 = vertices[i]
        x1, y1 = vertices[i + 1]

        # Get all points on the line between (x0, y0) and (x1, y1)
        points = bresenham_line(x0, y0, x1, y1)

        # Set the value of each point on the array with bounds checking
        for x, y in points:
            if 0 <= y < array.shape[0] and 0 <= x < array.shape[1]:
                array['shape'][y, x] = value
            else:
                print(f"Warning: Point ({x}, {y}) is out of bounds for array with shape {array.shape}")


def draw_area_on_array(array, top_left, bottom_right, fill_value=3):
    """
    Draws a rectangular area on a 2D array using top-left and bottom-right coordinates.

    Parameters:
    - base_array: A 2D numpy array representing the canvas.
    - top_left: Tuple (x1, y1) representing the top-left corner of the rectangle.
    - bottom_right: Tuple (x2, y2) representing the bottom-right corner of the rectangle.
    - fill_value: The value to fill in the area (default is 1).
    """
    # Extract coordinates
    x1, y1 = top_left
    x2, y2 = bottom_right

    # Ensure that the coordinates define a valid rectangle
    if x2 < x1:
        x1, x2 = x2, x1
    if y2 < y1:
        y1, y2 = y2, y1

    # Ensure the coordinates are within the boundaries of the array
    x1 = max(0, min(x1, array.shape[1] - 1))
    y1 = max(0, min(y1, array.shape[0] - 1))
    x2 = max(0, min(x2, array.shape[1] - 1))
    y2 = max(0, min(y2, array.shape[0] - 1))

    # Fill the specified area
    array['shape'][y1:y2+1, x1:x2+1] = fill_value

    return array


def flood_fill_outside(array):
    height, width = array.shape[:2]
    visited = np.zeros((height, width), dtype=bool)
    queue = deque()

    # Enqueue all boundary pixels that are ones
    for x in range(width):
        if array['shape'][0, x] == 1:
            queue.append((0, x))
        if array['shape'][height - 1, x] == 1:
            queue.append((height - 1, x))
    for y in range(height):
        if array['shape'][y, 0] == 1:
            queue.append((y, 0))
        if array['shape'][y, width - 1] == 1:
            queue.append((y, width - 1))

    # Perform BFS flood fill
    while queue:
        y, x = queue.popleft()
        if visited[y, x]:
            continue
        visited[y, x] = True
        if array['shape'][y, x] == 1:
            array['shape'][y, x] = 0  # Set the fill value to 0
            # Enqueue neighboring pixels
            for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                ny, nx = y + dy, x + dx
                if 0 <= ny < height and 0 <= nx < width:
                    if array['shape'][ny, nx] == 1 and not visited[ny, nx]:
                        queue.append((ny, nx))


def array_path_to_image(array_file_path):
    # Load the array from the text file
    array = load_pattern(array_file_path)

    # Get the dimensions of the array
    height, width = array.shape[:2]

    # Create a new image with a 1x1 pixel representation for each array element
    image = Image.new('RGBA', (width, height), color=(255, 255, 255, 255))
    pixels = image.load()

    # Iterate through the array and set pixels
    for y in range(height):
        for x in range(width):
            value = array['shape'][y, x]
            if value == -1:
                pixels[x, y] = (0, 0, 0, 0)  # Black for outside
            elif value == 0:
                pixels[x, y] = (255, 255, 255, 255)  # White for inside
            elif value == 1:
                pixels[x, y] = (128, 128, 128, 255)  # Grey for outlines
            elif value == 2:
                pixels[x, y] = (255, 192, 203, 255)  # Pink for special areas
            else:
                pixels[x, y] = (255, 255, 255, 255)  # Default to white

    # Save the image
    return image


# Depreciated
def save_pattern(array, file_path):
    np.savez(file_path, pattern_data=array, color_map=[])


# Depreciated
def load_pattern(file_path):
    return np.load(file_path)


def render_snapshot(piece_data):
    pass # Make this when you get a chance


class KnittingConversions:
    def __init__(self, SPI, RPI, needle_size=None):
        self._SPI = SPI
        self._RPI = RPI
        if needle_size:
            self.needle_size = needle_size

    @staticmethod
    def calculate_spi(width: float = None, height: float = None, stitches: int = None, rows: int = None,
                      swatch=None):
        if all(val is not None for val in (width, height, stitches, rows)):
            SPI = stitches / width
            RPI = rows / height
            return SPI, RPI

        elif swatch is not None:
            width, height, stitches, rows = swatch.get_swatch()
            SPI = stitches / width
            RPI = rows / height
            return SPI, RPI

    def target_size(self, width, height):
        rows = self._RPI * height
        stitches = self._SPI * width
        print('Required stitches:\n', int(stitches), 'stitches\n', int(rows), 'rows')
        return int(stitches), int(rows)

    @staticmethod
    def complex_calculate_spi(SPI, RPI, needle_size):
        complex_SPI = SPI * needle_size
        complex_RPI = RPI * needle_size
        return complex_SPI, complex_RPI

    def complex_target_size(self, width, height, needle_size):
        complex_SPI, complex_RPI = self.complex_calculate_spi(self._SPI, self._RPI, self.needle_size)
        stitches = (complex_SPI / needle_size) * width
        rows = (complex_RPI / needle_size) * height
        print('Required stitches:\n', int(stitches), 'stitches\n', int(rows), 'rows')

    @staticmethod
    def convert_us(us_size: str):
        if us_size == '00000' or us_size == '5/0':
            return 1.0
        elif us_size == '0000' or us_size == '4/0':
            return 1.25
        elif us_size == '000':
            return 1.5
        elif us_size == '00':
            return 1.75
        elif us_size == '0':
            return 2.0
        elif us_size == '1':
            return 2.25
        elif us_size == '2':
            return 2.75
        elif us_size == '3':
            return 3.25
        elif us_size == '4':
            return 3.5
        elif us_size == '5':
            return 3.75
        elif us_size == '6':
            return 4.0
        elif us_size == '7':
            return 4.5
        elif us_size == '8':
            return 5.0
        elif us_size == '9':
            return 5.5
        elif us_size == '10':
            return 6.0
        elif us_size == '10 1/2':
            return 6.5
        elif us_size == '11':
            return 8.0
        elif us_size == '13':
            return 9.0
        elif us_size == '15':
            return 10.0
        elif us_size == '17':
            return 12.5
        elif us_size == '19':
            return 15.0
        elif us_size == '35':
            return 19.0
        elif us_size == '50':
            return 25.0
        elif us_size == '20':
            return 35.0
        else:
            print('An error has occurred you entered an invalid us size')
            return False

    @staticmethod
    def convert_uk(uk_size: str):
        if uk_size == '19':
            return 1.0
        elif uk_size == '18':
            return 1.25
        elif uk_size == '17':
            return 1.5
        elif uk_size == '15':
            return 1.75
        elif uk_size == '14':
            return 2.0
        elif uk_size == '13':
            return 2.25
        elif uk_size == '12':
            return 2.75
        elif uk_size == '11':
            return 3.0
        elif uk_size == '10':
            return 3.25
        elif uk_size == '9':
            return 3.75
        elif uk_size == '8':
            return 4.0
        elif uk_size == '7':
            return 4.5
        elif uk_size == '6':
            return 5.0
        elif uk_size == '5':
            return 5.5
        elif uk_size == '4':
            return 6.0
        elif uk_size == '3':
            return 6.5
        elif uk_size == '2':
            return 7.0
        elif uk_size == '1':
            return 7.5
        elif uk_size == '0':
            return 8.0
        elif uk_size == '00':
            return 9.0
        elif uk_size == '000':
            return 10.0
        else:
            print('An error has occurred: you entered an invalid UK size')
            return False
