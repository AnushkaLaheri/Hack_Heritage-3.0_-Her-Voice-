from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
from flask_mail import Mail, Message
import os
from datetime import datetime, timedelta
import bcrypt
import jwt
import openai
from geopy.geocoders import Nominatim
from geopy.distance import geodesic
import random
import string
import secrets
from dotenv import load_dotenv
from flask_migrate import Migrate
from google.oauth2 import id_token
from google.auth.transport import requests
from werkzeug.utils import secure_filename
from flask import send_from_directory
from groq import Groq
import sqlite3
from twilio.rest import Client


# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY', 'your-secret-key-here')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///app.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

# Email configuration
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')


# OpenAI configuration
openai.api_key = os.getenv('OPENAI_API_KEY')

account_sid = os.getenv("TWILIO_ACCOUNT_SID")
auth_token = os.getenv("TWILIO_AUTH_TOKEN")
twilio_phone = os.getenv("TWILIO_PHONE")

twilio_client = Client(account_sid, auth_token)


# Initialize extensions
db = SQLAlchemy(app)
jwt = JWTManager(app)
mail = Mail(app)
# Configure CORS - Allow all origins for development
CORS(app, 
     origins=[
         "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://her-voice-six.vercel.app",
        "https://her-voice-six.vercel.app/*",
        "https://www.her-voice-six.vercel.app",
        "https://www.her-voice-six.vercel.app/*"
         
     ],
     methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "Access-Control-Allow-Credentials"],
     supports_credentials=True,
     expose_headers=["Content-Type", "Authorization"])
migrate = Migrate(app, db)


# Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='User')  # User, Volunteer, Mentor
    aadhaar = db.Column(db.String(12), unique=True, nullable=True)
    pan = db.Column(db.String(10), unique=True, nullable=True)
    phone = db.Column(db.String(15), nullable=True)
    location = db.Column(db.String(200), nullable=True)
    profile_image = db.Column(db.String(300), nullable=True)
    preferences = db.Column(db.JSON, nullable=True)
    is_verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    otp = db.Column(db.String(6), nullable=True)
    otp_created_at = db.Column(db.DateTime, nullable=True) 
    emergency_contact=db.relationship("EmergencyContact", backref="user", lazy=True )
    
    # Relationships
    posts = db.relationship('Post', backref='author', lazy=True)
    comments = db.relationship('Comment', backref='author', lazy=True)

    # models.py
class SOSLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    ended_at = db.Column(db.DateTime, nullable=True)
    user = db.relationship('User', backref='sos_logs')

class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    is_anonymous = db.Column(db.Boolean, default=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    likes = db.relationship('Like', backref='post', lazy='dynamic', cascade='all, delete-orphan')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    image_url = db.Column(db.String(300), nullable=True)
    # Relationships
    comments = db.relationship('Comment', backref='post', lazy=True)
    
    @property
    def likes_count(self):
        return self.likes.count()

    def to_dict(self, current_user_id=None):
        return {
            "id": self.id,
            "title": self.title,
            "content": self.content,
            "category": self.category,
            "is_anonymous": self.is_anonymous,
            "author": self.user.username if not self.is_anonymous else "Anonymous",
            "created_at": self.created_at.isoformat(),
            "comments_count": self.comments.count(),
            "likes": self.likes_count,
            "liked_by_me": bool(self.likes.filter_by(user_id=current_user_id).first()) if current_user_id else False,
            "image_url": self.image_url,
        "comments": [
            {
                "id": c.id,
                "content": c.content,
                "author": c.author.username,
                "created_at": c.created_at.isoformat()
            }
            for c in sorted(list(self.comments), key=lambda x: x.created_at, reverse=True)  # latest first
        ]
        }

# models.py
class Like(db.Model):
    __tablename__ = 'likes'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('post.id'), nullable=False)

    __table_args__ = (db.UniqueConstraint('user_id', 'post_id', name='uq_user_post_like'),)

class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)

    # Foreign Keys
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('post.id'), nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Connection(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    connected_user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, accepted, rejected
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Define the relationship with explicit foreign keys
    user = db.relationship('User', foreign_keys=[user_id], backref='outgoing_connections')
    connected_user = db.relationship('User', foreign_keys=[connected_user_id], backref='incoming_connections')

class ChatMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    response = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class CompanyRating(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    company_name = db.Column(db.String(200), nullable=False)
    safety_rating = db.Column(db.Float, nullable=False)
    pay_equality_rating = db.Column(db.Float, nullable=False)
    culture_rating = db.Column(db.Float, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    comment = db.Column(db.Text, nullable=True)
    is_anonymous = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class EmergencyContact(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(15), nullable=False)
    relationship = db.Column(db.String(50), nullable=True)

class GovernmentScheme(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    eligibility = db.Column(db.Text, nullable=False)
    application_process = db.Column(db.Text, nullable=False)
    contact_info = db.Column(db.Text, nullable=False)
    location = db.Column(db.String(200), nullable=True)
    category = db.Column(db.String(100), nullable=False)

class PasswordResetToken(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    token = db.Column(db.String(128), unique=True, nullable=False)
    expiry = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False)

# Skill Swap Models
class SkillCategory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=True)
    icon = db.Column(db.String(50), nullable=True)  # For UI icons
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Skill(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('skill_category.id'), nullable=False)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    category = db.relationship('SkillCategory', backref='skills')

class UserSkill(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    skill_id = db.Column(db.Integer, db.ForeignKey('skill.id'), nullable=False)
    skill_type = db.Column(db.String(20), nullable=False)  # 'teach' or 'learn'
    proficiency_level = db.Column(db.String(20), nullable=True)  # 'beginner', 'intermediate', 'advanced', 'expert'
    description = db.Column(db.Text, nullable=True)  # User's description of their skill/learning goal
    availability = db.Column(db.String(100), nullable=True)  # e.g., "Weekends", "Evenings"
    preferred_method = db.Column(db.String(50), nullable=True)  # 'online', 'offline', 'both'
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='user_skills')
    skill = db.relationship('Skill', backref='user_skills')
    
    # Unique constraint to prevent duplicate entries
    __table_args__ = (db.UniqueConstraint('user_id', 'skill_id', 'skill_type', name='uq_user_skill_type'),)

class SkillMatch(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    teacher_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    learner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    skill_id = db.Column(db.Integer, db.ForeignKey('skill.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')  # 'pending', 'accepted', 'rejected', 'completed'
    message = db.Column(db.Text, nullable=True)  # Initial message from learner
    teacher_response = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    teacher = db.relationship('User', foreign_keys=[teacher_id], backref='teaching_matches')
    learner = db.relationship('User', foreign_keys=[learner_id], backref='learning_matches')
    skill = db.relationship('Skill', backref='matches')

class SkillExchange(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user1_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    user2_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    user1_teaches_skill_id = db.Column(db.Integer, db.ForeignKey('skill.id'), nullable=False)
    user2_teaches_skill_id = db.Column(db.Integer, db.ForeignKey('skill.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')  # 'pending', 'active', 'completed', 'cancelled'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user1 = db.relationship('User', foreign_keys=[user1_id])
    user2 = db.relationship('User', foreign_keys=[user2_id])
    user1_skill = db.relationship('Skill', foreign_keys=[user1_teaches_skill_id])
    user2_skill = db.relationship('Skill', foreign_keys=[user2_teaches_skill_id])

class SkillRating(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    rater_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    rated_user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    skill_id = db.Column(db.Integer, db.ForeignKey('skill.id'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)  # 1-5 stars
    review = db.Column(db.Text, nullable=True)
    match_id = db.Column(db.Integer, db.ForeignKey('skill_match.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    rater = db.relationship('User', foreign_keys=[rater_id])
    rated_user = db.relationship('User', foreign_keys=[rated_user_id])
    skill = db.relationship('Skill')
    match = db.relationship('SkillMatch')

class UserBadge(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    badge_type = db.Column(db.String(50), nullable=False)  # 'first_skill', 'mentor', 'learner', 'expert', etc.
    badge_name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    icon = db.Column(db.String(100), nullable=True)
    earned_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='badges')

# Helper functions
def generate_otp():
    return ''.join(random.choices(string.digits, k=6))


def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password, hashed):
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def send_otp_email(email, otp):
    try:
        msg = Message('OTP Verification - Women Safety App',
                     sender=app.config['MAIL_USERNAME'],
                     recipients=[email])
        msg.body = f'Your OTP for verification is: {otp}'
        mail.send(msg)
        return True
    except Exception as e:
        print(f"Email error: {e}")
        return False

# Password reset helpers

def create_password_reset_token(user_id: int) -> str:
    token = secrets.token_urlsafe(48)
    expiry = datetime.utcnow() + timedelta(hours=1)
    reset = PasswordResetToken(user_id=user_id, token=token, expiry=expiry, used=False)
    db.session.add(reset)
    db.session.commit()
    return token


def send_password_reset_email(email: str, token: str) -> bool:
    try:
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
        reset_link = f"{frontend_url}/reset-password/{token}"
        msg = Message('Password Reset Request - Women Safety App',
                     sender=app.config['MAIL_USERNAME'],
                     recipients=[email])
        msg.body = f"You requested a password reset. Click the link to reset your password: {reset_link}\nIf you did not request this, ignore this email."
        mail.send(msg)
        return True
    except Exception as e:
        print(f"Password reset email error: {e}")
        return False

def get_ai_response(message):
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful AI assistant specializing in women's rights, legal advice, and safety information. Provide accurate, helpful, and supportive responses."},
                {"role": "user", "content": message}
            ],
            max_tokens=500  
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"I'm sorry, I'm having trouble processing your request. Please try again later. Error: {str(e)}"




# Groq Client
try:
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))
except Exception as e:
    print("⚠ Groq client failed to initialize:", e)
    client = None


def ask_database_or_chat(query):
    """
    Smart handler: decides if query needs DB or normal chat
    """
    # Step 1: Check intent using Groq
    intent_resp = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an AI that classifies user questions as 'casual_chat' or 'db_query'. "
                    "If the user is just greeting or chatting, return 'casual_chat'. "
                    "If the user is asking about women schemes, policies, benefits, or data lookup, return 'db_query' only."
                )
            },
            {"role": "user", "content": query}
        ]
    )
    intent = intent_resp.choices[0].message.content.strip().lower()
    print("Intent Detected:", intent)

    # Step 2: If casual conversation → respond like chatbot
    if "casual_chat" in intent:
        chat_resp = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": "You are a friendly chatbot that helps users with information about women empowerment and schemes."
                },
                {"role": "user", "content": query}
            ]
        )
        return chat_resp.choices[0].message.content

    # Step 3: If DB query → generate SQL + explain
    conn = sqlite3.connect("app.db")
    cur = conn.cursor()
    try:
        # Generate SQL
        sql_resp = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": "Convert natural language questions into valid SQLite SQL queries for the 'women_schemes' table. Only return SQL."
                },
                {"role": "user", "content": query}
            ]
        )
        sql_query = (sql_resp.choices[0].message.content or '').strip()
        print("Generated SQL:", sql_query)

        cur.execute(sql_query)
        result = cur.fetchall()

        # Explain result
        explain_resp = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "Explain SQL results in a clear way for the user."},
                {"role": "user", "content": f"SQL Query: {sql_query}\nResult: {result}"}
            ]
        )
        return explain_resp.choices[0].message.content

    except Exception as e:
        return f"⚠ Error: {e}"

    finally:
        conn.close()





