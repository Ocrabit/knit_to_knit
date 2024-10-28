class Swatch:
    def __init__(self, width: float, height: float, stitches: int, rows: int, needle_size: float):
        self.width = width
        self.height = height
        self.stitches = stitches
        self.rows = rows
        self.needle_size = needle_size

    def get_swatch(self):
        return self.width, self.height, self.stitches, self.rows

    def get_needle(self):
        return self.needle_size
