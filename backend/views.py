from django.http import JsonResponse

def test_view(request):
    return JsonResponse({"message": "Testi onnistui!"}, json_dumps_params={'ensure_ascii': False})

def get_conditions(request):
    return JsonResponse({"condition": "Keli on hyvä kalastukseen"}, json_dumps_params={'ensure_ascii': False})