@app.route("/check_twilio")
def check_twilio():
    return {
        "sid": account_sid,
        "phone": twilio_phone
    }






@app.route("/api/sos/start", methods=["POST"])
def start_sos():
    data = request.get_json()
    user_id = data.get("user_id")
    latitude = data.get("latitude")
    longitude = data.get("longitude")

    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    # ✅ User verify karo
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Get current location if not provided
    if not latitude or not longitude:
        # For now, use default coordinates - in production, this should be handled by frontend
        latitude = 0.0
        longitude = 0.0

    # ✅ SOS log save karo
    sos = SOSLog(
        user_id=user.id,
        latitude=latitude,
        longitude=longitude,
        created_at=datetime.utcnow()
    )
    db.session.add(sos)
    db.session.commit()

    # ✅ Google Maps link banao
    maps_link = f"https://www.google.com/maps?q={latitude},{longitude}"

    # ✅ Emergency contacts fetch karo
    contacts = EmergencyContact.query.filter_by(user_id=user.id).all()

    if not contacts:
        return jsonify({"message": "SOS started but no emergency contacts found", "sos_id": sos.id}), 200

    # ✅ Har ek contact ko SMS bhejo
    sent_count = 0
    for contact in contacts:
        try:
            if account_sid and auth_token and twilio_phone:
                twilio_client.messages.create(
                    body=f"🚨 SOS Alert! {user.username} needs help.\nLocation: {maps_link}\nContact: {user.phone or 'Not provided'}",
                    from_=twilio_phone,
                    to=contact.phone
                )
                sent_count += 1
            else:
                print(f"Twilio not configured - would send SMS to {contact.phone}")
        except Exception as e:
            print(f"Failed to send SMS to {contact.phone}: {e}")

    return jsonify({
        "message": f"SOS started, {sent_count} contacts notified", 
        "sos_id": sos.id,
        "contacts_notified": sent_count,
        "total_contacts": len(contacts)
    }), 200



# Get user's emergency contacts
@app.route('/api/emergency/contacts/<int:user_id>', methods=['GET'])
def get_contacts(user_id):
    contacts = EmergencyContact.query.filter_by(user_id=user_id).all()
    return jsonify([{
        "id": c.id,
        "name": c.name,
        "phone": c.phone,
        "relationship": c.relationship
    } for c in contacts])

# Add a new emergency contact
@app.route('/api/emergency/contacts', methods=['POST'])
def add_contact():
    data = request.json
    contact = EmergencyContact(
        user_id=data["user_id"],
        name=data["name"],
        phone=data["phone"],
        relationship=data.get("relationship")
    )
    db.session.add(contact)
    db.session.commit()
    return jsonify({"success": True, "contact": {
        "id": contact.id,
        "name": contact.name,
        "phone": contact.phone,
        "relationship": contact.relationship
    }})

# Optional: Delete a contact
@app.route('/api/emergency/contacts/<int:contact_id>', methods=['DELETE'])
def delete_contact(contact_id):
    contact = EmergencyContact.query.get(contact_id)
    if not contact:
        return jsonify({"success": False, "message": "Contact not found"}), 404
    db.session.delete(contact)
    db.session.commit()
    return jsonify({"success": True})






@app.route("/api/sos/active/<int:user_id>", methods=["GET"])
def get_active_sos(user_id):
    sos = SOSLog.query.filter_by(user_id=user_id, ended_at=None).order_by(SOSLog.created_at.desc()).first()
    if sos:
        return jsonify({
            "active": True,
            "sos_id": sos.id,
            "latitude": sos.latitude,
            "longitude": sos.longitude,
            "created_at": sos.created_at.isoformat()
        })
    return jsonify({"active": False})


@app.route("/api/sos/stop", methods=["POST"])
def stop_sos():
    data = request.get_json()
    sos_id = data.get("sos_id")

    sos = SOSLog.query.get(sos_id)
    if not sos:
        return jsonify({"error": "SOS not found"}), 404

    sos.ended_at = datetime.utcnow()  # 👈 Add this column in SOSLog
    db.session.commit()
    return jsonify({"message": "SOS stopped"}),200

@app.route("/api/sos/update", methods=["POST"])
def update_sos_location():
    data = request.get_json()
    sos_id = data.get("sos_id")
    latitude = data.get("latitude")
    longitude = data.get("longitude")

    if not sos_id or not latitude or not longitude:
        return jsonify({"error": "Missing data"}), 400

    # SOS log fetch karo
    sos = SOSLog.query.get(sos_id)
    if not sos:
        return jsonify({"error": "SOS not found"}), 404

    # SOS active hona chahiye
    if sos.ended_at:
        return jsonify({"error": "SOS is already stopped"}), 400

    # Location update kar do
    sos.latitude = latitude
    sos.longitude = longitude
    db.session.commit()

    return jsonify({"message": "Location updated successfully"}), 200

@app.route("/api/sos/live/<int:user_id>", methods=["GET"])
def live_sos_location(user_id):
    # Active SOS fetch karo
    sos = SOSLog.query.filter_by(user_id=user_id, ended_at=None).order_by(SOSLog.created_at.desc()).first()
    if not sos:
        return jsonify({"error": "No active SOS"}), 404

    # Location return karo JSON me
    return jsonify({
        "latitude": sos.latitude,
        "longitude": sos.longitude,
        "username": sos.user.username,
        "created_at": sos.created_at.isoformat()
    })


@app.route("/ask", methods=["POST"])
def ask():
    data = request.get_json()
    user_query = data.get("question", "")
    answer = ask_database_or_chat(user_query)
    return jsonify({"question": user_query, "answer": answer})


@app.route("/")
def home():
    return "Her Voice Backend is running ✅"

# Test route to verify CORS is working
@app.route('/api/test', methods=['GET', 'POST', 'OPTIONS'])
def test_cors():
    return jsonify({
        'message': 'CORS is working!',
        'method': request.method,
        'origin': request.headers.get('Origin'),
        'timestamp': datetime.utcnow().isoformat()
    }), 200

