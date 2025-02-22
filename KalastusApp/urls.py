from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),  # Admin-osoite
    path('api/', include('fishing.api.urls')),  # API reitit, jos olet määrittänyt API-sovelluksen
    path('', include('fishing.urls')),  # Root-osoite, jos haluat näyttää sovelluksen juuren
]






