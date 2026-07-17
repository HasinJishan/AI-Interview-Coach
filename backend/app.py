from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from flask_bcrypt import Bcrypt
from dotenv import load_dotenv
import jwt
import datetime
import os
import json
import re
from groq import Groq
import cloudinary
import cloudinary.uploader
import PyPDF2
import io

load_dotenv()

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

app = Flask(__name__)
CORS(app)
bcrypt = Bcrypt(app)

client = MongoClient(os.getenv("MONGO_URI"))
db = client["interview_coach"]
users_collection = db["users"]
interviews_collection = db["interviews"]
resumes_collection = db["resumes"]
coding_collection = db["coding_submissions"]

JWT_SECRET = os.getenv("JWT_SECRET")


def clean_json_text(text):
    """Remove markdown fences and trailing commas that break json.loads()"""
    text = text.replace("```json", "").replace("```", "").strip()
    text = re.sub(r',(\s*[\]}])', r'\1', text)
    return text


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
        text = clean_json_text(response.choices[0].message.content.strip())
        questions = json.loads(text)

        return jsonify({"questions": questions}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------- SUBMIT INTERVIEW FOR AI FEEDBACK ----------
@app.route("/submit-interview", methods=["POST"])
def submit_interview():
    data = request.get_json()
    interview_type = data.get("type", "HR")
    category = data.get("category", "General")
    qa_pairs = data.get("qa_pairs", [])
    user_email = data.get("email")

    qa_text = "\n\n".join(
        [f"Q{i+1}: {qa['question']}\nA{i+1}: {qa['answer']}" for i, qa in enumerate(qa_pairs)]
    )

    prompt = f"""You are an expert interview coach. Review this {interview_type} interview for a {category} role.

{qa_text}

Return ONLY a JSON object with this exact structure, no extra text, no markdown:
{{
  "overall_score": <number 0-100>,
  "summary": "<2-3 sentence overall assessment>",
  "feedback": [
    {{"question_number": 1, "score": <0-10>, "feedback": "<1-2 sentence specific feedback>"}},
    ...one entry per question...
  ],
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"]
}}"""

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5
        )
        text = clean_json_text(response.choices[0].message.content.strip())
        result = json.loads(text)

        interview_record = {
            "email": user_email,
            "type": interview_type,
            "category": category,
            "qa_pairs": qa_pairs,
            "overall_score": result.get("overall_score"),
            "summary": result.get("summary"),
            "feedback": result.get("feedback"),
            "strengths": result.get("strengths"),
            "improvements": result.get("improvements"),
            "created_at": datetime.datetime.utcnow()
        }
        interviews_collection.insert_one(interview_record)

        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------- GET USER'S INTERVIEW HISTORY / STATS ----------
@app.route("/my-stats", methods=["POST"])
def my_stats():
    data = request.get_json()
    user_email = data.get("email")

    interviews = list(interviews_collection.find({"email": user_email}).sort("created_at", -1))

    total = len(interviews)
    avg_score = 0
    if total > 0:
        avg_score = sum(i.get("overall_score", 0) for i in interviews) / total

    for i in interviews:
        i["_id"] = str(i["_id"])

    return jsonify({
        "total_interviews": total,
        "average_score": round(avg_score, 1),
        "recent_interviews": interviews[:5]
    }), 200


# ---------- UPLOAD & ANALYZE RESUME ----------
@app.route("/upload-resume", methods=["POST"])
def upload_resume():
    if "resume" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["resume"]
    user_email = request.form.get("email")

    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    if not file.filename.lower().endswith(".pdf"):
        return jsonify({"error": "Only PDF files are supported"}), 400

    try:
        file_bytes = file.read()

        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        resume_text = ""
        for page in pdf_reader.pages:
            resume_text += page.extract_text() or ""

        if not resume_text.strip():
            return jsonify({"error": "Could not extract text from PDF. Try a different file."}), 400

        upload_result = cloudinary.uploader.upload(
            file_bytes,
            resource_type="raw",
            folder="resumes",
            public_id=f"{user_email}_{datetime.datetime.utcnow().timestamp()}"
        )
        file_url = upload_result.get("secure_url")

        prompt = f"""You are an expert resume reviewer and ATS (Applicant Tracking System) specialist.
Analyze this resume text and provide feedback.

RESUME TEXT:
{resume_text[:6000]}

Return ONLY a JSON object with this exact structure, no extra text, no markdown:
{{
  "ats_score": <number 0-100>,
  "summary": "<2-3 sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "missing_skills": ["<skill or section 1>", "<skill or section 2>"],
  "improvements": [
    {{"area": "<e.g. Formatting, Content, Keywords>", "suggestion": "<specific actionable suggestion>"}},
    ...3-5 entries...
  ],
  "grammar_issues": <number of grammar/spelling issues found, estimate>
}}"""

        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4
        )
        text = clean_json_text(response.choices[0].message.content.strip())
        analysis = json.loads(text)

        resume_record = {
            "email": user_email,
            "file_url": file_url,
            "filename": file.filename,
            "ats_score": analysis.get("ats_score"),
            "summary": analysis.get("summary"),
            "strengths": analysis.get("strengths"),
            "missing_skills": analysis.get("missing_skills"),
            "improvements": analysis.get("improvements"),
            "grammar_issues": analysis.get("grammar_issues"),
            "created_at": datetime.datetime.utcnow()
        }
        resumes_collection.insert_one(resume_record)

        return jsonify(analysis), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------- GET LATEST RESUME SCORE (for dashboard) ----------
