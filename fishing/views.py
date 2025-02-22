from django.http import JsonResponse

def test_view(request):
    data = {'message': 'Testiview toimii!'}
    return JsonResponse(data)

def get_conditions(request):
    data = {'condition': 'esim. keli on hyvä kalastukseen'}
    return JsonResponse(data)
# fishing/views.py
from django.shortcuts import render
from .models import FishingLocation

def home(request):
    return render(request, 'home.html')

def fishing_location(request):
    locations = FishingLocation.objects.all()
    return render(request, 'fishing_locations.html', {'locations': locations})
