#!/usr/bin/env python3
"""
Simple server startup script
"""

import sys
import os

# Add current directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

print(f"Python version: {sys.version}")
print(f"Current directory: {current_dir}")
print(f"Python path: {sys.path[:3]}")

try:
    print("Testing Flask import...")
    from flask import Flask
    print("✅ Flask imported successfully")
    
    print("Testing Flask-CORS import...")
    from flask_cors import CORS
    print("✅ Flask-CORS imported successfully")
    
    print("Starting API server...")
    # Import and run the server
    import api_server
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()