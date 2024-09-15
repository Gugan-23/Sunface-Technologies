from django.shortcuts import render
from django.http import HttpResponse, HttpResponseBadRequest
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from .utils import get_mongo_client
from bson import ObjectId
import bcrypt

@method_decorator(csrf_exempt, name='dispatch')
class AuthView(View):
    def post(self, request):
        client = get_mongo_client()
        if not client:
            return HttpResponse("Failed to connect to MongoDB")

        db = client['test']
        collection = db['users']

        action = request.POST.get('action')

        if action == "signup":
            username = request.POST.get('username')
            email = request.POST.get('email')
            password = request.POST.get('password')

            if not username or not email or not password:
                return HttpResponseBadRequest("Missing required fields")

            try:
                # Check if email already exists
                if collection.find_one({"email": email}):
                    return HttpResponse(f"User with email {email} already exists!")

                # Hash the password
                hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

                # Insert a document
                collection.insert_one({
                    "_id": ObjectId(),
                    "username": username,
                    "email": email,
                    "password": hashed_password
                })

                return HttpResponse("Signup successful! <a href='/'>Login</a>")

            except Exception as e:
                return HttpResponse(f"Failed to interact with MongoDB: {e}")

        elif action == "login":
            email = request.POST.get('email')
            password = request.POST.get('password')

            if not email or not password:
                return HttpResponseBadRequest("Missing required fields")

            try:
                # Find user by email
                user = collection.find_one({"email": email})

                if user and bcrypt.checkpw(password.encode('utf-8'), user['password']):
                    # Fetch all users to display
                    user_list = list(collection.find({}, {'username': 1, 'email': 1, '_id': 1}))

                    # Format user list
                    formatted_user_list = [{
                        'username': u.get('username'),
                        'email': u.get('email'),
                        'user_id': str(u.get('_id'))
                    } for u in user_list]

                    return render(request, 'user_list.html', {'users': formatted_user_list})

                return HttpResponse("Invalid email or password")

            except Exception as e:
                return HttpResponse(f"Failed to interact with MongoDB: {e}")

    def get(self, request):
        action = request.GET.get('action', 'signup')
        return render(request, 'auth.html', {'action': action})
