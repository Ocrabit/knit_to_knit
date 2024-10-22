class Swatch:
    def __init__(self, width: float, length: float, num_stitches: int, num_rows: int):
        self.width = width
        self.length = length
        self.num_stitches = num_stitches
        self.num_rows = num_rows

    def get_swatch(self):
        return self.width, self.length, self.num_stitches, self.num_rows
