from ...tool_functions import tool_functions as tf


class Ribbing:
    def __init__(self, needle_size: float, RPI: float, length_of_ribbing: str, parent):   # ALl ribbing needs to be even. Compare hem_size/stitches to ribbing make sure ribbing is less than or equal to hem. Slice to hem size then make even
        self.needle_size = needle_size
        self.RPI = RPI

        # Determine length of ribbing in inches
        if length_of_ribbing == 'thick':
            self.length_of_ribbing = 3
        elif length_of_ribbing == 'thin':
            self.length_of_ribbing = 2
        else:
            self.length_of_ribbing = 1

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
        # Ensure hem_stitches is even
        if hem_stitches is not None and hem_stitches % 2 != 0:
            hem_stitches -= 1  # Make it even by adding 1

        # Draw the ribbing section
        if hem_stitches is not None:
            print('RIBBING ARRAY ADD')
            print('hem_offset-1, ', round((self.total_stitches - hem_stitches) / 2))
            print('self.working_rows-1, ', self.working_rows-1)
            hem_offset = round((self.total_stitches - hem_stitches) / 2)

            x_0, y_0 = hem_offset-1, self.working_rows
            if taper_style is not None and taper_style != 'both':
                if taper_style == 'bottom':
                    x_1, y_1 = self.total_stitches-1, self.working_rows + self.rows -1
                else:  # Means Top
                    x_0, y_0 = 0, self.working_rows-1
                    x_1, y_1 = self.total_stitches-hem_offset-1, self.working_rows + self.rows-1
            else:
                x_1, y_1 = self.total_stitches-hem_offset, self.working_rows + self.rows-1
                print(self.total_stitches)
                print('x_1', x_1)
                print('y_1', y_1)

        else:
            x_0, y_0 = 0, self.working_rows-1
            x_1, y_1 = self.total_stitches-1, self.working_rows + self.rows-1

        tf.draw_area_on_array(array, (x_0, y_0), (x_1, y_1), 2)

