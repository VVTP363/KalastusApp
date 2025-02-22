from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='home'),  # Root-sivun reitti
    # Muita reittejä, kuten kalastuspaikat tai kalastustiedot
]

