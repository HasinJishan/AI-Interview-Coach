from flask import Flask
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
CORS(app)

client = MongoClient(os.getenv("MONGO_URI"))
db = client["interview_coach"]

@app.route("/")
def home():
    return {"message": "AI Interview Coach backend is running"}

@app.route("/test-db")
def test_db():
    try:
        client.admin.command("ping")
        return {"status": "MongoDB connected successfully!"}
    except Exception as e:
        return {"status": "Connection failed", "error": str(e)}

if __name__ == "__main__":
    app.run(debug=True, port=5000)