from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from flask_bcrypt import Bcrypt
from dotenv import load_dotenv
import jwt
import datetime
import os
import json
from groq import Groq

load_dotenv()

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

app = Flask(__name__)
CORS(app)
bcrypt = Bcrypt(app)

client = MongoClient(os.getenv("MONGO_URI"))
db = client["interview_coach"]
users_collection = db["users"]

JWT_SECRET = os.getenv("JWT_SECRET")

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


# ---------- REGISTER ----------
@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if not name or not email or not password:
        return jsonify({"error": "All fields are required"}), 400

    existing_user = users_collection.find_one({"email": email})
    if existing_user:
        return jsonify({"error": "User already exists"}), 400

    hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")

    new_user = {
        "name": name,
        "email": email,
        "password": hashed_password,
        "created_at": datetime.datetime.utcnow()
    }
    users_collection.insert_one(new_user)

    return jsonify({"message": "User registered successfully"}), 201


# ---------- LOGIN ----------
@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    user = users_collection.find_one({"email": email})
    if not user:
        return jsonify({"error": "Invalid email or password"}), 401

    if not bcrypt.check_password_hash(user["password"], password):
        return jsonify({"error": "Invalid email or password"}), 401

    token = jwt.encode(
        {
            "user_id": str(user["_id"]),
            "email": user["email"],
            "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)
        },
        JWT_SECRET,
        algorithm="HS256"
    )

    return jsonify({
        "message": "Login successful",
        "token": token,
        "name": user["name"]
    }), 200


# ---------- GENERATE INTERVIEW QUESTIONS ----------
@app.route("/generate-questions", methods=["POST"])
def generate_questions():
    data = request.get_json()
    interview_type = data.get("type", "HR")
    category = data.get("category", "General")

    prompt = f"""Generate exactly 5 {interview_type} interview questions for a {category} role.
Return ONLY a JSON array of strings, no extra text, no markdown formatting.
Example format: ["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"]"""

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )
        text = response.choices[0].message.content.strip()
        text = text.replace("```json", "").replace("```", "").strip()

        questions = json.loads(text)

        return jsonify({"questions": questions}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)