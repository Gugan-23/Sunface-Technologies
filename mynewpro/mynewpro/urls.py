# In urls.py
from django.urls import path
from . import views
from django.contrib import admin
from django.urls import path, include  # Add 'include' here
from .views import AuthView,AdminView,user_list_view,home,profile
urlpatterns = [
    #path('test-db/', views.test_mongo_connection, name='test_db_connection'),
    # path('', views.test_mongo_connection, name='test-mongo'),
    path('', AuthView.as_view(), name='auth'),
    path('users_list/', user_list_view, name='users_list'),
    #   path('auth/', AuthView.as_view(), name='auth'),  # Auth view for login/signup
    path('admin/', AdminView.as_view(), name='admin'),  # Admin view
     path('home/', home, name='home'),
     path('profile/',profile, name='profile'),
     #path('', views.auth_view, name='auth'),
     #path('signup/', views.auth_view, name='signup'),
     #path('login/', views.auth_view, name='login'),

       #path('submit-form/', views.submit_form, name='submit_form') # Replace with your actual view
     #path('', include('frontend.urls'))
      #path('test-mongo/', views.test_mongo, name='test-mongo')
]

