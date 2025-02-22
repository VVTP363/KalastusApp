from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import FishingSpot, WeatherData, MoonPhase, FishingLog

admin.site.register(FishingSpot)
admin.site.register(WeatherData)
admin.site.register(MoonPhase)
admin.site.register(FishingLog)
