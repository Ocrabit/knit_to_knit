from ...tool_functions import tool_functions as tf


class Taper:
    def __init__(self, taper_offset, hem_size, width, working_height, total_stitches, working_rows, taper_style=None):
        self.taper_offset = taper_offset  # The height before starting the taper (in inches)
        self.hem_size = hem_size  # The width to taper to (in inches)
        self.taper_style = taper_style

        # Total width of piece (in inches) - width
        # Total height of piece (in inches) - height
        # Total number of stitches - total_stitches (without ribbing if needed)
        self.total_working_rows = working_rows
        self.total_stitches = total_stitches
        # Total number of rows - total_rows
        print('\nTaper inputs: ',
              f'offset_width: {taper_offset}',
              f'offset_height: {hem_size}',
              f'width: {width}', f'working_height: {working_height}',
              f'total_stitches: {total_stitches}',
              f'working_rows: {working_rows}', f'taper_style: {taper_style}')

        # Number of Stitches the hem is wide
        self.hem_stitches = round(total_stitches * (self.hem_size / width))

        # Number of rows the offset is high
        self.offset_rows = round(working_rows * (self.taper_offset / working_height))

        # Number of rows the remaining_rows are
        remaining_rows = working_rows - self.offset_rows

        # Offset hem
        if taper_style is None or taper_style == "both":
            hem_offset = round((total_stitches - self.hem_stitches) / 2)
        else:
            hem_offset = total_stitches - self.hem_stitches  # Adjust for if they just want a one-sided taper

        self.rows_decrease, self.stitches_decrease = self.taper_decrease(remaining_rows, hem_offset)

        # Validate the sums of rows_decrease and stitches_decrease
        self.validate_decreases()

        print(f'Taper rows_decrease: {self.rows_decrease}')
        print(f'stitches_decrease: {self.stitches_decrease}')

        # Make a decrease function called taper_decrease that calculates the slope and returns the rows_decrease and stitches_decrease
        # The goal is to return something similar to below
        #rows_decrease: [19, 3, 2, 2]
        #stitches_decrease: [2, 2, 3, 4]
        # Each value in the decrease statement corresponds with an alternating adjustment to the points.
        # Ex. first point (x,y), next point (x + stitches_decrease[0], y), next point (x, y + rows_decrease[0), next point (x + stitches_decrease[1], y) etc...

    def taper_decrease(self, remaining_rows, hem_offset):
        print(remaining_rows, hem_offset)
        # Initialize lists to store row and stitch decreases
        rows_decrease = []
        stitches_decrease = []

        # Calculate the initial slope (dy/dx)
        slope = remaining_rows / hem_offset

        # Initialize counters for the row and stitch accumulation
        accumulated_rows = 0

        # Loop through the total rows and calculate where to decrease stitches
        for i in range(hem_offset):
            # Adjust the slope dynamically to prevent overshooting
            current_slope = (remaining_rows - accumulated_rows) / (hem_offset - i)

            # Determine the number of rows to move down based on the current slope
            rows_to_decrease = max(1, round(current_slope))

            # Add the calculated decreases to the lists
            rows_decrease.append(rows_to_decrease)
            stitches_decrease.append(1)  # Always decrease one stitch per step

            accumulated_rows += rows_to_decrease

            # Break the loop if we have reached or exceeded remaining_rows
            if accumulated_rows >= remaining_rows:
                break

        # Adjust the last decrease if accumulated_rows exceeds remaining_rows
        if accumulated_rows > remaining_rows:
            excess = accumulated_rows - remaining_rows
            rows_decrease[-1] -= excess

        return rows_decrease, stitches_decrease

    def validate_decreases(self):
        # Adjust rows_decrease if it exceeds total rows
        total_rows_decrease = sum(self.rows_decrease)
        if total_rows_decrease >= self.total_working_rows:
            excess_rows = total_rows_decrease - (self.total_working_rows - 1)
            self.rows_decrease[-1] -= excess_rows
            print(f"Adjusted rows_decrease to not exceed total rows. Excess: {excess_rows}")

        # Adjust stitches_decrease if it exceeds total stitches
        total_stitches_decrease = sum(self.stitches_decrease)
        if total_stitches_decrease >= self.total_stitches:
            excess_stitches = total_stitches_decrease - (self.total_stitches - 1)
            self.stitches_decrease[-1] -= excess_stitches
            print(f"Adjusted stitches_decrease to not exceed total stitches. Excess: {excess_stitches}")

    def add_to_array(self, array):

        # Draw the left taper offset
        x_0, y_0 = 0, 0
        x_1, y_1 = 0, self.offset_rows-1
        tf.draw_path_on_array(array, [(x_0, y_0), (x_1, y_1)])

        # Build and Draw Taper
        x = 0  # set start x
        y = self.offset_rows-1  # set start y

        print(f'Starting taper vertices\nrows_decrease: {self.rows_decrease}')
        # Create Vertices for left side
        left_line_vertices = [(x, y)]
        for i in range(len(self.rows_decrease)):
            y += self.rows_decrease[i]
            left_line_vertices.append((x, y))
            x += self.stitches_decrease[i]
            left_line_vertices.append((x, y))
        print(f'Left vertices: {left_line_vertices}')


        # Add left to array
        tf.draw_path_on_array(array, left_line_vertices)

        # Add hem to array
        tf.draw_path_on_array(array, [(x, y), (x+self.hem_stitches-1, y)])

        # Create Vertices for right side
        x += self.hem_stitches-1
        right_line_vertices = [(x, y)]
        for i in range(len(self.rows_decrease) - 1, -1, -1):
            x += self.stitches_decrease[i]
            right_line_vertices.append((x, y))
            y -= self.rows_decrease[i]
            right_line_vertices.append((x, y))
        print(f'Right vertices: {right_line_vertices}')

        # Add right taper part to array
        tf.draw_path_on_array(array, right_line_vertices)

        # Draw the right taper offset
        x_0, y_0 = self.total_stitches - 1, 0
        x_1, y_1 = self.total_stitches - 1, self.offset_rows - 1
        tf.draw_path_on_array(array, [(x_0, y_0), (x_1, y_1)])