# Authentication routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json() or {}

    email = data.get('email')
    username = data.get('username')
    password = data.get('password')

    if not email or not username or not password:
        return jsonify({'error': 'Username, email and password are required'}), 400

    # If email exists and user is not verified, resend OTP instead of failing
    existing = User.query.filter_by(email=email).first()
    if existing:
        if not existing.is_verified:
            # Update password and optional fields if provided
            if password:
                existing.password_hash = hash_password(password)
            if 'role' in data:
                existing.role = data.get('role', existing.role)
            if 'phone' in data:
                existing.phone = data.get('phone', existing.phone)
            if 'location' in data:
                existing.location = data.get('location', existing.location)
            if data.get('aadhaar'):
                existing.aadhaar = str(data.get('aadhaar')).replace('-', '').strip()
            if data.get('pan'):
                existing.pan = str(data.get('pan')).upper().strip()

            # Regenerate and send OTP
            otp = generate_otp()
            existing.otp = otp
            existing.otp_created_at = datetime.utcnow()
            db.session.commit()
            send_otp_email(existing.email, otp)
            return jsonify({'message': 'Account exists but is not verified. Details updated and a new OTP has been sent.'}), 200
        return jsonify({'error': 'Email already registered'}), 400

    # Create new user
    user = User(
        username=username,
        email=email,
        password_hash=hash_password(password),
        role=data.get('role', 'User'),
        aadhaar=(data.get('aadhaar') or None),
        pan=(data.get('pan') or None),
        phone=(data.get('phone') or None),
        location=(data.get('location') or None),
        is_verified=False
    )

    db.session.add(user)
    db.session.commit()

    # Generate and send OTP
    otp = generate_otp()
    user.otp = otp
    user.otp_created_at = datetime.utcnow()
    db.session.commit()
    send_otp_email(user.email, otp)

    return jsonify({'message': 'Registration successful. Please check your email for OTP verification.'}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()

    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Agar user verified nahi hai
    if not user.is_verified:
        return jsonify({'error': 'Account not verified. Please verify OTP first.'}), 403
    
    # Check if user has a password hash (Google users might not)
    if not user.password_hash or user.password_hash == hash_password('google_oauth_user_no_password'):
        return jsonify({'error': 'This account uses Google Sign-In. Please use Google login or reset your password.'}), 400
    
    if user and verify_password(data['password'], user.password_hash):
        access_token = create_access_token(identity=user.id)
        return jsonify({
            'access_token': access_token,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role,
                'is_verified': user.is_verified
            }
        }), 200
    
   
    
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/auth/verify-otp', methods=['POST'])
def verify_otp():
    data = request.get_json()
    email = data.get('email')
    otp = str(data.get('otp')).strip()  # always treat OTP as string

    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({'error': 'User not found'}), 404

    # check if otp and timestamp exist
    if not user.otp or not user.otp_created_at:
        return jsonify({'error': 'No OTP found. Please request a new one.'}), 400

    # expiry check
    if datetime.utcnow() > user.otp_created_at + timedelta(minutes=5):
        return jsonify({'error': 'OTP expired. Please request a new one.'}), 400

    # OTP match check
    if str(user.otp) == otp:
        user.is_verified = True
        user.otp = None   # clear OTP
        user.otp_created_at = None
        db.session.commit()
        return jsonify({'success': True, 'message': 'Account verified successfully'}), 200

    return jsonify({'error': 'Invalid OTP'}), 400

@app.route('/api/auth/resend-otp', methods=['POST'])
def resend_otp():
    data = request.get_json()
    email = data.get('email')
    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({'error': 'User not found'}), 404

    if user.is_verified:
        return jsonify({'message': 'Account already verified'}), 200

    # Generate new OTP
    otp = generate_otp()
    user.otp = otp
    user.otp_created_at = datetime.utcnow()
    db.session.commit()

    send_otp_email(user.email, otp)
    return jsonify({'message': 'New OTP sent to your email'}), 200

@app.route('/api/auth/login-aadhaar', methods=['POST'])
def login_aadhaar():
    data = request.get_json()
    aadhaar = data.get('aadhaar')
    user = User.query.filter_by(aadhaar=aadhaar).first()

    if not user:
        return jsonify({'error': 'User not found'}), 404

    otp = generate_otp()
    user.otp = otp
    user.otp_created_at = datetime.utcnow()
    db.session.commit()

    send_otp_email(user.email, otp)
    return jsonify({'message': 'OTP sent to registered email'}), 200

@app.route('/api/auth/send-aadhaar-otp', methods=['POST'])
def send_aadhaar_otp():
    data = request.get_json()
    aadhaar_input = data.get('aadhaar').replace("-", "").strip()
    user = User.query.filter_by(aadhaar=aadhaar_input).first()

    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Always generate OTP even if verified (for login via OTP)
    otp = generate_otp()
    user.otp = otp
    user.otp_created_at = datetime.utcnow()
    db.session.commit()

    if send_otp_email(user.email, otp):
        return jsonify({'message': 'OTP sent successfully'}), 200
    else:
        return jsonify({'error': 'Failed to send OTP'}), 500

    
@app.route('/api/auth/send-pan-otp', methods=['POST'])
def send_pan_otp():
    data = request.get_json()
    pan_input = data.get('pan').upper().strip()
    user = User.query.filter_by(pan=pan_input).first()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404

    # ✅ Check email
    print(f"User email: {user.email}")  # This will show in your console
    if not user.email:
        return jsonify({'error': 'No email associated with this PAN'}), 400

    otp = generate_otp()
    user.otp = otp
    user.otp_created_at = datetime.utcnow()
    db.session.commit()

    if send_otp_email(user.email, otp):  # make sure otp is passed
        return jsonify({'message': 'OTP sent to your registered email'}), 200
    else:
        return jsonify({'error': 'Failed to send OTP. Please try again.'}), 500

@app.route('/api/auth/verify-pan-otp', methods=['POST'])
def verify_pan_otp():
    data = request.get_json()
    pan_input = data.get('pan').upper().strip()  # normalize PAN
    otp_input = data.get('otp')

    user = User.query.filter_by(pan=pan_input).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    if user.otp_created_at and datetime.utcnow() > user.otp_created_at + timedelta(minutes=5):
        return jsonify({'error': 'OTP expired'}), 400

    if user.otp == otp_input:
        user.is_verified = True
        user.otp = None
        db.session.commit()

        access_token = create_access_token(identity=user.id)
        return jsonify({
            'access_token': access_token,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role,
                'is_verified': user.is_verified
            }
        }), 200

    # 🔴 Agar OTP galat hai
    return jsonify({'error': 'Invalid OTP'}), 400

@app.route('/api/auth/verify-aadhaar-otp', methods=['POST'])
def verify_aadhaar_otp():
    data = request.get_json()
    aadhaar_input = data.get('aadhaar').replace("-", "").strip()
    otp_input = data.get('otp')

    user = User.query.filter_by(aadhaar=aadhaar_input).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    if user.otp_created_at and datetime.utcnow() > user.otp_created_at + timedelta(minutes=5):
        return jsonify({'error': 'OTP expired'}), 400
    
    print("DB Aadhaar:", user.aadhaar)
    print("DB OTP:", user.otp, type(user.otp))
    print("Input Aadhaar:", aadhaar_input)
    print("Input OTP:", otp_input, type(otp_input))

    if user.otp == otp_input:
        user.is_verified = True
        user.otp = None
        db.session.commit()

        access_token = create_access_token(identity=user.id)
        return jsonify({
            'access_token': access_token,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role,
                'is_verified': user.is_verified
            }
        }), 200

    # 🔴 Agar OTP galat hai
    return jsonify({'error': 'Invalid OTP'}), 400


@app.route('/api/auth/verify-login-otp', methods=['POST'])
def verify_login_otp():
    data = request.get_json()
    identifier = data.get('identifier')  # aadhaar or pan
    otp = data.get('otp')

    user = User.query.filter(
        (User.aadhaar == identifier) | (User.pan == identifier)
    ).first()

    if not user:
        return jsonify({'error': 'User not found'}), 404

    if user.otp_created_at and datetime.utcnow() > user.otp_created_at + timedelta(minutes=5):
        return jsonify({'error': 'OTP expired. Please request a new one.'}), 400

    if user.otp == otp:
        user.is_verified = True
        user.otp = None
        db.session.commit()
        access_token = create_access_token(identity=user.id)
        return jsonify({
            'access_token': access_token,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role,
                'is_verified': user.is_verified
            }
        }), 200

    return jsonify({'error': 'Invalid OTP'}), 400



