# mappers.py
from .sweater_objects.sweater_pieces import Torso, Sleeve
from .sweater_objects.pattern_objects import Swatch as SwatchClass


def map_swatch_model_to_class(swatch_model):
    return SwatchClass(
        width=swatch_model.width,
        height=swatch_model.height,
        stitches=swatch_model.stitches,
        rows=swatch_model.rows,
        needle_size=swatch_model.needle_size
    )


def map_torso_model_to_classes(torso_model):
    print('Torso Model: \n', torso_model.width, torso_model.height, torso_model.ribbing,
          torso_model.taper_offset, torso_model.taper_hem, torso_model.neck_offset_width,
          torso_model.neck_offset_height, torso_model.neck_depth)
    front_torso = Torso(
        width=torso_model.width,
        height=torso_model.height,
        ribbing=torso_model.ribbing,
        taper_offset=torso_model.taper_offset,
        taper_hem=torso_model.taper_hem,
        neck_offset_width=torso_model.neck_offset_width,
        neck_offset_height=torso_model.neck_offset_height,
        neck_depth=torso_model.neck_depth
    )
    back_torso = Torso(
        width=torso_model.width,
        height=torso_model.height,
        ribbing=torso_model.ribbing,
        taper_offset=torso_model.taper_offset,
        taper_hem=torso_model.taper_hem,
        neck_offset_width=torso_model.neck_offset_width,
        neck_offset_height=torso_model.neck_offset_height,
        neck_depth=torso_model.neck_depth
    )
    return front_torso, back_torso


def map_sleeve_model_to_classes(sleeve_model):
    print('Sleeve Model: \n', sleeve_model.width, sleeve_model.height, sleeve_model.ribbing,
          sleeve_model.taper_offset, sleeve_model.taper_hem, sleeve_model.taper_style,
          sleeve_model.neck_offset_width,
          sleeve_model.neck_offset_height, sleeve_model.neck_depth)
    left_sleeve = Sleeve(
        width=sleeve_model.width,
        height=sleeve_model.height,
        ribbing=sleeve_model.ribbing,
        taper_offset=sleeve_model.taper_offset,
        taper_hem=sleeve_model.taper_hem,
        taper_style=sleeve_model.taper_style,
        neck_offset_width=sleeve_model.neck_offset_width,
        neck_offset_height=sleeve_model.neck_offset_height,
        neck_depth=sleeve_model.neck_depth
    )
    right_sleeve = Sleeve(
        width=sleeve_model.width,
        height=sleeve_model.height,
        ribbing=sleeve_model.ribbing,
        taper_offset=sleeve_model.taper_offset,
        taper_hem=sleeve_model.taper_hem,
        taper_style=sleeve_model.taper_style,
        neck_offset_width=sleeve_model.neck_offset_width,
        neck_offset_height=sleeve_model.neck_offset_height,
        neck_depth=sleeve_model.neck_depth
    )
    return left_sleeve, right_sleeve
