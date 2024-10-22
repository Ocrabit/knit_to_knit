from ..pattern_objects.part import Part


class Torso(Part):
    def __init__(self, width: float, height: float, ribbing: str = None, taper: [] = None, neck=None):
        super().__init__(height, width)

        # ribbing vars
        if ribbing is not None:
            self.ribbing_thickness = ribbing
            self.isRibbing = True

        # taper vars
        if taper is not None:
            self.taper_offset = taper[0]
            self.hem_size = taper[1]

            self.isTaper = True

        # neck vars
        if neck is not None:
            self.offset_width = neck[0]
            self.offset_height = neck[1]
            self.neck_depth = neck[2]
            self.isNeck = True

    async def do_calculations(self, SPI, RPI, needle_size):  # Eventually see if you can consolidate this to part
        await super().do_calculations(SPI, RPI, needle_size)

        if self.isRibbing:
            self.create_ribbing(self.ribbing_thickness)
        if self.isTaper:
            self.create_taper(self.taper_offset, self.hem_size)
        if self.isNeck:
            self.create_neck(self.offset_width, self.offset_height, self.neck_depth)
            print(f"Neck created: {self.neck}")
        self.done_calculations = True

    def taperCalculations(self):
        taper_slope = ((self.width - self.hem_size) / 2) / (
                    self.taper_offset - self.height)  # slope of left and right decreases
        if self.debug_mode:
            print('#debug taper slope is ' + str(taper_slope))
            print('#debug number of rows in torso is ' + str(self.height * self.RPI))
        print(f'Decrease a stitch on the left and right every {self.height * self.RPI * taper_slope} stitches')

    def ribbingCalculations(self):
        print("For you to make this style of ribbing, you should drop one needle size down "
              f"and stitch {self.hem_size} stitches")
        print("Tip: Remember for ribbing you want to do a combination of knit + purl alternating every stitch")  # Tip


class Sleeve(Part):
    def __init__(self, width: float = None, height: float = None, ribbing: str = None, taper: [] = None, neck=None):
        super().__init__(height, width)

        # ribbing vars
        if ribbing is not None:
            self.ribbing_thickness = ribbing
            self.isRibbing = True

        # taper vars
        if taper is not None:
            self.taper_offset = taper[0]
            self.hem_size = taper[1]
            self.taper_style = taper[2]

            self.isTaper = True

        # neck vars
        if neck is not None:
            if neck[2] != 0:
                self.offset_width = neck[0]
                self.offset_height = neck[1]
                self.neck_depth = neck[2]
                self.isNeck = True

    async def do_calculations(self, SPI, RPI, needle_size):  # Eventually see if you can consolidate this to part
        await super().do_calculations(SPI, RPI, needle_size)

        if self.isRibbing:
            self.create_ribbing(self.ribbing_thickness)
        if self.isTaper:
            self.create_taper(self.taper_offset, self.hem_size, self.taper_style)
        if self.isNeck:
            self.create_neck(self.offset_width, self.offset_height, self.neck_depth)
        self.done_calculations = True

    def taperCalculations(self):
        taper_slope = (self.width - self.hem_size) / self.height
        if self.debug_mode:
            print('#debug taper slope is ' + str(taper_slope))
            print('#debug number of rows in torso is ' + str(self.height * self.RPI))
        print(f'Decrease a stitch every {self.height * self.RPI * taper_slope} stitches')

    def ribbingCalculations(self):
        print("For you to make this style of ribbing, you should drop one needle size down "
              f"and stitch {self.hem_size} stitches")
        print("Remember for ribbing you want to do a combination of knit + purl alternating every stitch")  # Tip
