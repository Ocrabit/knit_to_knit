from ...tool_functions import tool_functions as tf


class Neck:
    def __init__(self, offset_width, offset_height, neck_depth, width, height, total_stitches, total_rows):
        self.offset_width = offset_width  # The width before starting the neckline shaping (in inches)
        self.offset_height = offset_height  # The height before starting the neckline shaping (in inches)
        self.neck_depth = neck_depth  # Total height of the section (in inches)
        # Total width of piece (in inches) - width
        self.total_stitches = total_stitches
        # Total height of piece (in inches) - height
        # Total number of stitches - total_stitches
        # Total number of rows - total_rows
        print('\nNeck inputs: ',
              f'offset_width: {offset_width}',
              f'offset_height: {offset_height}',
              f'neck_depth: {neck_depth}', f'width: {width}', f'height: {height}',
              f'total_stitches: {total_stitches}',
              f'total_rows: {total_rows}')

        # Point on X Axis where neck starts
        self.starting_stitch = round(total_stitches*(self.offset_width/width))

        # Number of Stitches the neck part is wide
        self.stitches = total_stitches - self.starting_stitch*2
        print('stitches', self.stitches)

        # Number of Rows the center of the neck is down
        self.rows = round(total_rows*(self.neck_depth/height))
        print('rows', self.rows)

        # Offset before neck begins taper
        self.offset_rows = round(total_rows*(self.offset_height/height))
        print('offset_rows', self.offset_rows)

        # Adjustment Calculations
        half_stitches = self.stitches // 2  # We only need half the stitches for one side of the neck
        remaining_rows = self.rows - self.offset_rows  # Number of decreasing rows

        # Decrease Arrays
        print('half_stitches', half_stitches)
        self.stitches_decrease = tf.create_stitch_decreases(half_stitches)

        print('remaining_rows', remaining_rows)
        self.rows_decrease = [self.offset_rows] + tf.create_row_decreases(remaining_rows,
                                                                          len(self.stitches_decrease) - 1)

        print('stitches_decrease', self.stitches_decrease)
        print('rows_decrease', self.rows_decrease)

    def add_to_array(self, array):
        # Draw the left part of the neckline
        x_0, y_0 = 0, 0
        x_1, y_1 = self.starting_stitch - 1, 0
        tf.draw_path_on_array(array, [(x_0, y_0), (x_1, y_1)])

        # Build and Draw Neckline
        x = self.starting_stitch  # set start x
        y = 0  # set start y

        # Create Vertices for left side
        left_line_vertices = [(x, y)]
        for i in range(len(self.rows_decrease)):
            y += self.rows_decrease[i]
            left_line_vertices.append((x, y))
            x += self.stitches_decrease[i]
            left_line_vertices.append((x, y))
        print(f'Left vertices: {left_line_vertices}')

        # Create Vertices for right side
        right_line_vertices = [(x, y)]
        for i in range(len(self.rows_decrease) - 1, -1, -1):
            x += self.stitches_decrease[i]
            right_line_vertices.append((x, y))
            y -= self.rows_decrease[i]
            right_line_vertices.append((x, y))
        print(f'Right vertices: {right_line_vertices}')

        # Add left side of neckline to array
        tf.draw_path_on_array(array, left_line_vertices)
        # Add right side of neckline to array
        tf.draw_path_on_array(array, right_line_vertices)

        # Draw the right part of the neckline
        x_0, y_0 = self.starting_stitch + self.stitches, 0
        x_1, y_1 = self.total_stitches - 1, 0
        tf.draw_path_on_array(array, [(x_0, y_0), (x_1, y_1)])
