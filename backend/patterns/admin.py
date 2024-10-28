from django.contrib import admin
from .models import *

# Register your models here.
admin.site.register(Pattern)
admin.site.register(Sweater)
admin.site.register(Swatch)
admin.site.register(Torso_Projection)
admin.site.register(Sleeve_Projection)
admin.site.register(SweaterPiece)

