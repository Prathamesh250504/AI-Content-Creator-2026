"""
Enhanced User Profile Management System
Handles user preferences, profiles, and personalization with MongoDB integration
"""

import json
import os
from datetime import datetime
from typing import Dict, List, Optional, Any
import logging

try:
    from .database import db_manager
except ImportError:
    # Fallback for direct execution
    from database import db_manager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class UserProfileManager:
    """Enhanced user profile manager with MongoDB Atlas integration"""
    
    def __init__(self):
        self.fallback_file = "backend/user_profiles.json"
        self.default_preferences = self.get_default_preferences()
    
    def get_default_preferences(self) -> Dict[str, Any]:
        """Get default user preferences"""
        return {
            # Personal Information
            "name": "",
            "email": "",
            "company": "",
            "role": "",
            
            # Content Preferences
            "default_tone": "professional",
            "default_writing_style": "formal",
            "default_industry": "technology",
            "default_audience": "professionals",
            "default_content_length": "medium",
            
            # Advanced Preferences
            "preferred_cta_style": "strong",
            "default_urgency_level": "medium",
            "personalization_level": "medium",
            "include_keywords_by_default": False,
            "default_geographic_region": "global",
            
            # UI Preferences
            "theme": "dark",
            "language": "en",
            "timezone": "UTC",
            "notifications_enabled": True,
            
            # Content Generation Settings
            "auto_save_content": True,
            "show_generation_tips": True,
            "enable_advanced_parameters": True,
            "default_template": "linkedin_post",
            
            # Privacy Settings
            "data_retention_days": 365,
            "analytics_enabled": True,
            "share_usage_data": False
        }
    
    def create_user_profile(self, user_id: str, profile_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Create a new user profile with default preferences"""
        try:
            # Merge with defaults
            preferences = self.default_preferences.copy()
            if profile_data:
                preferences.update(profile_data)
            
            profile = {
                "user_id": user_id,
                "preferences": preferences,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
                "version": "1.0"
            }
            
            # Try MongoDB first
            if db_manager.is_connected():
                success = db_manager.create_user_profile(user_id, profile)
                if success:
                    logger.info(f"Created user profile in MongoDB for {user_id}")
                    return profile
            
            # Fallback to local storage
            self._save_to_local_storage(user_id, profile)
            logger.info(f"Created user profile locally for {user_id}")
            return profile
            
        except Exception as e:
            logger.error(f"Error creating user profile: {e}")
            return self.get_default_profile(user_id)
    
    def get_user_profile(self, user_id: str) -> Dict[str, Any]:
        """Get user profile by ID"""
        try:
            # Try MongoDB first
            if db_manager.is_connected():
                profile_doc = db_manager.get_user_profile(user_id)
                if profile_doc:
                    return profile_doc.get('profile', self.get_default_profile(user_id))
            
            # Fallback to local storage
            profile = self._load_from_local_storage(user_id)
            if profile:
                return profile
            
            # Create new profile if not found
            return self.create_user_profile(user_id)
            
        except Exception as e:
            logger.error(f"Error getting user profile: {e}")
            return self.get_default_profile(user_id)
    
    def update_user_profile(self, user_id: str, updates: Dict[str, Any]) -> bool:
        """Update user profile with new data"""
        try:
            # Get current profile
            current_profile = self.get_user_profile(user_id)
            
            # Update preferences
            if 'preferences' in updates:
                current_profile['preferences'].update(updates['preferences'])
            
            # Update other fields
            for key, value in updates.items():
                if key != 'preferences':
                    current_profile[key] = value
            
            current_profile['updated_at'] = datetime.utcnow().isoformat()
            
            # Try MongoDB first
            if db_manager.is_connected():
                success = db_manager.update_user_profile(user_id, current_profile)
                if success:
                    logger.info(f"Updated user profile in MongoDB for {user_id}")
                    return True
            
            # Fallback to local storage
            self._save_to_local_storage(user_id, current_profile)
            logger.info(f"Updated user profile locally for {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating user profile: {e}")
            return False
    
    def get_user_preferences(self, user_id: str) -> Dict[str, Any]:
        """Get user preferences for content generation"""
        profile = self.get_user_profile(user_id)
        return profile.get('preferences', self.default_preferences)
    
    def update_user_preferences(self, user_id: str, preferences: Dict[str, Any]) -> bool:
        """Update user preferences"""
        return self.update_user_profile(user_id, {'preferences': preferences})
    
    def get_default_profile(self, user_id: str) -> Dict[str, Any]:
        """Get default profile structure"""
        return {
            "user_id": user_id,
            "preferences": self.default_preferences.copy(),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "version": "1.0"
        }
    
    def delete_user_profile(self, user_id: str) -> bool:
        """Delete user profile"""
        try:
            # Try MongoDB first
            if db_manager.is_connected():
                success = db_manager.delete_user_profile(user_id)
                if success:
                    logger.info(f"Deleted user profile from MongoDB for {user_id}")
                    return True
            
            # Fallback to local storage
            return self._delete_from_local_storage(user_id)
            
        except Exception as e:
            logger.error(f"Error deleting user profile: {e}")
            return False
    
    def get_all_users(self) -> List[str]:
        """Get list of all user IDs"""
        try:
            # Try MongoDB first
            if db_manager.is_connected():
                users = db_manager.users_collection.distinct("user_id")
                return users
            
            # Fallback to local storage
            return self._get_local_users()
            
        except Exception as e:
            logger.error(f"Error getting all users: {e}")
            return []
    
    def apply_preferences_to_parameters(self, user_id: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Apply user preferences to content generation parameters"""
        try:
            preferences = self.get_user_preferences(user_id)
            
            # Apply default values if not specified
            parameter_mappings = {
                'tone': 'default_tone',
                'writing_style': 'default_writing_style',
                'industry': 'default_industry',
                'target_audience': 'default_audience',
                'content_length': 'default_content_length',
                'cta_style': 'preferred_cta_style',
                'urgency_level': 'default_urgency_level',
                'personalization': 'personalization_level',
                'geographic_region': 'default_geographic_region'
            }
            
            enhanced_parameters = parameters.copy()
            
            for param_key, pref_key in parameter_mappings.items():
                if param_key not in enhanced_parameters or not enhanced_parameters[param_key]:
                    enhanced_parameters[param_key] = preferences.get(pref_key, "")
            
            # Apply keyword preferences
            if preferences.get('include_keywords_by_default', False) and not enhanced_parameters.get('keywords'):
                enhanced_parameters['keywords'] = ""
            
            return enhanced_parameters
            
        except Exception as e:
            logger.error(f"Error applying preferences: {e}")
            return parameters
    
    # Local storage fallback methods
    
    def _save_to_local_storage(self, user_id: str, profile: Dict[str, Any]) -> bool:
        """Save profile to local JSON file"""
        try:
            profiles = self._load_all_local_profiles()
            profiles[user_id] = profile
            
            os.makedirs(os.path.dirname(self.fallback_file), exist_ok=True)
            with open(self.fallback_file, 'w', encoding='utf-8') as f:
                json.dump(profiles, f, indent=2, ensure_ascii=False)
            
            return True
            
        except Exception as e:
            logger.error(f"Error saving to local storage: {e}")
            return False
    
    def _load_from_local_storage(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Load profile from local JSON file"""
        try:
            profiles = self._load_all_local_profiles()
            return profiles.get(user_id)
            
        except Exception as e:
            logger.error(f"Error loading from local storage: {e}")
            return None
    
    def _load_all_local_profiles(self) -> Dict[str, Any]:
        """Load all profiles from local JSON file"""
        try:
            if os.path.exists(self.fallback_file):
                with open(self.fallback_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            return {}
            
        except Exception as e:
            logger.error(f"Error loading local profiles: {e}")
            return {}
    
    def _delete_from_local_storage(self, user_id: str) -> bool:
        """Delete profile from local JSON file"""
        try:
            profiles = self._load_all_local_profiles()
            if user_id in profiles:
                del profiles[user_id]
                
                with open(self.fallback_file, 'w', encoding='utf-8') as f:
                    json.dump(profiles, f, indent=2, ensure_ascii=False)
                
                logger.info(f"Deleted user profile locally for {user_id}")
                return True
            return False
            
        except Exception as e:
            logger.error(f"Error deleting from local storage: {e}")
            return False
    
    def _get_local_users(self) -> List[str]:
        """Get all user IDs from local storage"""
        try:
            profiles = self._load_all_local_profiles()
            return list(profiles.keys())
            
        except Exception as e:
            logger.error(f"Error getting local users: {e}")
            return []

# Global profile manager instance
profile_manager = UserProfileManager()