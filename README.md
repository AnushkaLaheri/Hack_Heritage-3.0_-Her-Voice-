# Women's Safety & Empowerment App

A comprehensive mobile/web application designed to empower women with safety resources, legal awareness, and community support.

## Features

### 🔐 Authentication
- Multiple authentication options: Aadhaar, PAN, Google OAuth
- OTP verification for Aadhaar/PAN
- Secure user registration and login

### 🏠 Homepage & Navigation
- Role-based navigation (Volunteer/User/Mentor)
- Personal posts and queries management
- Friends/Connections network
- Main feed with categorized posts
- Social interactions (Like, Comment, Share)

### 🤖 AI Assistant
- 24/7 AI Chatbot for legal rights guidance
- Government schemes information
- NGO and police contacts
- Legal document assistance

### 🆘 Emergency Help
- Location-based emergency assistance
- One-tap alert system
- Nearby safe places and volunteers
- Direct contact to police and emergency services

### ⚖️ Gender Equality Hub
- Workplace equality ratings
- Gender pay gap analytics
- Leadership diversity tracking
- Anonymous incident reporting

### 👥 Community Features
- Story & Inspiration Hub
- Mentorship connections
- Anonymous reviews
- Community support network

## Tech Stack

### Frontend
- React.js with TypeScript
- Material-UI for components
- React Router for navigation
- Redux for state management
- Axios for API calls

### Backend
- Flask (Python)
- SQLAlchemy ORM
- JWT authentication
- OpenAI API integration
- Location services

### Database
- SQLite (development)
- PostgreSQL (production ready)

## Project Structure

```
hack_heritage3.0/
├── frontend/                 # React frontend application
├── backend/                  # Flask backend API
├── database/                 # Database schemas and migrations
├── docs/                     # Documentation and wireframes
└── README.md                 # Project documentation
```

## Getting Started

### Prerequisites
- Node.js (v16+)
- Python (v3.8+)
- pip
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hack_heritage3.0
   ```

2. **Backend Setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   python app.py
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm start
   ```

4. **Database Setup**
   ```bash
   cd backend
   python init_db.py
   ```

## Environment Variables

Create `.env` files in both frontend and backend directories:

### Backend (.env)
```
FLASK_SECRET_KEY=your_secret_key
OPENAI_API_KEY=your_openai_key
GOOGLE_CLIENT_ID=your_google_client_id
DATABASE_URL=sqlite:///app.db
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/google` - Google OAuth
- `POST /api/auth/verify-otp` - OTP verification

### Posts & Social
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create new post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

### AI Assistant
- `POST /api/chatbot/query` - Send message to AI assistant
- `GET /api/chatbot/history` - Get chat history

### Emergency Help
- `GET /api/emergency/nearby` - Get nearby help
- `POST /api/emergency/alert` - Send emergency alert

### Gender Equality
- `GET /api/equality/companies` - Get company ratings
- `POST /api/equality/rate` - Rate a company
- `GET /api/equality/dashboard` - Get equality statistics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please contact the development team or create an issue in the repository.
