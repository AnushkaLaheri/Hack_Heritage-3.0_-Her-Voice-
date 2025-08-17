# Quick Start Guide - Women's Safety & Empowerment App

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Python 3.8+ installed
- Node.js 16+ installed
- Git installed

### Step 1: Clone and Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd hack_heritage3.0

# Run the setup script
python setup.py
```

### Step 2: Configure Environment Variables

#### Backend Configuration (`backend/.env`)
```env
FLASK_SECRET_KEY=your-secret-key-here
OPENAI_API_KEY=your-openai-api-key
GOOGLE_CLIENT_ID=your-google-client-id
DATABASE_URL=sqlite:///app.db
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-email-password
```

#### Frontend Configuration (`frontend/.env`)
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
```

### Step 3: Start the Application

#### Terminal 1 - Backend
```bash
cd backend
python app.py
```
Backend will run on: http://localhost:5000

#### Terminal 2 - Frontend
```bash
cd frontend
npm start
```
Frontend will run on: http://localhost:3000

### Step 4: Access the Application
1. Open http://localhost:3000 in your browser
2. Register a new account or use the demo credentials
3. Explore the features!

## 🔑 Demo Credentials (for testing)
```
Email: demo@example.com
Password: demo123
```

## 📱 Key Features to Test

### 1. Authentication
- ✅ Email/Password login
- ✅ Aadhaar/PAN login (simulated)
- ✅ Google OAuth (configured)
- ✅ OTP verification

### 2. Emergency Features
- ✅ One-tap emergency alert
- ✅ Nearby help locations
- ✅ Emergency contacts
- ✅ Safety tips

### 3. AI Assistant
- ✅ 24/7 chatbot
- ✅ Legal advice
- ✅ Safety information
- ✅ Government schemes info

### 4. Community Features
- ✅ Create posts (anonymous option)
- ✅ View community posts
- ✅ Like and comment
- ✅ Category filtering

### 5. Gender Equality Hub
- ✅ Company ratings
- ✅ Pay gap analytics
- ✅ Leadership diversity stats
- ✅ Anonymous reporting

## 🛠️ Development Commands

### Backend Development
```bash
cd backend
# Install dependencies
pip install -r requirements.txt

# Run with auto-reload
python app.py

# Initialize database
curl -X POST http://localhost:5000/api/init-db
```

### Frontend Development
```bash
cd frontend
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## 🔧 API Testing

### Test Authentication
```bash
# Register a new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "role": "User"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Test AI Chatbot
```bash
# Send a message to AI assistant
curl -X POST http://localhost:5000/api/chatbot/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "What are my rights at work?"
  }'
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

#### 2. Database Issues
```bash
cd backend
# Remove old database
rm app.db

# Reinitialize
python -c "from app import app, db; app.app_context().push(); db.create_all()"
```

#### 3. Node Modules Issues
```bash
cd frontend
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 4. Python Dependencies Issues
```bash
cd backend
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Reinstall dependencies
pip install -r requirements.txt
```

### Environment Variables Not Loading
- Ensure `.env` files are in the correct directories
- Check file permissions
- Restart the application after changes

### OpenAI API Issues
- Verify your API key is correct
- Check API quota and billing
- Test with a simple curl request

## 📊 Monitoring

### Backend Logs
```bash
# View Flask logs
tail -f backend/app.log

# Monitor API requests
curl -X GET http://localhost:5000/api/health
```

### Frontend Logs
- Open browser developer tools
- Check Console tab for errors
- Monitor Network tab for API calls

## 🚀 Production Deployment

### Backend (Flask)
```bash
# Install production dependencies
pip install gunicorn

# Run with Gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Frontend (React)
```bash
# Build production version
npm run build

# Serve with nginx or similar
npx serve -s build -l 3000
```

## 📞 Support

### Getting Help
1. Check the troubleshooting section above
2. Review the README.md for detailed documentation
3. Check the wireframes in docs/WIREFRAMES.md
4. Open an issue on GitHub

### Feature Requests
- Use GitHub Issues for feature requests
- Provide detailed descriptions
- Include use cases and examples

### Bug Reports
- Include error messages
- Describe steps to reproduce
- Provide system information
- Include relevant logs

## 🎯 Next Steps

### For Users
1. Complete your profile
2. Add emergency contacts
3. Explore the AI assistant
4. Join the community

### For Developers
1. Review the codebase structure
2. Check API documentation
3. Set up development environment
4. Contribute to the project

### For Organizations
1. Customize for your needs
2. Add your branding
3. Configure emergency contacts
4. Train the AI assistant

---

**Remember**: This app is designed to help women stay safe and empowered. Always prioritize user safety and privacy in any modifications or deployments.
