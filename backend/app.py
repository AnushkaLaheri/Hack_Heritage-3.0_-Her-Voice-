from flask import Flask, request, jsonify
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
from dotenv import load_dotenv
from flask_migrate import Migrate
from google.oauth2 import id_token
from google.auth.transport import requests
from werkzeug.utils import secure_filename
from flask import send_from_directory


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

# Initialize extensions
db = SQLAlchemy(app)
jwt = JWTManager(app)
mail = Mail(app)
CORS(app)
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
    is_verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    otp = db.Column(db.String(6), nullable=True)
    otp_created_at = db.Column(db.DateTime, nullable=True) 
    
    # Relationships
    posts = db.relationship('Post', backref='author', lazy=True)
    comments = db.relationship('Comment', backref='author', lazy=True)

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
            for c in sorted(self.comments, key=lambda x: x.created_at, reverse=True)  # latest first
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

# Authentication routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()

    # Check if user already exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 400

    # Generate OTP
    otp = generate_otp()

    # Create new user
    user = User(
        username=data['username'],
        email=data['email'],
        password_hash=hash_password(data['password']),
        role=data.get('role', 'User'),
        aadhaar=data.get('aadhaar'),
        pan=data.get('pan'),
        phone=data.get('phone'),
        location=data.get('location'),
        otp=otp,                # ✅ Save OTP
        is_verified=False
    )

    db.session.add(user)
    db.session.commit()
    otp = generate_otp()
    user.otp = otp
    user.otp_created_at = datetime.utcnow()
    db.session.commit()
    # Send OTP email
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
        idinfo = id_token.verify_oauth2_token(token, requests.Request(), "YOUR_GOOGLE_CLIENT_ID")

        email = idinfo.get("email")
        name = idinfo.get("name")

        user = User.query.filter_by(email=email).first()
        if not user:
            user = User(username=name, email=email, role="User", is_verified=True)
            db.session.add(user)
            db.session.commit()

        access_token = create_access_token(identity=user.id)
        return jsonify({"access_token": access_token, "user": {"id": user.id, "email": user.email}})
    except Exception as e:
        return jsonify({"error": "Google login failed", "details": str(e)}), 400
    
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
                for c in sorted(post.comments, key=lambda x: x.created_at, reverse=True)[:3]
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

    
    post = Post(
        title=title,
        content=content,
        category=category,
        is_anonymous=is_anonymous,
        image_url=f"/{upload_dir}/{filename}" if filename else None,
        user_id=user_id
    )
    
    db.session.add(post)
    db.session.commit()
    
    return jsonify({"message": "Post created successfully!"}), 201

# Serve uploaded files
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    upload_dir = os.path.join(os.getcwd(), 'uploads')
    return send_from_directory(upload_dir, filename)

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
        company['avg_safety'] /= total
        company['avg_pay_equality'] /= total
        company['avg_culture'] /= total
    
    return jsonify({'companies': list(company_stats.values())}), 200

@app.route('/api/equality/rate', methods=['POST'])
@jwt_required()
def rate_company():
    user_id = get_jwt_identity()
    data = request.get_json()
    
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
    # Mock dashboard data
    dashboard_data = {
        'gender_pay_gap': {
            'overall': 23.5,
            'by_sector': {
                'Technology': 18.2,
                'Healthcare': 25.1,
                'Finance': 30.5,
                'Education': 15.8
            }
        },
        'leadership_diversity': {
            'women_in_leadership': 28.3,
            'board_diversity': 22.1
        },
        'harassment_reports': {
            'total_reports': 1250,
            'by_sector': {
                'Technology': 320,
                'Healthcare': 280,
                'Finance': 450,
                'Education': 200
            }
        }
    }
    
    return jsonify(dashboard_data), 200

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
    
    return jsonify({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'role': user.role,
        'phone': user.phone,
        'location': user.location,
        'is_verified': user.is_verified,
        'created_at': user.created_at.isoformat()
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
    
    db.session.commit()
    
    return jsonify({'message': 'Database initialized successfully with demo user'}), 200

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=5000)