@app.route("/latest-resume", methods=["POST"])
def latest_resume():
    data = request.get_json()
    user_email = data.get("email")

    resume = resumes_collection.find_one(
        {"email": user_email}, sort=[("created_at", -1)]
    )

    if not resume:
        return jsonify({"has_resume": False}), 200

    resume["_id"] = str(resume["_id"])
    resume["has_resume"] = True
    return jsonify(resume), 200


# ---------- CODING QUESTIONS BANK ----------
CODING_QUESTIONS = {
    "Arrays": [
        {"id": "arr1", "title": "Find the Maximum Element", "difficulty": "Easy", "description": "Write a function that takes an array of integers and returns the maximum value in it."},
        {"id": "arr2", "title": "Reverse an Array", "difficulty": "Easy", "description": "Write a function that reverses an array in place without using built-in reverse functions."},
        {"id": "arr3", "title": "Two Sum", "difficulty": "Medium", "description": "Given an array of integers and a target sum, return the indices of the two numbers that add up to the target."},
    ],
    "Strings": [
        {"id": "str1", "title": "Check Palindrome", "difficulty": "Easy", "description": "Write a function that checks if a given string is a palindrome (reads the same forwards and backwards)."},
        {"id": "str2", "title": "Count Vowels", "difficulty": "Easy", "description": "Write a function that counts the number of vowels in a given string."},
        {"id": "str3", "title": "First Non-Repeating Character", "difficulty": "Medium", "description": "Find the first character in a string that doesn't repeat."},
    ],
    "Loops": [
        {"id": "loop1", "title": "FizzBuzz", "difficulty": "Easy", "description": "Print numbers 1 to 100. For multiples of 3 print 'Fizz', for multiples of 5 print 'Buzz', for both print 'FizzBuzz'."},
        {"id": "loop2", "title": "Sum of Digits", "difficulty": "Easy", "description": "Write a function that calculates the sum of digits of a given number."},
    ],
    "Stack": [
        {"id": "stk1", "title": "Valid Parentheses", "difficulty": "Medium", "description": "Given a string of brackets, determine if the brackets are balanced using a stack."},
    ],
    "Queue": [
        {"id": "q1", "title": "Implement Queue using Two Stacks", "difficulty": "Medium", "description": "Implement a queue data structure using two stacks."},
    ],
}

@app.route("/coding-questions", methods=["GET"])
def get_coding_questions():
    return jsonify(CODING_QUESTIONS), 200


# ---------- SUBMIT CODE FOR AI REVIEW ----------
@app.route("/submit-code", methods=["POST"])
def submit_code():
    data = request.get_json()
    question_title = data.get("question_title", "")
    question_description = data.get("question_description", "")
    code = data.get("code", "")
    language = data.get("language", "Python")
    user_email = data.get("email")

    if not code.strip():
        return jsonify({"error": "Please write some code before submitting"}), 400

    prompt = f"""You are an expert coding interviewer reviewing a candidate's solution.

Problem: {question_title}
Description: {question_description}
Language: {language}

Candidate's Code:
{code}

Return ONLY a JSON object with this exact structure, no extra text, no markdown:
{{
  "correctness_score": <0-10, does the logic solve the problem correctly>,
  "efficiency_score": <0-10, time/space complexity quality>,
  "code_quality_score": <0-10, readability, naming, structure>,
  "overall_verdict": "<Correct / Partially Correct / Incorrect>",
  "feedback": "<2-4 sentences explaining what's good and what's wrong>",
  "suggestions": ["<specific improvement 1>", "<specific improvement 2>"]
}}"""

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3
        )
        text = clean_json_text(response.choices[0].message.content.strip())
        result = json.loads(text)

        coding_collection.insert_one({
            "email": user_email,
            "question_title": question_title,
            "code": code,
            "language": language,
            "correctness_score": result.get("correctness_score"),
            "efficiency_score": result.get("efficiency_score"),
            "code_quality_score": result.get("code_quality_score"),
            "overall_verdict": result.get("overall_verdict"),
            "created_at": datetime.datetime.utcnow()
        })

        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------- GET FULL USER HISTORY ----------
@app.route("/history", methods=["POST"])
def get_history():
    data = request.get_json()
    user_email = data.get("email")

    interviews = list(interviews_collection.find({"email": user_email}).sort("created_at", -1))
    resumes = list(resumes_collection.find({"email": user_email}).sort("created_at", -1))
    coding = list(coding_collection.find({"email": user_email}).sort("created_at", -1))

    for i in interviews:
        i["_id"] = str(i["_id"])
    for r in resumes:
        r["_id"] = str(r["_id"])
    for c in coding:
        c["_id"] = str(c["_id"])

    return jsonify({
        "interviews": interviews,
        "resumes": resumes,
        "coding": coding
    }), 200


