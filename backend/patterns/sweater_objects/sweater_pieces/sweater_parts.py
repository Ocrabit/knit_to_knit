from ..pattern_objects.part import Part


class Torso(Part):
    def __init__(self, width: float, height: float, ribbing: str = None, taper_offset: float = 0, taper_hem: float = 0, taper_style: str = None, neck_offset_width: float = 0, neck_offset_height: float = 0, neck_depth: float = 0):
        super().__init__(width, height, ribbing, taper_offset, taper_hem, taper_style,neck_offset_width, neck_offset_height, neck_depth)


class Sleeve(Part):
    def __init__(self, width: float, height: float, ribbing: str = None, taper_offset: float = 0, taper_hem: float = 0, taper_style: str = None, neck_offset_width: float = 0, neck_offset_height: float = 0, neck_depth: float = 0):
        super().__init__(width, height, ribbing, taper_offset, taper_hem, taper_style, neck_offset_width, neck_offset_height, neck_depth)
