from .sweater_parts import Torso, Sleeve


class FrontTorso(Torso):
    def __init__(self, *args):
        super().__init__(*args)


class BackTorso(Torso):
    def __init__(self, *args):
        super().__init__(*args)


class LeftSleeve(Sleeve):
    def __init__(self, *args):
        super().__init__(*args)


class RightSleeve(Sleeve):
    def __init__(self, *args):
        super().__init__(*args)


