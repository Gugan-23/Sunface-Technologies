# myapp/utils/mongodb.py

from pymongo import MongoClient

def get_mongo_client():
    username = 'vgugan16'
    password = 'gugan2004'
    uri = f"mongodb+srv://{username}:{password}@cluster0.qyh1fuo.mongodb.net/?retryWrites=true&w=majority"
    
    try:
        client = MongoClient(uri)
        client.admin.command('ping')  # Check connection
        return client
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        return None
