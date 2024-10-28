# Generate_Sweater_Pattern
from datetime import timezone
from pathlib import Path

from django.core.files import File
import asyncio

from ..sweater_objects import Sweater
from django.conf import settings


def generate_sweater_pattern(sweater_info):
    sweater = Sweater(sweater_info)
    front_torso_array, back_torso_array, left_sleeve_array, right_sleeve_array = asyncio.run(sweater.do_calculations())

    return front_torso_array, back_torso_array, left_sleeve_array, right_sleeve_array
