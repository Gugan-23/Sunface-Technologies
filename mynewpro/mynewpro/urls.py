# In urls.py
from django.urls import path
from . import views
from django.contrib import admin
from django.urls import path, include  # Add 'include' here
from .views import AuthView
urlpatterns = [
    #path('test-db/', views.test_mongo_connection, name='test_db_connection'),
    # path('', views.test_mongo_connection, name='test-mongo'),
    path('', AuthView.as_view(), name='auth'),
        #path('', views.auth_view, name='auth'),
     #path('signup/', views.auth_view, name='signup'),
    #path('login/', views.auth_view, name='login'),

       #path('submit-form/', views.submit_form, name='submit_form') # Replace with your actual view
     #path('', include('frontend.urls'))
      #path('test-mongo/', views.test_mongo, name='test-mongo')
]
