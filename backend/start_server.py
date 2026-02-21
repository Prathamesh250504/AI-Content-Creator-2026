#!/usr/bin/env python3
"""
Server startup script for production deployment
"""

import sys
import os

# Add current directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

# Get port from environment variable (Render sets this)
port = int(os.getenv('PORT', 8000))

print(f"Python version: {sys.version}")
print(f"Current directory: {current_dir}")
print(f"Server will run on port: {port}")

try:
    print("Testing Flask import...")
    from flask import Flask
    print("✅ Flask imported successfully")
    
    print("Testing Flask-CORS import...")
    from flask_cors import CORS
    print("✅ Flask-CORS imported successfully")
    
    print("Importing API server...")
    from api_server import app
    print("✅ API server imported successfully")
    
    print(f"Starting server on 0.0.0.0:{port}...")
    # Run the Flask app
    app.run(
        host='0.0.0.0',
        port=port,
        debug=False,  # Disable debug in production
        threaded=True
    )
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)