# ---------- UPDATE PROFILE (NAME) ----------
@app.route("/update-profile", methods=["POST"])
def update_profile():
    data = request.get_json()
    email = data.get("email")
    name = data.get("name")

    if not email or not name:
        return jsonify({"error": "Name is required"}), 400

    result = users_collection.update_one(
        {"email": email},
        {"$set": {"name": name}}
    )

    if result.matched_count == 0:
        return jsonify({"error": "User not found"}), 404

    return jsonify({"message": "Profile updated successfully"}), 200


# ---------- CHANGE PASSWORD ----------
@app.route("/change-password", methods=["POST"])
def change_password():
    data = request.get_json()
    email = data.get("email")
    current_password = data.get("currentPassword")
    new_password = data.get("newPassword")

    user = users_collection.find_one({"email": email})
    if not user:
        return jsonify({"error": "User not found"}), 404

    if not bcrypt.check_password_hash(user["password"], current_password):
        return jsonify({"error": "Current password is incorrect"}), 401

    if len(new_password) < 6:
        return jsonify({"error": "New password must be at least 6 characters"}), 400

    hashed_new_password = bcrypt.generate_password_hash(new_password).decode("utf-8")
    users_collection.update_one(
        {"email": email},
        {"$set": {"password": hashed_new_password}}
    )

    return jsonify({"message": "Password changed successfully"}), 200


# ---------- GET PROFILE OVERVIEW (for Profile page) ----------
@app.route("/profile-overview", methods=["POST"])
def profile_overview():
    data = request.get_json()
    email = data.get("email")

    user = users_collection.find_one({"email": email})
    if not user:
        return jsonify({"error": "User not found"}), 404

    total_interviews = interviews_collection.count_documents({"email": email})
    total_resumes = resumes_collection.count_documents({"email": email})
    total_coding = coding_collection.count_documents({"email": email})

    return jsonify({
        "name": user.get("name"),
        "email": user.get("email"),
        "member_since": user.get("created_at").isoformat() if user.get("created_at") else None,
        "total_interviews": total_interviews,
        "total_resumes": total_resumes,
        "total_coding": total_coding,
    }), 200


# ---------- DELETE ACCOUNT ----------
@app.route("/delete-account", methods=["POST"])
def delete_account():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    user = users_collection.find_one({"email": email})
    if not user:
        return jsonify({"error": "User not found"}), 404

    if not bcrypt.check_password_hash(user["password"], password):
        return jsonify({"error": "Incorrect password"}), 401

    users_collection.delete_one({"email": email})
    interviews_collection.delete_many({"email": email})
    resumes_collection.delete_many({"email": email})
    coding_collection.delete_many({"email": email})

    return jsonify({"message": "Account deleted successfully"}), 200

# ---------- ADMIN: GET ALL USERS ----------
@app.route("/admin/users", methods=["POST"])
def admin_get_users():
    data = request.get_json()
    admin_email = data.get("admin_email")

    # Simple admin check - only this email can access admin routes
    if admin_email != os.getenv("ADMIN_EMAIL"):
        return jsonify({"error": "Unauthorized"}), 403

    users = list(users_collection.find({}, {"password": 0}).sort("created_at", -1))
    for u in users:
        u["_id"] = str(u["_id"])

    return jsonify({"users": users, "total": len(users)}), 200


# ---------- ADMIN: PLATFORM ANALYTICS ----------
@app.route("/admin/analytics", methods=["POST"])
def admin_analytics():
    data = request.get_json()
    admin_email = data.get("admin_email")

    if admin_email != os.getenv("ADMIN_EMAIL"):
        return jsonify({"error": "Unauthorized"}), 403

    total_users = users_collection.count_documents({})
    total_interviews = interviews_collection.count_documents({})
    total_resumes = resumes_collection.count_documents({})
    total_coding = coding_collection.count_documents({})

    all_interviews = list(interviews_collection.find({}, {"overall_score": 1}))
    avg_interview_score = 0
    if all_interviews:
        scores = [i.get("overall_score", 0) for i in all_interviews if i.get("overall_score") is not None]
        avg_interview_score = round(sum(scores) / len(scores), 1) if scores else 0

    return jsonify({
        "total_users": total_users,
        "total_interviews": total_interviews,
        "total_resumes": total_resumes,
        "total_coding": total_coding,
        "avg_interview_score": avg_interview_score
    }), 200


# ---------- ADMIN: DELETE A USER ----------
@app.route("/admin/delete-user", methods=["POST"])
def admin_delete_user():
    data = request.get_json()
    admin_email = data.get("admin_email")
    target_email = data.get("target_email")

    if admin_email != os.getenv("ADMIN_EMAIL"):
        return jsonify({"error": "Unauthorized"}), 403

    users_collection.delete_one({"email": target_email})
    interviews_collection.delete_many({"email": target_email})
    resumes_collection.delete_many({"email": target_email})
    coding_collection.delete_many({"email": target_email})

    return jsonify({"message": "User deleted successfully"}), 200


if __name__ == "__main__":
    app.run(debug=True, port=5000)