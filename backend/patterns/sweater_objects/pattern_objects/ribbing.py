from ...tool_functions import tool_functions as tf


class Ribbing:
    def __init__(self, needle_size: float, RPI: float, length_of_ribbing: str, parent):   # ALl ribbing needs to be even. Compare hem_size/stitches to ribbing make sure ribbing is less than or equal to hem. Slice to hem size then make even
        self.needle_size = needle_size
        self.RPI = RPI

        # Determine length of ribbing in inches
        if length_of_ribbing == 'thick':
            self.length_of_ribbing = 3
        elif length_of_ribbing == 'thin':
            self.length_of_ribbing = 1
        else:
            self.length_of_ribbing = 2

        # number of rows ribbing will be
        self.rows = None
        # Value saved from parent (Part) determines where to start adding ribbing on the y-axis
        self.working_rows = None
        self.total_rows = parent.rows
        self.total_stitches = parent.stitches

        # Calculate Rows
        self.calculate_ribbing(parent)

    def calculate_ribbing(self, parent):
        self.rows = round((self.RPI/self.needle_size) * (self.needle_size-1) * self.length_of_ribbing)
        print('ribing_rows', self.rows)
        parent.working_rows -= self.rows
        self.working_rows = parent.working_rows

        #Update working height
        parent.working_height = parent.height-self.length_of_ribbing

        # DEBUG LOGS
        if parent.debug_mode:
            print("RIBBING\nWorking_rows: ", self.working_rows)
            print("Total_Rows: ", parent.rows)
            print("Working_rows,", parent.working_rows, "\nWorking_Height,", parent.working_height)
            print("RPI,", parent.RPI, "\nrows,", parent.rows, "\nHeight,", parent.height)

    def add_to_array(self, array, hem_stitches=None, taper_style=None):  # hem_stitches is width of hem
        # Calculate hem offset
        if hem_stitches is not None:
            hem_offset = (self.total_stitches - hem_stitches) // 2
        else:
            hem_offset = 0

        # Starting coordinates
        y_0 = self.working_rows  # Ribbing starts after working rows

        # Ending coordinates
        y_1 = y_0 + self.rows - 1  # Ribbing ends after its number of rows

        # Adjust x coordinates based on taper_style
        if taper_style == 'bottom':
            x_0 = hem_offset*2  # Start from hem_offset
            x_1 = self.total_stitches - 1  # Extend to the right edge
        elif taper_style == 'top':
            x_0 = 0  # Start from the left edge
            x_1 = self.total_stitches - hem_offset*2 - 1  # End before hem_offset on the right
        else:
            x_0 = hem_offset  # Start from hem_offset
            x_1 = self.total_stitches - hem_offset - 1  # End before hem_offset on the right

        # Ensure x_0 and x_1 are within bounds
        x_0 = max(0, x_0)
        x_1 = min(self.total_stitches - 1, x_1)

        # Correct for even post
        if (x_0+x_1) % 2 == 0:
            x_1 += 1

        # Debug statements (optional)
        print('RIBBING ARRAY ADD')
        print(f'hem_stitches: {hem_stitches}')
        print(f'hem_offset: {hem_offset}')
        print(f'x_0: {x_0}, y_0: {y_0}')
        print(f'x_1: {x_1}, y_1: {y_1}')

        # Draw the ribbing area
        tf.draw_area_on_array(array, (x_0, y_0), (x_1, y_1))

