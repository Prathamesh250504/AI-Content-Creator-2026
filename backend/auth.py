"""
Authentication Module
Handles user registration, login, and session management
"""

import os
import hashlib
import secrets
import jwt
from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple
import logging
from database import db_manager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AuthManager:
    """Handles user authentication and session management"""
    
    def __init__(self):
        self.secret_key = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
        self.token_expiry_hours = 24 * 7  # 7 days
    
    def hash_password(self, password: str, salt: str = None) -> Tuple[str, str]:
        """Hash password with salt"""
        if salt is None:
            salt = secrets.token_hex(32)
        
        # Create hash using password + salt
        password_hash = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt.encode('utf-8'),
            100000  # iterations
        )
        
        return password_hash.hex(), salt
    
    def verify_password(self, password: str, password_hash: str, salt: str) -> bool:
        """Verify password against hash"""
        try:
            computed_hash, _ = self.hash_password(password, salt)
            return computed_hash == password_hash
        except Exception as e:
            logger.error(f"Error verifying password: {e}")
            return False
    
    def generate_user_id(self, email: str) -> str:
        """Generate unique user ID from email"""
        return hashlib.md5(email.lower().encode()).hexdigest()
    
    def create_jwt_token(self, user_id: str, email: str) -> str:
        """Create JWT token for user"""
        try:
            payload = {
                'user_id': user_id,
                'email': email,
                'exp': datetime.utcnow() + timedelta(hours=self.token_expiry_hours),
                'iat': datetime.utcnow()
            }
            
            token = jwt.encode(payload, self.secret_key, algorithm='HS256')
            return token
        except Exception as e:
            logger.error(f"Error creating JWT token: {e}")
            return None
    
    def verify_jwt_token(self, token: str) -> Optional[Dict]:
        """Verify JWT token and return payload"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=['HS256'])
            return payload
        except jwt.ExpiredSignatureError:
            logger.warning("JWT token has expired")
            return None
        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid JWT token: {e}")
            return None
    
    def register_user(self, email: str, password: str, first_name: str, last_name: str) -> Dict:
        """Register a new user"""
        try:
            # Validate input
            if not email or not password or not first_name or not last_name:
                return {
                    'success': False,
                    'error': 'All fields are required'
                }
            
            # Check if user already exists
            user_id = self.generate_user_id(email)
            existing_user = db_manager.get_user_profile(user_id)
            
            if existing_user:
                return {
                    'success': False,
                    'error': 'User already exists with this email'
                }
            
            # Hash password
            password_hash, salt = self.hash_password(password)
            
            # Create user profile
            profile_data = {
                'email': email.lower(),
                'first_name': first_name,
                'last_name': last_name,
                'display_name': f"{first_name} {last_name}",
                'password_hash': password_hash,
                'salt': salt,
                'role': 'user',
                'is_active': True,
                'email_verified': False,
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
                    'language': 'en',
                    'timezone': 'UTC'
                },
                'subscription': {
                    'plan': 'free',
                    'status': 'active',
                    'started_at': datetime.utcnow(),
                    'expires_at': None,
                    'usage': {
                        'content_generated': 0,
                        'monthly_limit': 50,
                        'reset_date': datetime.utcnow().replace(day=1)
                    }
                },
                'stats': {
                    'total_content_generated': 0,
                    'total_words_generated': 0,
                    'favorite_templates': [],
                    'last_login': None,
                    'login_count': 0
                }
            }
            
            # Save to database
            success = db_manager.create_user_profile(user_id, profile_data)
            
            if success:
                # Generate JWT token
                token = self.create_jwt_token(user_id, email)
                
                return {
                    'success': True,
                    'message': 'User registered successfully',
                    'user': {
                        'user_id': user_id,
                        'email': email,
                        'first_name': first_name,
                        'last_name': last_name,
                        'display_name': profile_data['display_name']
                    },
                    'token': token
                }
            else:
                return {
                    'success': False,
                    'error': 'Failed to create user profile'
                }
                
        except Exception as e:
            logger.error(f"Error registering user: {e}")
            return {
                'success': False,
                'error': 'Registration failed. Please try again.'
            }
    
    def login_user(self, email: str, password: str) -> Dict:
        """Login user with email and password"""
        try:
            # Validate input
            if not email or not password:
                return {
                    'success': False,
                    'error': 'Email and password are required'
                }
            
            # Get user profile
            user_id = self.generate_user_id(email)
            user_doc = db_manager.get_user_profile(user_id)
            
            if not user_doc:
                return {
                    'success': False,
                    'error': 'Invalid email or password'
                }
            
            profile = user_doc['profile']
            
            # Check if user is active
            if not profile.get('is_active', True):
                return {
                    'success': False,
                    'error': 'Account is deactivated'
                }
            
            # Verify password
            password_hash = profile.get('password_hash')
            salt = profile.get('salt')
            
            if not password_hash or not salt:
                return {
                    'success': False,
                    'error': 'Invalid account data'
                }
            
            if not self.verify_password(password, password_hash, salt):
                return {
                    'success': False,
                    'error': 'Invalid email or password'
                }
            
            # Update login stats
            profile['stats']['last_login'] = datetime.utcnow()
            profile['stats']['login_count'] = profile['stats'].get('login_count', 0) + 1
            
            # Save updated profile
            db_manager.update_user_profile(user_id, profile)
            
            # Generate JWT token
            token = self.create_jwt_token(user_id, email)
            
            return {
                'success': True,
                'message': 'Login successful',
                'user': {
                    'user_id': user_id,
                    'email': profile['email'],
                    'first_name': profile['first_name'],
                    'last_name': profile['last_name'],
                    'display_name': profile['display_name'],
                    'role': profile.get('role', 'user'),
                    'preferences': profile.get('preferences', {}),
                    'subscription': profile.get('subscription', {}),
                    'stats': profile.get('stats', {})
                },
                'token': token
            }
            
        except Exception as e:
            logger.error(f"Error logging in user: {e}")
            return {
                'success': False,
                'error': 'Login failed. Please try again.'
            }
    
    def get_user_from_token(self, token: str) -> Optional[Dict]:
        """Get user information from JWT token"""
        try:
            payload = self.verify_jwt_token(token)
            if not payload:
                return None
            
            user_id = payload.get('user_id')
            if not user_id:
                return None
            
            user_doc = db_manager.get_user_profile(user_id)
            if not user_doc:
                return None
            
            profile = user_doc['profile']
            
            return {
                'user_id': user_id,
                'email': profile['email'],
                'first_name': profile['first_name'],
                'last_name': profile['last_name'],
                'display_name': profile['display_name'],
                'role': profile.get('role', 'user'),
                'preferences': profile.get('preferences', {}),
                'subscription': profile.get('subscription', {}),
                'stats': profile.get('stats', {})
            }
            
        except Exception as e:
            logger.error(f"Error getting user from token: {e}")
            return None
    
    def update_user_preferences(self, user_id: str, preferences: Dict) -> bool:
        """Update user preferences"""
        try:
            user_doc = db_manager.get_user_profile(user_id)
            if not user_doc:
                return False
            
            profile = user_doc['profile']
            profile['preferences'].update(preferences)
            
            return db_manager.update_user_profile(user_id, profile)
            
        except Exception as e:
            logger.error(f"Error updating user preferences: {e}")
            return False
    
    def update_user_stats(self, user_id: str, stats_update: Dict) -> bool:
        """Update user statistics"""
        try:
            user_doc = db_manager.get_user_profile(user_id)
            if not user_doc:
                return False
            
            profile = user_doc['profile']
            
            # Update stats
            for key, value in stats_update.items():
                if key in ['total_content_generated', 'total_words_generated']:
                    profile['stats'][key] = profile['stats'].get(key, 0) + value
                else:
                    profile['stats'][key] = value
            
            # Update subscription usage
            if 'content_generated' in stats_update:
                profile['subscription']['usage']['content_generated'] += stats_update['content_generated']
            
            return db_manager.update_user_profile(user_id, profile)
            
        except Exception as e:
            logger.error(f"Error updating user stats: {e}")
            return False
    
    def check_usage_limits(self, user_id: str) -> Dict:
        """Check if user has exceeded usage limits"""
        try:
            user_doc = db_manager.get_user_profile(user_id)
            if not user_doc:
                return {'allowed': False, 'reason': 'User not found'}
            
            profile = user_doc['profile']
            subscription = profile.get('subscription', {})
            usage = subscription.get('usage', {})
            
            # Check monthly limit for free users
            if subscription.get('plan') == 'free':
                monthly_limit = usage.get('monthly_limit', 50)
                current_usage = usage.get('content_generated', 0)
                
                if current_usage >= monthly_limit:
                    return {
                        'allowed': False,
                        'reason': 'Monthly limit exceeded',
                        'current_usage': current_usage,
                        'limit': monthly_limit
                    }
            
            return {
                'allowed': True,
                'current_usage': usage.get('content_generated', 0),
                'limit': usage.get('monthly_limit', 50)
            }
            
        except Exception as e:
            logger.error(f"Error checking usage limits: {e}")
            return {'allowed': False, 'reason': 'Error checking limits'}

# Global auth manager instance
auth_manager = AuthManager()