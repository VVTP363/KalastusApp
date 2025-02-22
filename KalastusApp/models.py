from django.db import models

class FishingLog(models.Model):
    date = models.DateField()
    location = models.CharField(max_length=255)
    fish_type = models.CharField(max_length=100)

    def __str__(self):
        return f"FishingLog on {self.date} at {self.location}"
