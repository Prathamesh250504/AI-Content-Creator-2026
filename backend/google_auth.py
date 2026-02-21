"""
Google OAuth Authentication Handler
Handles Google OAuth 2.0 authentication flow
"""

import os
import logging
from typing import Dict, Optional
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from auth import auth_manager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GoogleAuthHandler:
    """Handles Google OAuth authentication"""
    
    def __init__(self):
        self.client_id = os.getenv('GOOGLE_CLIENT_ID')
        if not self.client_id:
            logger.warning("GOOGLE_CLIENT_ID not set in environment variables")
    
    def verify_google_token(self, token: str) -> Optional[Dict]:
        """
        Verify Google ID token and extract user information
        
        Args:
            token: Google ID token from frontend
            
        Returns:
            Dict with user info if valid, None if invalid
        """
        try:
            # Verify the token
            idinfo = id_token.verify_oauth2_token(
                token, 
                google_requests.Request(), 
                self.client_id
            )
            
            # Token is valid, extract user information
            user_info = {
                'google_id': idinfo['sub'],
                'email': idinfo['email'],
                'email_verified': idinfo.get('email_verified', False),
                'first_name': idinfo.get('given_name', ''),
                'last_name': idinfo.get('family_name', ''),
                'full_name': idinfo.get('name', ''),
                'picture': idinfo.get('picture', ''),
                'locale': idinfo.get('locale', 'en')
            }
            
            logger.info(f"Successfully verified Google token for user: {user_info['email']}")
            return user_info
            
        except ValueError as e:
            logger.error(f"Invalid Google token: {e}")
            return None
        except Exception as e:
            logger.error(f"Error verifying Google token: {e}")
            return None
    
    def authenticate_google_user(self, token: str) -> Dict:
        """
        Authenticate user with Google OAuth token
        
        Args:
            token: Google ID token from frontend
            
        Returns:
            Dict with success status, user info, and JWT token
        """
        try:
            # Verify Google token
            google_user_info = self.verify_google_token(token)
            
            if not google_user_info:
                return {
                    'success': False,
                    'error': 'Invalid Google token'
                }
            
            # Check if email is verified
            if not google_user_info['email_verified']:
                return {
                    'success': False,
                    'error': 'Email not verified with Google'
                }
            
            # Generate user ID from email
            user_id = auth_manager.generate_user_id(google_user_info['email'])
            
            # Check if user exists
            from database import db_manager
            existing_user = db_manager.get_user_profile(user_id)
            
            if existing_user:
                # User exists, perform login
                profile = existing_user['profile']
                
                # Update last login
                profile['stats']['last_login'] = google_user_info.get('last_login')
                profile['stats']['login_count'] = profile['stats'].get('login_count', 0) + 1
                
                # Update profile picture if changed
                if google_user_info.get('picture'):
                    profile['picture'] = google_user_info['picture']
                
                # Save updated profile
                db_manager.update_user_profile(user_id, profile)
                
                # Generate JWT token
                jwt_token = auth_manager.create_jwt_token(user_id, google_user_info['email'])
                
                return {
                    'success': True,
                    'message': 'Login successful',
                    'user': {
                        'user_id': user_id,
                        'email': profile['email'],
                        'first_name': profile['first_name'],
                        'last_name': profile['last_name'],
                        'display_name': profile['display_name'],
                        'picture': profile.get('picture'),
                        'role': profile.get('role', 'user'),
                        'preferences': profile.get('preferences', {}),
                        'subscription': profile.get('subscription', {}),
                        'stats': profile.get('stats', {})
                    },
                    'token': jwt_token,
                    'is_new_user': False
                }
            else:
                # New user, create account
                profile_data = {
                    'email': google_user_info['email'],
                    'first_name': google_user_info['first_name'],
                    'last_name': google_user_info['last_name'],
                    'display_name': google_user_info['full_name'] or f"{google_user_info['first_name']} {google_user_info['last_name']}",
                    'picture': google_user_info.get('picture'),
                    'google_id': google_user_info['google_id'],
                    'auth_provider': 'google',
                    'email_verified': True,
                    'role': 'user',
                    'is_active': True,
                    'preferences': {
                        'default_tone': 'professional',
                        'default_writing_style': 'standard',
                        'default_content_length': 'medium',
                        'default_audience': 'general audience',
                        'default_industry': 'technology',
                        'preferred_cta_style': 'strong',
                        'default_urgency_level': 'medium',
                        'personalization_level': 'medium',
                        'default_geographic_region': 'global',
                        'content_generation_language': 'english',
                        'include_keywords_by_default': False,
                        'show_generation_tips': True,
                        'enable_advanced_parameters': True,
                        'theme': 'dark',
                        'language': google_user_info.get('locale', 'en'),
                        'timezone': 'UTC'
                    },
                    'subscription': {
                        'plan': 'free',
                        'status': 'active',
                        'started_at': None,
                        'expires_at': None,
                        'usage': {
                            'content_generated': 0,
                            'monthly_limit': 50,
                            'reset_date': None
                        }
                    },
                    'stats': {
                        'total_content_generated': 0,
                        'total_words_generated': 0,
                        'favorite_templates': [],
                        'last_login': None,
                        'login_count': 1
                    }
                }
                
                # Create user profile
                success = db_manager.create_user_profile(user_id, profile_data)
                
                if not success:
                    return {
                        'success': False,
                        'error': 'Failed to create user profile'
                    }
                
                # Generate JWT token
                jwt_token = auth_manager.create_jwt_token(user_id, google_user_info['email'])
                
                return {
                    'success': True,
                    'message': 'Account created successfully',
                    'user': {
                        'user_id': user_id,
                        'email': profile_data['email'],
                        'first_name': profile_data['first_name'],
                        'last_name': profile_data['last_name'],
                        'display_name': profile_data['display_name'],
                        'picture': profile_data.get('picture'),
                        'role': profile_data.get('role', 'user'),
                        'preferences': profile_data.get('preferences', {}),
                        'subscription': profile_data.get('subscription', {}),
                        'stats': profile_data.get('stats', {})
                    },
                    'token': jwt_token,
                    'is_new_user': True
                }
                
        except Exception as e:
            logger.error(f"Error authenticating Google user: {e}")
            return {
                'success': False,
                'error': 'Authentication failed. Please try again.'
            }

# Global instance
google_auth_handler = GoogleAuthHandler()
