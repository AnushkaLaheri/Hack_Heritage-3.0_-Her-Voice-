#!/usr/bin/env python3
"""
Setup script for Women's Safety & Empowerment App
"""

import os
import subprocess
import sys
from pathlib import Path

def run_command(command, cwd=None):
    """Run a command and return the result"""
    try:
        result = subprocess.run(command, shell=True, cwd=cwd, capture_output=True, text=True)
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required")
        return False
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} detected")
    return True

def check_node_version():
    """Check if Node.js is installed"""
    success, stdout, stderr = run_command("node --version")
    if success:
        print(f"✅ Node.js {stdout.strip()} detected")
        return True
    else:
        print("❌ Node.js is not installed. Please install Node.js 16 or higher")
        return False

def setup_backend():
    """Setup the Flask backend"""
    print("\n🔧 Setting up Flask backend...")
    
    backend_dir = Path("backend")
    if not backend_dir.exists():
        print("❌ Backend directory not found")
        return False
    
    # Install Python dependencies
    print("Installing Python dependencies...")
    success, stdout, stderr = run_command("pip install -r requirements.txt", cwd=backend_dir)
    if not success:
        print(f"❌ Failed to install Python dependencies: {stderr}")
        return False
    
    print("✅ Backend dependencies installed")
    return True

def setup_frontend():
    """Setup the React frontend"""
    print("\n🔧 Setting up React frontend...")
    
    frontend_dir = Path("frontend")
    if not frontend_dir.exists():
        print("❌ Frontend directory not found")
        return False
    
    # Install Node.js dependencies
    print("Installing Node.js dependencies...")
    success, stdout, stderr = run_command("npm install", cwd=frontend_dir)
    if not success:
        print(f"❌ Failed to install Node.js dependencies: {stderr}")
        return False
    
    print("✅ Frontend dependencies installed")
    return True

def create_env_files():
    """Create environment files"""
    print("\n📝 Creating environment files...")
    
    # Backend .env
    backend_env = """FLASK_SECRET_KEY=your-secret-key-here-change-in-production
OPENAI_API_KEY=your-openai-api-key-here
GOOGLE_CLIENT_ID=your-google-client-id-here
DATABASE_URL=sqlite:///app.db
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-email-password
"""
    
    backend_env_path = Path("backend/.env")
    if not backend_env_path.exists():
        with open(backend_env_path, "w") as f:
            f.write(backend_env)
        print("✅ Created backend/.env file")
    else:
        print("ℹ️  backend/.env already exists")
    
    # Frontend .env
    frontend_env = """REACT_APP_API_URL=http://localhost:5000
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id-here
"""
    
    frontend_env_path = Path("frontend/.env")
    if not frontend_env_path.exists():
        with open(frontend_env_path, "w") as f:
            f.write(frontend_env)
        print("✅ Created frontend/.env file")
    else:
        print("ℹ️  frontend/.env already exists")

def main():
    """Main setup function"""
    print("🚀 Women's Safety & Empowerment App Setup")
    print("=" * 50)
    
    # Check prerequisites
    if not check_python_version():
        return
    
    if not check_node_version():
        return
    
    # Setup backend
    if not setup_backend():
        return
    
    # Setup frontend
    if not setup_frontend():
        return
    
    # Create environment files
    create_env_files()
    
    print("\n🎉 Setup completed successfully!")
    print("\n📋 Next steps:")
    print("1. Configure your environment variables in backend/.env and frontend/.env")
    print("2. Start the backend: cd backend && python app.py")
    print("3. Start the frontend: cd frontend && npm start")
    print("4. Open http://localhost:3000 in your browser")
    print("\n⚠️  Important:")
    print("- Get an OpenAI API key from https://platform.openai.com/")
    print("- Configure Google OAuth if you want to use Google login")
    print("- Set up email credentials for OTP verification")

if __name__ == "__main__":
    main()