@app.route('/api/auth/login-pan', methods=['POST'])
def login_pan():
    data = request.get_json()
    pan = data.get('pan')
    user = User.query.filter_by(pan=pan).first()

    if not user:
        return jsonify({'error': 'User not found'}), 404

    otp = generate_otp()
    user.otp = otp
    user.otp_created_at = datetime.utcnow()
    db.session.commit()

    if send_otp_email(user.email, otp):
        return jsonify({'message': 'OTP sent to your registered email'}), 200
    else:
        return jsonify({'error': 'Failed to send OTP. Please try again.'}), 500

@app.route('/api/auth/google-login', methods=['POST'])
def google_login():
    data = request.get_json()
    token = data.get('token')

    try:
        # Verify token
        idinfo = id_token.verify_oauth2_token(token, requests.Request(), os.getenv('GOOGLE_CLIENT_ID'))

        email = idinfo.get("email")
        name = idinfo.get("name")

        user = User.query.filter_by(email=email).first()
        if not user:
            # Google users don't have a password, so we set a dummy hash
            user = User(
                username=name, 
                email=email, 
                password_hash=hash_password('google_oauth_user_no_password'), 
                role="User", 
                is_verified=True
            )
            db.session.add(user)
            db.session.commit()

        access_token = create_access_token(identity=user.id)
        return jsonify({"access_token": access_token, "user": {"id": user.id, "email": user.email}})
    except Exception as e:
        return jsonify({"error": "Google login failed", "details": str(e)}), 400
    
