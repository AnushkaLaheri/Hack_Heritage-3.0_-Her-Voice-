    # Women's Safety & Empowerment App - Deployment Guide

    ## 🚀 Quick Deployment Options

    ### Option 1: Render.com (Recommended - Free Tier Available)
    **One-click deployment with render.yaml**

    1. **Push code to GitHub**
    ```bash
    git add .
    git commit -m "Add deployment configuration"
    git push origin main
    ```

    2. **Deploy to Render**
    - Go to [render.com](https://render.com)
    - Click "New" → "Blueprint"
    - Connect your GitHub repository
    - Render will automatically detect render.yaml and deploy both backend and frontend

    ### Option 2: Vercel (Frontend) + Railway (Backend)

    #### Frontend Deployment (Vercel)
    ```bash
    cd frontend
    npm install -g vercel
    vercel --prod
    ```

    #### Backend Deployment (Railway)
    ```bash
    # Install Railway CLI
    npm install -g @railway/cli

    # Deploy backend
    cd backend
    railway login
    railway init
    railway up
    ```

    ## 📋 Pre-Deployment Checklist

    ### Environment Variables Setup
    Create these environment variables in your deployment platform:

    **Backend (.env.production):**
    ```
    FLASK_SECRET_KEY=your-32-char-secret-key
    DATABASE_URL=postgresql://user:pass@host:5432/dbname
    OPENAI_API_KEY=your-openai-api-key
    GOOGLE_CLIENT_ID=your-google-client-id
    MAIL_USERNAME=your-email@gmail.com
    MAIL_PASSWORD=your-email-password
    FRONTEND_URL=https://your-frontend-url.com
    ```

    **Frontend (.env.production):**
    ```
    REACT_APP_API_URL=https://your-backend-url.com
    REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
    ```

    ### Database Migration
    ```bash
    # Update requirements.txt for PostgreSQL
    echo "psycopg2-binary==2.9.7" >> backend/requirements.txt

    # Update DATABASE_URL in app.py
    # Change from: sqlite:///app.db
    # To: os.getenv('DATABASE_URL')
    ```

    ### Production Configuration Updates

    #### Backend Updates (app.py)
    ```python
    # Add production configurations
    import os

    # Update CORS for production
    CORS(app, 
        origins=[os.getenv('FRONTEND_URL', 'http://localhost:3000')],
        methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
        supports_credentials=True)

    # Update file upload for production
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads')
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
    ```

    #### Frontend Updates
    Update API base URL in frontend/src/api/axios.ts:
    ```javascript
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    ```

    ## 🔧 Step-by-Step Deployment

    ### 1. Database Setup (PostgreSQL)
    ```bash
    # On Render.com, database is created automatically
    # On Railway, create PostgreSQL database
    # On Heroku, use Heroku Postgres
    ```

    ### 2. Backend Deployment
    ```bash
    # 1. Update requirements.txt
    cd backend
    pip freeze > requirements.txt

    # 2. Test locally with production settings
    gunicorn app:app --bind 0.0.0.0:5000

    # 3. Deploy to your chosen platform
    ```

    ### 3. Frontend Deployment
    ```bash
    cd frontend
    npm run build
    # Deploy build folder to Vercel/Netlify
    ```

    ### 4. File Storage Setup (Optional)
    For production file uploads, set up:
    - **AWS S3** (Recommended)
    - **Cloudinary** (Free tier available)
    - **Firebase Storage**

    ## 🔐 Security Configuration

    ### SSL/HTTPS
    - Render.com: Automatic SSL
    - Vercel: Automatic SSL
    - Railway: Automatic SSL

    ### CORS Configuration
    ```python
    # Update CORS in app.py for production
    CORS(app, 
        origins=[
            "https://your-frontend-url.com",
            "https://www.your-frontend-url.com"
        ],
        supports_credentials=True)
    ```

    ### Rate Limiting (Optional)
    ```bash
    pip install Flask-Limiter
    ```

    ## 📊 Monitoring Setup

    ### Application Monitoring
    - **Sentry** for error tracking
    - **LogRocket** for frontend monitoring
    - **New Relic** for performance monitoring

    ### Health Checks
    Add health check endpoint in app.py:
    ```python
    @app.route('/health')
    def health_check():
        return jsonify({'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()})
    ```

    ## 🧪 Testing Deployment

    ### Backend Testing
    ```bash
    # Test API endpoints
    curl https://your-backend-url.com/api/test

    # Test database connection
    curl https://your-backend-url.com/health
    ```

    ### Frontend Testing
    - Test all user flows
    - Verify API connections
    - Test file uploads
    - Test email notifications

    ## 🚨 Troubleshooting

    ### Common Issues

    1. **CORS Errors**
    - Check FRONTEND_URL environment variable
    - Verify CORS configuration

    2. **Database Connection**
    - Verify DATABASE_URL format
    - Check database permissions

    3. **File Upload Issues**
    - Ensure upload directory exists
    - Check file size limits

    4. **Email Issues**
    - Verify Gmail SMTP settings
    - Enable "Less secure apps" or use App Password

    ### Debug Commands
    ```bash
    # Check logs on Render
    render logs womens-safety-backend

    # Check logs on Vercel
    vercel logs
    ```

    ## 🎯 Production Checklist

    - [ ] Environment variables configured
    - [ ] Database migrated to PostgreSQL
    - [ ] SSL certificates active
    - [ ] File storage configured
    - [ ] Email service working
    - [ ] All API endpoints tested
    - [ ] Frontend connected to backend
    - [ ] Monitoring setup
    - [ ] Custom domain configured (optional)
    - [ ] Rate limiting enabled (optional)

    ## 📞 Support

    If you encounter issues:
    1. Check deployment platform logs
    2. Verify environment variables
    3. Test locally first
    4. Check CORS configuration
    5. Verify database connection

    ## 🚀 Quick Start Commands

    **Deploy to Render (Recommended):**
    ```bash
    git add .
    git commit -m "Add deployment configuration"
    git push origin main
    # Then go to render.com and deploy
    ```

    **Deploy to Vercel:**
    ```bash
    cd frontend
    vercel --prod
    ```

    **Deploy to Railway:**
    ```bash
    cd backend
    railway up
