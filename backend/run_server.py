#!/usr/bin/env python3
"""
Simple server runner
"""

import os
import sys

# Add current directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

if __name__ == "__main__":
    try:
        print("🚀 Starting AI Content Creator Backend Server...")
        print(f"Python version: {sys.version}")
        print(f"Working directory: {current_dir}")
        
        # Import and run the Flask app
        from api_server import app
        
        print("✅ Flask app imported successfully")
        print("🌐 Starting server on http://localhost:8000")
        
        # Run the Flask app
        app.run(
            host='0.0.0.0',
            port=8000,
            debug=True,
            use_reloader=False  # Disable reloader to prevent issues
        )
        
    except ImportError as e:
        print(f"❌ Import Error: {e}")
        print("Please make sure all dependencies are installed:")
        print("pip install -r requirements.txt")
        sys.exit(1)
        
    except Exception as e:
        print(f"❌ Server Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)