# Forgot/Reset Password routes
@app.route('/api/auth/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email')
    if not email:
        return jsonify({'error': 'Email is required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        # Do not reveal whether the email exists
        return jsonify({'message': 'If this email is registered, a reset link has been sent'}), 200

    token = create_password_reset_token(user.id)
    sent = send_password_reset_email(user.email, token)
    if not sent:
        return jsonify({'error': 'Failed to send reset email'}), 500

    return jsonify({'message': 'Reset link sent to email'}), 200


@app.route('/api/auth/reset-password/<token>', methods=['POST'])
def reset_password(token):
    data = request.get_json()
    new_password = data.get('new_password')
    if not new_password:
        return jsonify({'error': 'New password is required'}), 400

    reset = PasswordResetToken.query.filter_by(token=token, used=False).first()
    if not reset:
        return jsonify({'error': 'Invalid or used token'}), 400

    if datetime.utcnow() > reset.expiry:
        return jsonify({'error': 'Token expired'}), 400

    user = User.query.get(reset.user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    user.password_hash = hash_password(new_password)
    reset.used = True
    db.session.commit()
    return jsonify({'message': 'Password reset successful'}), 200

# Posts routes
@app.route('/api/posts', methods=['GET'])
@jwt_required()
def get_posts():
    category = request.args.get('category')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    current_user_id = get_jwt_identity()
    query = Post.query
    
    if category:
        query = query.filter_by(category=category)
    
    posts = query.order_by(Post.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        'posts': [{
            'id': post.id,
            'title': post.title,
            'content': post.content,
            'category': post.category,
            'is_anonymous': post.is_anonymous,
            'author': 'Anonymous' if post.is_anonymous else post.author.username,
            'likes': post.likes.count(),
            'liked_by_me': bool(post.likes.filter_by(user_id=current_user_id).first()),
            'image_url': post.image_url,
            'created_at': post.created_at.isoformat(),
            'comments_count': len(post.comments),
            'latest_comments': [
                {
                    "id": c.id,
                    "content": c.content,
                    "author": c.author.username if c.author else "Anonymous",
                    "created_at": c.created_at.isoformat()
                }
                for c in sorted(list(post.comments), key=lambda x: x.created_at, reverse=True)[:3]
            ]
        } for post in posts.items],
        'total': posts.total,
        'pages': posts.pages,
        'current_page': page
    }), 200

@app.route('/api/posts/<int:post_id>/comments', methods=['POST'])
@jwt_required()
def add_comment(post_id):
    data = request.get_json()
    current_user_id = get_jwt_identity()

    comment = Comment(
        content=data['content'],
        post_id=post_id,
        user_id=current_user_id
    )
    db.session.add(comment)
    db.session.commit()

    return jsonify({
        "id": comment.id,
        "content": comment.content,
        "author": comment.author.username,   # yaha ab chalega
        "created_at": comment.created_at.isoformat()
    }), 201

@app.route("/api/posts/<int:post_id>", methods=["GET"])
def get_post(post_id):
    post = Post.query.get(post_id)
    if not post:
        return jsonify({"message": "Post not found"}), 404
    return jsonify({"post": post.to_dict()})

@app.route('/api/posts/<int:post_id>/comments', methods=['GET'])
@jwt_required(optional=True)
def get_comments(post_id):
    comments = Comment.query.filter_by(post_id=post_id).order_by(Comment.created_at.desc()).all()
    return jsonify([
        {
            "id": c.id,
            "content": c.content,
            "author": c.author.username,
            "created_at": c.created_at.isoformat()
        }
        for c in comments
    ])


@app.route('/api/posts/<int:post_id>/like', methods=['POST'])
@jwt_required()
def like_post(post_id):
    user_id = get_jwt_identity()
    post = Post.query.get_or_404(post_id)

    existing = Like.query.filter_by(user_id=user_id, post_id=post_id).first()
    if existing:
        db.session.delete(existing)  # UNLIKE
        db.session.commit()
        return jsonify({"liked": False, "likes": post.likes_count}), 200

    db.session.add(Like(user_id=user_id, post_id=post_id))  # LIKE
    db.session.commit()
    return jsonify({"liked": True, "likes": post.likes_count}), 200


# DELETE a post
@app.route('/api/posts/<int:post_id>', methods=['DELETE'])
@jwt_required()
def delete_post(post_id):
    user_id = get_jwt_identity()
    post = Post.query.get_or_404(post_id)

    # ✅ Only the author can delete their post
    if post.user_id != user_id:
        return jsonify({"error": "Unauthorized: You can only delete your own posts"}), 403

    # Delete associated comments and likes first (cascade safety)
    Comment.query.filter_by(post_id=post_id).delete()
    Like.query.filter_by(post_id=post_id).delete()

    # Delete the post itself
    db.session.delete(post)
    db.session.commit()

    return jsonify({"message": "Post deleted successfully!"}), 200


@app.route('/api/posts', methods=['POST'])
@jwt_required()
def create_post():
    user_id = get_jwt_identity()
    title = request.form.get('title')
    content = request.form.get('content')
    category = request.form.get('category')
    is_anonymous = request.form.get('is_anonymous') == 'true'
    
    # Handle image upload
    image = request.files.get('image')
    image_url = None
    if image:
        # Make filename safe
            filename = secure_filename(image.filename)

            # Define the folder where images will be saved
            upload_dir = 'uploads'

            # Create the folder if it doesn't exist
            if not os.path.exists(upload_dir):
                os.makedirs(upload_dir)

            # Save the file
            filepath = os.path.join(upload_dir, filename)
            image.save(filepath)

            # Save URL path for frontend
            image_url = f"/{upload_dir}/{filename}"


    
    post = Post(
        title=title,
        content=content,
        category=category,
        is_anonymous=is_anonymous,
        image_url=image_url,
        user_id=user_id
    )
    
    db.session.add(post)
    db.session.commit()
    
    return jsonify({"message": "Post created successfully!"}), 201

    # Serve uploaded files
    # Serve uploaded files
@app.route('/uploads/<path:filename>')
def serve_uploaded_file(filename):
    # Serve from backend/uploads directory
    uploads_path = os.path.join(app.root_path, 'uploads')
    return send_from_directory(uploads_path, filename)



# AI Chatbot routes
@app.route('/api/chatbot/query', methods=['POST'])
@jwt_required()
def chatbot_query():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    # Get AI response
    ai_response = get_ai_response(data['message'])
    
    # Save to database
    chat_message = ChatMessage(
        user_id=user_id,
        message=data['message'],
        response=ai_response
    )
    
    db.session.add(chat_message)
    db.session.commit()
    
    return jsonify({'response': ai_response}), 200

@app.route('/api/chatbot/history', methods=['GET'])
@jwt_required()
def get_chat_history():
    user_id = get_jwt_identity()
    messages = ChatMessage.query.filter_by(user_id=user_id).order_by(ChatMessage.created_at.desc()).limit(50).all()
    
    return jsonify({
        'messages': [{
            'id': msg.id,
            'message': msg.message,
            'response': msg.response,
            'created_at': msg.created_at.isoformat()
        } for msg in messages]
    }), 200

# Emergency Help routes
@app.route('/api/emergency/nearby', methods=['GET'])
@jwt_required()
def get_nearby_help():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    # Mock data - in production, use real location services
    nearby_places = [
        {
            'name': 'Police Station - Central',
            'type': 'police',
            'distance': '0.5 km',
            'phone': '+91-1234567890',
            'address': '123 Main Street, City Center'
        },
        {
            'name': 'Women Safety Center',
            'type': 'safety_center',
            'distance': '1.2 km',
            'phone': '+91-9876543210',
            'address': '456 Safety Lane, Downtown'
        },
        {
            'name': 'Safe Public Place - Mall',
            'type': 'safe_place',
            'distance': '0.8 km',
            'phone': '+91-5555555555',
            'address': '789 Shopping Mall, City Center'
        }
    ]
    
    return jsonify({'nearby_places': nearby_places}), 200

@app.route('/api/emergency/alert', methods=['POST'])
@jwt_required()
def send_emergency_alert():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    # In production, implement actual SMS/WhatsApp sending
    # For now, just return success
    return jsonify({
        'message': 'Emergency alert sent successfully',
        'alert_id': f'alert_{user_id}_{datetime.utcnow().timestamp()}'
    }), 200

# Gender Equality routes
@app.route('/api/equality/companies', methods=['GET'])
def get_company_ratings():
    companies = CompanyRating.query.all()
    
    # Group by company and calculate averages
    company_stats = {}
    for rating in companies:
        if rating.company_name not in company_stats:
            company_stats[rating.company_name] = {
                'name': rating.company_name,
                'total_ratings': 0,
                'avg_safety': 0,
                'avg_pay_equality': 0,
                'avg_culture': 0
            }
        
        stats = company_stats[rating.company_name]
        stats['total_ratings'] += 1
        stats['avg_safety'] += rating.safety_rating
        stats['avg_pay_equality'] += rating.pay_equality_rating
        stats['avg_culture'] += rating.culture_rating
    
    # Calculate averages
    for company in company_stats.values():
        total = company['total_ratings']
        if total > 0:
            company['avg_safety'] = round(company['avg_safety'] / total, 1)
            company['avg_pay_equality'] = round(company['avg_pay_equality'] / total, 1)
            company['avg_culture'] = round(company['avg_culture'] / total, 1)
        else:
            company['avg_safety'] = 0
            company['avg_pay_equality'] = 0
            company['avg_culture'] = 0
    
    return jsonify({'companies': list(company_stats.values())}), 200

@app.route('/api/equality/rate', methods=['POST'])
@jwt_required()
def rate_company():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    # Check if user already rated this company
    existing_rating = CompanyRating.query.filter_by(
        user_id=user_id,
        company_name=data['company_name']
    ).first()
    
    if existing_rating:
        # Update existing rating
        existing_rating.safety_rating = data['safety_rating']
        existing_rating.pay_equality_rating = data['pay_equality_rating']
        existing_rating.culture_rating = data['culture_rating']
        existing_rating.comment = data.get('comment')
        existing_rating.is_anonymous = data.get('is_anonymous', True)
    else:
        # Create new rating
        rating = CompanyRating(
            company_name=data['company_name'],
            safety_rating=data['safety_rating'],
            pay_equality_rating=data['pay_equality_rating'],
            culture_rating=data['culture_rating'],
            user_id=user_id,
            comment=data.get('comment'),
            is_anonymous=data.get('is_anonymous', True)
        )
        db.session.add(rating)
    
    db.session.commit()
    
    return jsonify({'message': 'Company rated successfully'}), 201

@app.route('/api/equality/dashboard', methods=['GET'])
def get_equality_dashboard():
    # Calculate real statistics from the database
    from sqlalchemy import func
    
    # Get overall statistics
    total_ratings = CompanyRating.query.count()
    avg_safety = db.session.query(func.avg(CompanyRating.safety_rating)).scalar() or 0
    avg_pay_equality = db.session.query(func.avg(CompanyRating.pay_equality_rating)).scalar() or 0
    avg_culture = db.session.query(func.avg(CompanyRating.culture_rating)).scalar() or 0
    
    # Get ratings by company for sector breakdown (mock sectors for now)
    companies = CompanyRating.query.all()
    sector_ratings = {}
    
    for rating in companies:
        # For demo purposes, assign companies to sectors based on name patterns
        sector = 'Other'
        company_lower = rating.company_name.lower()
        
        if any(tech in company_lower for tech in ['tech', 'software', 'it', 'digital']):
            sector = 'Technology'
        elif any(health in company_lower for health in ['health', 'medical', 'hospital', 'care']):
            sector = 'Healthcare'
        elif any(finance in company_lower for finance in ['bank', 'finance', 'investment', 'insurance']):
            sector = 'Finance'
        elif any(edu in company_lower for edu in ['school', 'college', 'university', 'education']):
            sector = 'Education'
        
        if sector not in sector_ratings:
            sector_ratings[sector] = {
                'total_ratings': 0,
                'avg_safety': 0,
                'avg_pay_equality': 0,
                'avg_culture': 0
            }
        
        sector_ratings[sector]['total_ratings'] += 1
        sector_ratings[sector]['avg_safety'] += rating.safety_rating
        sector_ratings[sector]['avg_pay_equality'] += rating.pay_equality_rating
        sector_ratings[sector]['avg_culture'] += rating.culture_rating
    
    # Calculate sector averages
    for sector, stats in sector_ratings.items():
        if stats['total_ratings'] > 0:
            stats['avg_safety'] = round(stats['avg_safety'] / stats['total_ratings'], 1)
            stats['avg_pay_equality'] = round(stats['avg_pay_equality'] / stats['total_ratings'], 1)
            stats['avg_culture'] = round(stats['avg_culture'] / stats['total_ratings'], 1)
    
    # Prepare dashboard data
    dashboard_data = {
        'gender_pay_gap': {
            'overall': round(100 - (avg_pay_equality * 20), 1),  # Convert 1-5 scale to percentage
            'by_sector': {sector: round(100 - (stats['avg_pay_equality'] * 20), 1) 
                         for sector, stats in sector_ratings.items()}
        },
        'leadership_diversity': {
            'women_in_leadership': round(avg_culture * 20, 1),  # Convert 1-5 scale to percentage
            'board_diversity': round((avg_safety + avg_culture) * 10, 1)  # Combined metric
        },
        'harassment_reports': {
            'total_reports': total_ratings,  # Using total ratings as proxy for reports
            'by_sector': {sector: stats['total_ratings'] for sector, stats in sector_ratings.items()}
        }
    }
    
    return jsonify(dashboard_data), 200

# Test route to add sample company ratings
@app.route('/api/equality/test-data', methods=['POST'])
def add_test_data():
    try:
        # Sample company ratings
        sample_ratings = [
            {'company_name': 'Google', 'safety_rating': 4.5, 'pay_equality_rating': 3.8, 'culture_rating': 4.2, 'user_id': 1},
            {'company_name': 'Microsoft', 'safety_rating': 4.3, 'pay_equality_rating': 4.0, 'culture_rating': 4.1, 'user_id': 1},
            {'company_name': 'Amazon', 'safety_rating': 3.8, 'pay_equality_rating': 3.5, 'culture_rating': 3.6, 'user_id': 1},
            {'company_name': 'Apple', 'safety_rating': 4.2, 'pay_equality_rating': 3.9, 'culture_rating': 4.0, 'user_id': 1},
            {'company_name': 'Meta', 'safety_rating': 4.1, 'pay_equality_rating': 3.7, 'culture_rating': 3.9, 'user_id': 1},
            {'company_name': 'Johnson & Johnson', 'safety_rating': 4.4, 'pay_equality_rating': 4.2, 'culture_rating': 4.3, 'user_id': 1},
            {'company_name': 'Pfizer', 'safety_rating': 4.2, 'pay_equality_rating': 4.1, 'culture_rating': 4.0, 'user_id': 1},
            {'company_name': 'JPMorgan Chase', 'safety_rating': 3.9, 'pay_equality_rating': 3.6, 'culture_rating': 3.7, 'user_id': 1},
            {'company_name': 'Goldman Sachs', 'safety_rating': 3.7, 'pay_equality_rating': 3.4, 'culture_rating': 3.5, 'user_id': 1}
        ]
        
        # Clear existing ratings
        CompanyRating.query.delete()
        
        # Add new ratings
        for rating_data in sample_ratings:
            rating = CompanyRating(**rating_data)
            db.session.add(rating)
        
        db.session.commit()
        
        return jsonify({'message': 'Test data added successfully', 'count': len(sample_ratings)}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Government Schemes routes
@app.route('/api/schemes', methods=['GET'])
def get_schemes():
    location = request.args.get('location')
    category = request.args.get('category')
    
    query = GovernmentScheme.query
    
    if location:
        query = query.filter(GovernmentScheme.location.contains(location))
    if category:
        query = query.filter_by(category=category)
    
    schemes = query.all()
    
    return jsonify({
        'schemes': [{
            'id': scheme.id,
            'name': scheme.name,
            'description': scheme.description,
            'eligibility': scheme.eligibility,
            'application_process': scheme.application_process,
            'contact_info': scheme.contact_info,
            'location': scheme.location,
            'category': scheme.category
        } for scheme in schemes]
    }), 200

# User profile routes
@app.route('/api/user/profile', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    # Get emergency contacts
    emergency_contacts = EmergencyContact.query.filter_by(user_id=user_id).all()
    
    return jsonify({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'role': user.role,
        'phone': user.phone,
        'location': user.location,
        'profile_image': user.profile_image,
        'preferences': user.preferences or {},
        'is_verified': user.is_verified,
        'created_at': user.created_at.isoformat(),
        'emergency_contacts': [{
            'id': contact.id,
            'name': contact.name,
            'phone': contact.phone,
            'relationship': contact.relationship
        } for contact in emergency_contacts]
    }), 200

@app.route('/api/user/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    data = request.get_json()
    
    if 'username' in data:
        user.username = data['username']
    if 'phone' in data:
        user.phone = data['phone']
    if 'location' in data:
        user.location = data['location']
    
    db.session.commit()
    
    return jsonify({'message': 'Profile updated successfully'}), 200

# Update emergency contact endpoint
@app.route('/api/profile/emergency-contact', methods=['PUT'])
@jwt_required()
def update_emergency_contact():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    # Validate required fields
    if not data.get('name') or not data.get('phone'):
        return jsonify({'error': 'Name and phone are required'}), 400
    
    # Validate phone number (10 digits)
    phone = data['phone'].replace(' ', '').replace('-', '')
    if not phone.isdigit() or len(phone) != 10:
        return jsonify({'error': 'Phone number must be exactly 10 digits'}), 400
    
    # Check if user already has an emergency contact
    existing_contact = EmergencyContact.query.filter_by(user_id=user_id).first()
    
    if existing_contact:
        # Update existing contact
        existing_contact.name = data['name']
        existing_contact.phone = phone
        existing_contact.relationship = data.get('relationship')
    else:
        # Create new emergency contact
        contact = EmergencyContact(
            user_id=user_id,
            name=data['name'],
            phone=phone,
            relationship=data.get('relationship')
        )
        db.session.add(contact)
    
    db.session.commit()
    
    return jsonify({'message': 'Emergency contact updated successfully'}), 200

# Extended Profile routes
@app.route('/api/profile/<int:user_id>', methods=['GET'])
@jwt_required()
def get_profile_by_id(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'role': user.role,
        'phone': user.phone,
        'location': user.location,
        'profile_image': user.profile_image,
        'preferences': user.preferences or {},
        'is_verified': user.is_verified,
        'created_at': user.created_at.isoformat()
    }), 200


@app.route('/api/profile/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_profile_by_id(user_id):
    current_user_id = get_jwt_identity()
    if current_user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    user = User.query.get_or_404(user_id)

    # Support both JSON and multipart/form-data
    if request.content_type and 'multipart/form-data' in request.content_type:
        user.username = request.form.get('username', user.username)
        user.email = request.form.get('email', user.email)
        user.role = request.form.get('role', user.role)
        user.location = request.form.get('location', user.location)
        user.phone = request.form.get('phone', user.phone)

        image = request.files.get('profile_image')
        if image and image.filename:
            filename = secure_filename(image.filename)
            upload_dir = os.path.join('uploads', 'profile_images')
            os.makedirs(upload_dir, exist_ok=True)
            filepath = os.path.join(upload_dir, filename)
            image.save(filepath)
            user.profile_image = f"/{upload_dir}/{filename}"
    else:
        data = request.get_json() or {}
        user.username = data.get('username', user.username)
        user.email = data.get('email', user.email)
        user.role = data.get('role', user.role)
        user.location = data.get('location', user.location)
        user.phone = data.get('phone', user.phone)
        if 'profile_image' in data:
            user.profile_image = data['profile_image']

    db.session.commit()
    
    # Return updated user data
    return jsonify({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'role': user.role,
        'phone': user.phone,
        'location': user.location,
        'profile_image': user.profile_image,
        'preferences': user.preferences or {},
        'is_verified': user.is_verified,
        'created_at': user.created_at.isoformat()
    }), 200


@app.route('/api/profile/settings', methods=['PATCH'])
@jwt_required()
def update_settings():
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    data = request.get_json() or {}

    # Preferences update
    prefs = user.preferences or {}
    if 'notifications' in data:
        prefs['notifications'] = data['notifications']
    if 'theme' in data:
        prefs['theme'] = data['theme']
    user.preferences = prefs

    # Password change
    if 'current_password' in data and 'new_password' in data:
        if not verify_password(data['current_password'], user.password_hash):
            return jsonify({'error': 'Current password is incorrect'}), 400
        user.password_hash = hash_password(data['new_password'])

    db.session.commit()
    return jsonify({'message': 'Settings updated successfully', 'preferences': user.preferences or {}}), 200

# Skill Swap Helper Functions
def award_badge(user_id, badge_type, badge_name, description, icon=None):
    """Award a badge to a user if they don't already have it"""
    existing_badge = UserBadge.query.filter_by(user_id=user_id, badge_type=badge_type).first()
    if not existing_badge:
        badge = UserBadge(
            user_id=user_id,
            badge_type=badge_type,
            badge_name=badge_name,
            description=description,
            icon=icon
        )
        db.session.add(badge)
        return True
    return False

def send_skill_match_notification(teacher_email, learner_name, skill_name):
    """Send email notification for skill match"""
    try:
        msg = Message('New Skill Learning Request - Her Voice',
                     sender=app.config['MAIL_USERNAME'],
                     recipients=[teacher_email])
        msg.body = f'Hi! {learner_name} is interested in learning {skill_name} from you. Check your Skill Swap dashboard to respond!'
        mail.send(msg)
        return True
    except Exception as e:
        print(f"Notification email error: {e}")
        return False

# Skill Swap API Routes

# Get all skill categories
@app.route('/api/skills/categories', methods=['GET'])
def get_skill_categories():
    categories = SkillCategory.query.all()
    return jsonify({
        'categories': [{
            'id': cat.id,
            'name': cat.name,
            'description': cat.description,
            'icon': cat.icon,
            'skills_count': len(cat.skills)
        } for cat in categories]
    }), 200

# Search skills
@app.route('/api/skills/search', methods=['GET'])
def search_skills():
    query = request.args.get('q', '').strip()
    category_id = request.args.get('category_id', type=int)
    
    skills_query = Skill.query
    
    if query:
        skills_query = skills_query.filter(Skill.name.ilike(f'%{query}%'))
    
    if category_id:
        skills_query = skills_query.filter_by(category_id=category_id)
    
    skills = skills_query.all()
    
    return jsonify({
        'skills': [{
            'id': skill.id,
            'name': skill.name,
            'description': skill.description,
            'category': skill.category.name,
            'category_id': skill.category_id
        } for skill in skills]
    }), 200

# Add/Update user skill
@app.route('/api/skills/user-skills', methods=['POST'])
@jwt_required()
def add_user_skill():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    # Check if skill exists, if not create it
    skill = Skill.query.get(data['skill_id'])
    if not skill:
        return jsonify({'error': 'Skill not found'}), 404
    
    # Check if user already has this skill with same type
    existing = UserSkill.query.filter_by(
        user_id=user_id,
        skill_id=data['skill_id'],
        skill_type=data['skill_type']
    ).first()
    
    if existing:
        # Update existing skill
        existing.proficiency_level = data.get('proficiency_level')
        existing.description = data.get('description')
        existing.availability = data.get('availability')
        existing.preferred_method = data.get('preferred_method')
        existing.is_active = data.get('is_active', True)
        existing.updated_at = datetime.utcnow()
    else:
        # Create new user skill
        user_skill = UserSkill(
            user_id=user_id,
            skill_id=data['skill_id'],
            skill_type=data['skill_type'],
            proficiency_level=data.get('proficiency_level'),
            description=data.get('description'),
            availability=data.get('availability'),
            preferred_method=data.get('preferred_method'),
            is_active=data.get('is_active', True)
        )
        db.session.add(user_skill)
        
        # Award first skill badge
        if data['skill_type'] == 'teach':
            award_badge(user_id, 'first_teach', 'First Teacher', 'Added your first skill to teach!')
        else:
            award_badge(user_id, 'first_learn', 'Eager Learner', 'Added your first skill to learn!')
    
    db.session.commit()
    return jsonify({'message': 'Skill added/updated successfully'}), 201

# Get user's skills
@app.route('/api/skills/user-skills', methods=['GET'])
@jwt_required()
def get_user_skills():
    user_id = get_jwt_identity()
    skill_type = request.args.get('type')  # 'teach' or 'learn'
    
    query = UserSkill.query.filter_by(user_id=user_id, is_active=True)
    
    if skill_type:
        query = query.filter_by(skill_type=skill_type)
    
    user_skills = query.all()
    
    return jsonify({
        'skills': [{
            'id': us.id,
            'skill': {
                'id': us.skill.id,
                'name': us.skill.name,
                'category': us.skill.category.name
            },
            'skill_type': us.skill_type,
            'proficiency_level': us.proficiency_level,
            'description': us.description,
            'availability': us.availability,
            'preferred_method': us.preferred_method,
            'created_at': us.created_at.isoformat(),
            'updated_at': us.updated_at.isoformat()
        } for us in user_skills]
    }), 200

# Browse available skills (what others are teaching)
@app.route('/api/skills/browse', methods=['GET'])
@jwt_required()
def browse_skills():
    current_user_id = get_jwt_identity()
    category_id = request.args.get('category_id', type=int)
    skill_name = request.args.get('skill_name', '').strip()
    location = request.args.get('location', '').strip()
    method = request.args.get('method')  # 'online', 'offline', 'both'
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    # Query for users teaching skills (excluding current user)
    query = db.session.query(UserSkill, User, Skill, SkillCategory).join(
        User, UserSkill.user_id == User.id
    ).join(
        Skill, UserSkill.skill_id == Skill.id
    ).join(
        SkillCategory, Skill.category_id == SkillCategory.id
    ).filter(
        UserSkill.skill_type == 'teach',
        UserSkill.is_active == True,
        UserSkill.user_id != current_user_id
    )
    
    # Apply filters
    if category_id:
        query = query.filter(Skill.category_id == category_id)
    
    if skill_name:
        query = query.filter(Skill.name.ilike(f'%{skill_name}%'))
    
    if location:
        query = query.filter(User.location.ilike(f'%{location}%'))
    
    if method:
        query = query.filter(UserSkill.preferred_method.in_([method, 'both']))
    
    # Paginate results
    results = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'skills': [{
            'id': user_skill.id,
            'skill': {
                'id': skill.id,
                'name': skill.name,
                'description': skill.description,
                'category': category.name
            },
            'teacher': {
                'id': user.id,
                'username': user.username,
                'location': user.location,
                'profile_image': user.profile_image
            },
            'proficiency_level': user_skill.proficiency_level,
            'description': user_skill.description,
            'availability': user_skill.availability,
            'preferred_method': user_skill.preferred_method,
            'created_at': user_skill.created_at.isoformat()
        } for user_skill, user, skill, category in results.items],
        'total': results.total,
        'pages': results.pages,
        'current_page': page
    }), 200

# Request to learn from someone
@app.route('/api/skills/request-match', methods=['POST'])
@jwt_required()
def request_skill_match():
    learner_id = get_jwt_identity()
    data = request.get_json()
    
    teacher_id = data.get('teacher_id')
    skill_id = data.get('skill_id')
    message = data.get('message', '')
    
    # Validate that teacher actually teaches this skill
    teacher_skill = UserSkill.query.filter_by(
        user_id=teacher_id,
        skill_id=skill_id,
        skill_type='teach',
        is_active=True
    ).first()
    
    if not teacher_skill:
        return jsonify({'error': 'Teacher does not offer this skill'}), 400
    
    # Check if request already exists
    existing_match = SkillMatch.query.filter_by(
        teacher_id=teacher_id,
        learner_id=learner_id,
        skill_id=skill_id,
        status='pending'
    ).first()
    
    if existing_match:
        return jsonify({'error': 'Request already sent'}), 400
    
    # Create skill match request
    skill_match = SkillMatch(
        teacher_id=teacher_id,
        learner_id=learner_id,
        skill_id=skill_id,
        message=message,
        status='pending'
    )
    
    db.session.add(skill_match)
    db.session.commit()
    
    # Send notification to teacher
    teacher = User.query.get(teacher_id)
    learner = User.query.get(learner_id)
    skill = Skill.query.get(skill_id)
    
    send_skill_match_notification(teacher.email, learner.username, skill.name)
    
    return jsonify({'message': 'Learning request sent successfully'}), 201

# Get skill match requests
@app.route('/api/skills/match-requests', methods=['GET'])
@jwt_required()
def get_match_requests():
    user_id = get_jwt_identity()
    request_type = request.args.get('type', 'received')  # 'received' or 'sent'
    status = request.args.get('status')  # 'pending', 'accepted', 'rejected'
    
    if request_type == 'received':
        query = SkillMatch.query.filter_by(teacher_id=user_id)
    else:
        query = SkillMatch.query.filter_by(learner_id=user_id)
    
    if status:
        query = query.filter_by(status=status)
    
    matches = query.order_by(SkillMatch.created_at.desc()).all()
    
    return jsonify({
        'matches': [{
            'id': match.id,
            'skill': {
                'id': match.skill.id,
                'name': match.skill.name,
                'category': match.skill.category.name
            },
            'teacher': {
                'id': match.teacher.id,
                'username': match.teacher.username,
                'profile_image': match.teacher.profile_image
            },
            'learner': {
                'id': match.learner.id,
                'username': match.learner.username,
                'profile_image': match.learner.profile_image
            },
            'message': match.message,
            'teacher_response': match.teacher_response,
            'status': match.status,
            'created_at': match.created_at.isoformat(),
            'updated_at': match.updated_at.isoformat()
        } for match in matches]
    }), 200

# Respond to skill match request
@app.route('/api/skills/match-requests/<int:match_id>/respond', methods=['POST'])
@jwt_required()
def respond_to_match_request(match_id):
    user_id = get_jwt_identity()
    data = request.get_json()
    
    match = SkillMatch.query.get_or_404(match_id)
    
    # Only teacher can respond
    if match.teacher_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    if match.status != 'pending':
        return jsonify({'error': 'Request already responded to'}), 400
    
    action = data.get('action')  # 'accept' or 'reject'
    response_message = data.get('message', '')
    
    if action == 'accept':
        match.status = 'accepted'
        # Award mentor badge to teacher
        award_badge(user_id, 'mentor', 'Mentor', 'Started mentoring someone!')
        # Award active learner badge to learner
        award_badge(match.learner_id, 'active_learner', 'Active Learner', 'Got accepted for learning!')
    elif action == 'reject':
        match.status = 'rejected'
    else:
        return jsonify({'error': 'Invalid action'}), 400
    
    match.teacher_response = response_message
    match.updated_at = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({'message': f'Request {action}ed successfully'}), 200

# Get user's badges
@app.route('/api/skills/badges', methods=['GET'])
@jwt_required()
def get_user_badges():
    user_id = get_jwt_identity()
    badges = UserBadge.query.filter_by(user_id=user_id).order_by(UserBadge.earned_at.desc()).all()
    
    return jsonify({
        'badges': [{
            'id': badge.id,
            'badge_type': badge.badge_type,
            'badge_name': badge.badge_name,
            'description': badge.description,
            'icon': badge.icon,
            'earned_at': badge.earned_at.isoformat()
        } for badge in badges]
    }), 200

# Get skill statistics
@app.route('/api/skills/stats', methods=['GET'])
@jwt_required()
def get_skill_stats():
    user_id = get_jwt_identity()
    
    # User's teaching stats
    teaching_count = UserSkill.query.filter_by(user_id=user_id, skill_type='teach', is_active=True).count()
    learning_count = UserSkill.query.filter_by(user_id=user_id, skill_type='learn', is_active=True).count()
    
    # Match stats
    teaching_requests = SkillMatch.query.filter_by(teacher_id=user_id).count()
    learning_requests = SkillMatch.query.filter_by(learner_id=user_id).count()
    accepted_teaching = SkillMatch.query.filter_by(teacher_id=user_id, status='accepted').count()
    accepted_learning = SkillMatch.query.filter_by(learner_id=user_id, status='accepted').count()
    
    # Ratings received
    ratings = SkillRating.query.filter_by(rated_user_id=user_id).all()
    avg_rating = sum(r.rating for r in ratings) / len(ratings) if ratings else 0
    
    # Badge count
    badge_count = UserBadge.query.filter_by(user_id=user_id).count()
    
    return jsonify({
        'teaching_skills': teaching_count,
        'learning_skills': learning_count,
        'teaching_requests_received': teaching_requests,
        'learning_requests_sent': learning_requests,
        'active_teaching_matches': accepted_teaching,
        'active_learning_matches': accepted_learning,
        'average_rating': round(avg_rating, 1),
        'total_ratings': len(ratings),
        'badges_earned': badge_count
    }), 200

# Delete user skill
@app.route('/api/skills/user-skills/<int:skill_id>', methods=['DELETE'])
@jwt_required()
def delete_user_skill(skill_id):
    user_id = get_jwt_identity()
    user_skill = UserSkill.query.filter_by(id=skill_id, user_id=user_id).first_or_404()
    
    db.session.delete(user_skill)
    db.session.commit()
    
    return jsonify({'message': 'Skill deleted successfully'}), 200

# Rate a skill/user
@app.route('/api/skills/rate', methods=['POST'])
@jwt_required()
def rate_skill():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    # Check if user already rated this skill/user combination
    existing_rating = SkillRating.query.filter_by(
        rater_id=user_id,
        rated_user_id=data['rated_user_id'],
        skill_id=data['skill_id']
    ).first()
    
    if existing_rating:
        # Update existing rating
        existing_rating.rating = data['rating']
        existing_rating.review = data.get('review')
    else:
        # Create new rating
        rating = SkillRating(
            rater_id=user_id,
            rated_user_id=data['rated_user_id'],
            skill_id=data['skill_id'],
            rating=data['rating'],
            review=data.get('review'),
            match_id=data.get('match_id')
        )
        db.session.add(rating)
    
    db.session.commit()
    return jsonify({'message': 'Rating submitted successfully'}), 201

# Initialize database
@app.route('/api/init-db', methods=['POST'])
def init_database():
    db.create_all()
    
    # Create demo user if it doesn't exist
    demo_user = User.query.filter_by(email='demo@example.com').first()
    if not demo_user:
        demo_user = User(
            username='Demo User',
            email='demo@example.com',
            password_hash=hash_password('demo123'),
            role='User',
            phone='+91-9876543210',
            location='Mumbai, India',
            is_verified=True
        )
        db.session.add(demo_user)
    
    # Add sample posts if they don't exist
    sample_posts = [
        {
            'title': 'Finding Support in the Community',
            'content': 'I recently joined this platform and I\'m amazed by the supportive community here. It\'s great to know we\'re not alone in our struggles.',
            'category': 'Other',
            'is_anonymous': False,
            'user_id': demo_user.id
        },
        {
            'title': 'Workplace Safety Concerns',
            'content': 'I\'ve been experiencing some uncomfortable situations at work. Does anyone have advice on how to handle workplace harassment professionally?',
            'category': 'Workplace Harassment',
            'is_anonymous': True,
            'user_id': demo_user.id
        },
        {
            'title': 'Empowering Women Through Education',
            'content': 'Education is the key to empowerment. Let\'s support each other in our educational and career goals!',
            'category': 'Other',
            'is_anonymous': False,
            'user_id': demo_user.id
        }
    ]
    
    for post_data in sample_posts:
        existing_post = Post.query.filter_by(title=post_data['title']).first()
        if not existing_post:
            post = Post(**post_data)
            db.session.add(post)
    
    # Add sample government schemes
    schemes = [
        {
            'name': 'Beti Bachao Beti Padhao',
            'description': 'A government scheme to save and educate the girl child',
            'eligibility': 'Families with girl children under 10 years',
            'application_process': 'Apply through local government offices',
            'contact_info': 'Toll-free: 1800-XXX-XXXX',
            'location': 'All India',
            'category': 'Education'
        },
        {
            'name': 'Sukanya Samriddhi Yojana',
            'description': 'Small deposit scheme for girl child',
            'eligibility': 'Girl child below 10 years',
            'application_process': 'Apply at post office or authorized banks',
            'contact_info': 'Contact nearest post office',
            'location': 'All India',
            'category': 'Financial'
        }
    ]
    
    for scheme_data in schemes:
        existing_scheme = GovernmentScheme.query.filter_by(name=scheme_data['name']).first()
        if not existing_scheme:
            scheme = GovernmentScheme(**scheme_data)
            db.session.add(scheme)
    
    # Add sample skill categories and skills
    skill_categories = [
        {'name': 'Technology', 'description': 'Programming, web development, data science', 'icon': '💻'},
        {'name': 'Creative Arts', 'description': 'Design, photography, writing, music', 'icon': '🎨'},
        {'name': 'Business & Finance', 'description': 'Marketing, accounting, entrepreneurship', 'icon': '💼'},
        {'name': 'Languages', 'description': 'English, Spanish, French, local languages', 'icon': '🗣️'},
        {'name': 'Health & Wellness', 'description': 'Yoga, nutrition, mental health', 'icon': '🧘'},
        {'name': 'Crafts & DIY', 'description': 'Knitting, cooking, gardening, handicrafts', 'icon': '🧶'},
        {'name': 'Education & Training', 'description': 'Teaching, tutoring, skill development', 'icon': '📚'},
        {'name': 'Life Skills', 'description': 'Communication, leadership, time management', 'icon': '🌟'}
    ]
    
    for cat_data in skill_categories:
        existing_cat = SkillCategory.query.filter_by(name=cat_data['name']).first()
        if not existing_cat:
            category = SkillCategory(**cat_data)
            db.session.add(category)
    
    db.session.commit()  # Commit categories first
    
    # Add sample skills
    sample_skills = [
        # Technology
        {'name': 'Python Programming', 'category': 'Technology', 'description': 'Learn Python for web development and data science'},
        {'name': 'Web Development', 'category': 'Technology', 'description': 'HTML, CSS, JavaScript, React'},
        {'name': 'Data Analysis', 'category': 'Technology', 'description': 'Excel, SQL, data visualization'},
        {'name': 'Digital Marketing', 'category': 'Technology', 'description': 'Social media, SEO, content marketing'},
        
        # Creative Arts
        {'name': 'Graphic Design', 'category': 'Creative Arts', 'description': 'Photoshop, Illustrator, design principles'},
        {'name': 'Photography', 'category': 'Creative Arts', 'description': 'Portrait, landscape, photo editing'},
        {'name': 'Creative Writing', 'category': 'Creative Arts', 'description': 'Storytelling, blogging, copywriting'},
        {'name': 'Music Production', 'category': 'Creative Arts', 'description': 'Audio editing, composition, instruments'},
        
        # Business & Finance
        {'name': 'Financial Planning', 'category': 'Business & Finance', 'description': 'Budgeting, investments, savings'},
        {'name': 'Entrepreneurship', 'category': 'Business & Finance', 'description': 'Starting a business, business planning'},
        {'name': 'Project Management', 'category': 'Business & Finance', 'description': 'Planning, execution, team coordination'},
        
        # Languages
        {'name': 'English Communication', 'category': 'Languages', 'description': 'Speaking, writing, grammar'},
        {'name': 'Spanish Language', 'category': 'Languages', 'description': 'Conversational Spanish, grammar'},
        {'name': 'Hindi Language', 'category': 'Languages', 'description': 'Speaking and writing Hindi'},
        
        # Health & Wellness
        {'name': 'Yoga & Meditation', 'category': 'Health & Wellness', 'description': 'Asanas, breathing, mindfulness'},
        {'name': 'Nutrition Counseling', 'category': 'Health & Wellness', 'description': 'Healthy eating, meal planning'},
        {'name': 'Mental Health Support', 'category': 'Health & Wellness', 'description': 'Stress management, counseling'},
        
        # Crafts & DIY
        {'name': 'Cooking & Baking', 'category': 'Crafts & DIY', 'description': 'Traditional recipes, baking techniques'},
        {'name': 'Knitting & Sewing', 'category': 'Crafts & DIY', 'description': 'Clothing, accessories, repairs'},
        {'name': 'Gardening', 'category': 'Crafts & DIY', 'description': 'Indoor plants, vegetable gardening'},
        
        # Education & Training
        {'name': 'Math Tutoring', 'category': 'Education & Training', 'description': 'School math, competitive exams'},
        {'name': 'Science Teaching', 'category': 'Education & Training', 'description': 'Physics, chemistry, biology'},
        {'name': 'Career Counseling', 'category': 'Education & Training', 'description': 'Resume writing, interview prep'},
        
        # Life Skills
        {'name': 'Public Speaking', 'category': 'Life Skills', 'description': 'Confidence, presentation skills'},
        {'name': 'Leadership Development', 'category': 'Life Skills', 'description': 'Team management, decision making'},
        {'name': 'Time Management', 'category': 'Life Skills', 'description': 'Productivity, organization, planning'}
    ]
    
    for skill_data in sample_skills:
        existing_skill = Skill.query.filter_by(name=skill_data['name']).first()
        if not existing_skill:
            category = SkillCategory.query.filter_by(name=skill_data['category']).first()
            if category:
                skill = Skill(
                    name=skill_data['name'],
                    category_id=category.id,
                    description=skill_data['description']
                )
                db.session.add(skill)
    
    db.session.commit()
    
    return jsonify({'message': 'Database initialized successfully with demo user and skill swap data'}), 200

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=5000)
