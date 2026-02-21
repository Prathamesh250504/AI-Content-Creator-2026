"""
MongoDB Atlas Database Manager
Handles all database operations for user profiles and preferences
"""

import os
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, OperationFailure
from bson import ObjectId
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseManager:
    """MongoDB Atlas database manager for user profiles and content history"""
    
    def __init__(self):
        self.client = None
        self.db = None
        self.users_collection = None
        self.content_history_collection = None
        self.batch_jobs_collection = None
        self.batch_items_collection = None
        self.prompt_templates_collection = None
        self.ab_tests_collection = None
        self.ab_test_results_collection = None
        self.connect()
    
    def connect(self):
        """Connect to MongoDB Atlas"""
        try:
            mongodb_uri = os.getenv('MONGODB_URI')
            database_name = os.getenv('MONGODB_DATABASE', 'ai_content_creator')
            
            if not mongodb_uri:
                logger.warning("MongoDB URI not found. Using fallback local storage.")
                return False
            
            # Replace placeholder credentials with actual ones
            if 'username:password' in mongodb_uri:
                logger.warning("Please update MONGODB_URI with your actual credentials")
                return False
            
            # Add database name to URI if not present
            if not mongodb_uri.endswith('/'):
                mongodb_uri += '/'
            if '?' not in mongodb_uri:
                mongodb_uri += database_name + '?retryWrites=true&w=majority'
            
            self.client = MongoClient(mongodb_uri, serverSelectionTimeoutMS=5000)
            
            # Test connection
            self.client.admin.command('ping')
            logger.info("Successfully connected to MongoDB Atlas")
            
            # Get database and collections
            self.db = self.client[database_name]
            self.users_collection = self.db.users
            self.content_history_collection = self.db.content_history
            self.batch_jobs_collection = self.db.batch_jobs
            self.batch_items_collection = self.db.batch_items
            self.prompt_templates_collection = self.db.prompt_templates
            self.ab_tests_collection = self.db.ab_tests
            self.ab_test_results_collection = self.db.ab_test_results
            
            # Create indexes for better performance
            try:
                self.users_collection.create_index("user_id", unique=True)
                self.content_history_collection.create_index("user_id")
                self.content_history_collection.create_index("created_at")
                
                # Batch processing indexes
                self.batch_jobs_collection.create_index("user_id")
                self.batch_jobs_collection.create_index("job_id", unique=True)
                self.batch_jobs_collection.create_index("created_at")
                self.batch_jobs_collection.create_index("status")
                
                self.batch_items_collection.create_index("job_id")
                self.batch_items_collection.create_index("user_id")
                self.batch_items_collection.create_index("status")
                
                # Prompt templates indexes
                self.prompt_templates_collection.create_index("user_id")
                self.prompt_templates_collection.create_index("id", unique=True)
                self.prompt_templates_collection.create_index("category")
                self.prompt_templates_collection.create_index("is_public")
                
                # A/B test indexes
                self.ab_tests_collection.create_index("user_id")
                self.ab_tests_collection.create_index("id", unique=True)
                self.ab_tests_collection.create_index("status")
                self.ab_tests_collection.create_index("created_at")
                
                # A/B test results indexes
                self.ab_test_results_collection.create_index("ab_test_id")
                self.ab_test_results_collection.create_index("user_id")
                self.ab_test_results_collection.create_index("created_at")
                self.prompt_templates_collection.create_index("created_at")
                
                logger.info("Database indexes created successfully")
            except Exception as index_error:
                logger.warning(f"Index creation warning: {index_error}")
            
            return True
            
        except ConnectionFailure as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            return False
        except Exception as e:
            logger.error(f"Database connection error: {e}")
            return False
    
    def is_connected(self) -> bool:
        """Check if database is connected"""
        return self.client is not None and self.db is not None
    
    # User Profile Operations
    
    def create_user_profile(self, user_id: str, profile_data: Dict[str, Any]) -> bool:
        """Create a new user profile"""
        try:
            if not self.is_connected():
                return False
            
            user_doc = {
                "user_id": user_id,
                "profile": profile_data,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            result = self.users_collection.insert_one(user_doc)
            logger.info(f"Created user profile for {user_id}")
            return result.inserted_id is not None
            
        except Exception as e:
            logger.error(f"Error creating user profile: {e}")
            return False
    
    def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user profile by user_id"""
        try:
            if not self.is_connected():
                return None
            
            user_doc = self.users_collection.find_one({"user_id": user_id})
            if user_doc:
                # Convert ObjectId to string for JSON serialization
                user_doc['_id'] = str(user_doc['_id'])
                return user_doc
            return None
            
        except Exception as e:
            logger.error(f"Error getting user profile: {e}")
            return None
    
    def update_user_profile(self, user_id: str, profile_data: Dict[str, Any]) -> bool:
        """Update user profile"""
        try:
            if not self.is_connected():
                return False
            
            update_doc = {
                "$set": {
                    "profile": profile_data,
                    "updated_at": datetime.utcnow()
                }
            }
            
            result = self.users_collection.update_one(
                {"user_id": user_id}, 
                update_doc,
                upsert=True
            )
            
            logger.info(f"Updated user profile for {user_id}")
            return result.modified_count > 0 or result.upserted_id is not None
            
        except Exception as e:
            logger.error(f"Error updating user profile: {e}")
            return False
    
    def delete_user_profile(self, user_id: str) -> bool:
        """Delete user profile"""
        try:
            if not self.is_connected():
                return False
            
            result = self.users_collection.delete_one({"user_id": user_id})
            logger.info(f"Deleted user profile for {user_id}")
            return result.deleted_count > 0
            
        except Exception as e:
            logger.error(f"Error deleting user profile: {e}")
            return False
    
    # Content History Operations
    
    def save_content_history(self, user_id: str, content_data: Dict[str, Any]) -> bool:
        """Save content generation history"""
        try:
            if not self.is_connected():
                return False
            
            content_doc = {
                "user_id": user_id,
                "content": content_data,
                "created_at": datetime.utcnow()
            }
            
            result = self.content_history_collection.insert_one(content_doc)
            logger.info(f"Saved content history for {user_id}")
            return result.inserted_id is not None
            
        except Exception as e:
            logger.error(f"Error saving content history: {e}")
            return False
    
    def get_content_history(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get content history for user"""
        try:
            if not self.is_connected():
                return []
            
            cursor = self.content_history_collection.find(
                {"user_id": user_id}
            ).sort("created_at", -1).limit(limit)
            
            history = []
            for doc in cursor:
                doc['_id'] = str(doc['_id'])
                history.append(doc)
            
            return history
            
        except Exception as e:
            logger.error(f"Error getting content history: {e}")
            return []
    
    def delete_content_history(self, user_id: str, content_id: str) -> bool:
        """Delete specific content from history"""
        try:
            if not self.is_connected():
                return False
            
            result = self.content_history_collection.delete_one({
                "user_id": user_id,
                "_id": ObjectId(content_id)
            })
            
            return result.deleted_count > 0
            
        except Exception as e:
            logger.error(f"Error deleting content history: {e}")
            return False
    
    def clear_content_history(self, user_id: str) -> bool:
        """Clear all content history for user"""
        try:
            if not self.is_connected():
                return False
            
            result = self.content_history_collection.delete_many({"user_id": user_id})
            logger.info(f"Cleared content history for {user_id}")
            return result.deleted_count > 0
            
        except Exception as e:
            logger.error(f"Error clearing content history: {e}")
            return False
    
    # Analytics Operations
    
    def get_user_analytics(self, user_id: str) -> Dict[str, Any]:
        """Get analytics data for user"""
        try:
            if not self.is_connected():
                return {}
            
            # Get total content count
            total_content = self.content_history_collection.count_documents({"user_id": user_id})
            
            # Get content by type
            pipeline = [
                {"$match": {"user_id": user_id}},
                {"$group": {
                    "_id": "$content.content_type",
                    "count": {"$sum": 1}
                }}
            ]
            
            content_types = list(self.content_history_collection.aggregate(pipeline))
            
            # Get recent activity (last 30 days)
            from datetime import timedelta
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            
            recent_content = self.content_history_collection.count_documents({
                "user_id": user_id,
                "created_at": {"$gte": thirty_days_ago}
            })
            
            return {
                "total_content": total_content,
                "content_by_type": {item["_id"]: item["count"] for item in content_types},
                "recent_activity": recent_content
            }
            
        except Exception as e:
            logger.error(f"Error getting user analytics: {e}")
            return {}
    
    # ============================================================================
    # BATCH PROCESSING METHODS
    # ============================================================================
    
    def create_batch_job(self, job_data: Dict[str, Any]) -> bool:
        """Create a new batch job in MongoDB"""
        try:
            if self.batch_jobs_collection is None:
                logger.warning("Database not connected. Cannot create batch job.")
                return False
            
            print(f"Creating batch job with data: {job_data.get('job_id', 'unknown')}")
            
            # Add MongoDB-specific fields
            job_data['_id'] = ObjectId()
            job_data['created_at'] = datetime.utcnow()
            job_data['updated_at'] = datetime.utcnow()
            
            result = self.batch_jobs_collection.insert_one(job_data)
            success = result.inserted_id is not None
            
            logger.info(f"Created batch job {job_data['job_id']} for user {job_data['user_id']}: {success}")
            print(f"Batch job creation result: {success}, inserted_id: {result.inserted_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"Error creating batch job: {e}")
            print(f"Exception in create_batch_job: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def get_batch_job(self, job_id: str, user_id: str = None) -> Optional[Dict[str, Any]]:
        """Get a batch job by ID"""
        try:
            if self.batch_jobs_collection is None:
                return None
            
            query = {"job_id": job_id}
            if user_id:
                query["user_id"] = user_id
            
            job_doc = self.batch_jobs_collection.find_one(query)
            if job_doc:
                # Convert ObjectId to string
                job_doc['_id'] = str(job_doc['_id'])
                return job_doc
            return None
            
        except Exception as e:
            logger.error(f"Error getting batch job: {e}")
            return None
    
    def update_batch_job(self, job_id: str, update_data: Dict[str, Any], user_id: str = None) -> bool:
        """Update a batch job"""
        try:
            if self.batch_jobs_collection is None:
                return False
            
            query = {"job_id": job_id}
            if user_id:
                query["user_id"] = user_id
            
            update_data['updated_at'] = datetime.utcnow()
            
            result = self.batch_jobs_collection.update_one(
                query,
                {"$set": update_data}
            )
            
            return result.modified_count > 0
            
        except Exception as e:
            logger.error(f"Error updating batch job: {e}")
            return False
    
    def get_user_batch_jobs(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get all batch jobs for a user"""
        try:
            if self.batch_jobs_collection is None:
                return []
            
            cursor = self.batch_jobs_collection.find(
                {"user_id": user_id}
            ).sort("created_at", -1).limit(limit)
            
            jobs = []
            for job_doc in cursor:
                job_doc['_id'] = str(job_doc['_id'])
                jobs.append(job_doc)
            
            return jobs
            
        except Exception as e:
            logger.error(f"Error getting user batch jobs: {e}")
            return []
    
    def delete_batch_job(self, job_id: str, user_id: str = None) -> bool:
        """Delete a batch job and its items"""
        try:
            if self.batch_jobs_collection is None or self.batch_items_collection is None:
                return False
            
            query = {"job_id": job_id}
            if user_id:
                query["user_id"] = user_id
            
            # Delete job items first
            self.batch_items_collection.delete_many({"job_id": job_id})
            
            # Delete job
            result = self.batch_jobs_collection.delete_one(query)
            
            logger.info(f"Deleted batch job {job_id}")
            return result.deleted_count > 0
            
        except Exception as e:
            logger.error(f"Error deleting batch job: {e}")
            return False
    
    def create_batch_items(self, items_data: List[Dict[str, Any]]) -> bool:
        """Create multiple batch items"""
        try:
            if self.batch_items_collection is None or not items_data:
                logger.warning("Database not connected or no items data provided")
                return False
            
            print(f"Creating {len(items_data)} batch items")
            
            # Add MongoDB-specific fields to each item
            for item in items_data:
                item['_id'] = ObjectId()
                item['created_at'] = datetime.utcnow()
                item['updated_at'] = datetime.utcnow()
            
            result = self.batch_items_collection.insert_many(items_data)
            success = len(result.inserted_ids) == len(items_data)
            
            logger.info(f"Created {len(items_data)} batch items: {success}")
            print(f"Batch items creation result: {success}, inserted count: {len(result.inserted_ids)}")
            
            return success
            
        except Exception as e:
            logger.error(f"Error creating batch items: {e}")
            print(f"Exception in create_batch_items: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def get_batch_items(self, job_id: str) -> List[Dict[str, Any]]:
        """Get all items for a batch job"""
        try:
            if self.batch_items_collection is None:
                return []
            
            cursor = self.batch_items_collection.find(
                {"job_id": job_id}
            ).sort("created_at", 1)
            
            items = []
            for item_doc in cursor:
                item_doc['_id'] = str(item_doc['_id'])
                items.append(item_doc)
            
            return items
            
        except Exception as e:
            logger.error(f"Error getting batch items: {e}")
            return []
    
    def update_batch_item(self, item_id: str, update_data: Dict[str, Any]) -> bool:
        """Update a batch item"""
        try:
            if self.batch_items_collection is None:
                return False
            
            update_data['updated_at'] = datetime.utcnow()
            
            result = self.batch_items_collection.update_one(
                {"item_id": item_id},
                {"$set": update_data}
            )
            
            return result.modified_count > 0
            
        except Exception as e:
            logger.error(f"Error updating batch item: {e}")
            return False
    
    def cleanup_old_batch_jobs(self, max_age_hours: int = 24) -> int:
        """Clean up old completed batch jobs"""
        try:
            if self.batch_jobs_collection is None or self.batch_items_collection is None:
                return 0
            
            cutoff_time = datetime.utcnow() - timedelta(hours=max_age_hours)
            
            # Find old completed jobs
            old_jobs = self.batch_jobs_collection.find({
                "status": {"$in": ["completed", "failed", "cancelled"]},
                "created_at": {"$lt": cutoff_time}
            })
            
            deleted_count = 0
            for job in old_jobs:
                job_id = job['job_id']
                
                # Delete items first
                self.batch_items_collection.delete_many({"job_id": job_id})
                
                # Delete job
                result = self.batch_jobs_collection.delete_one({"job_id": job_id})
                if result.deleted_count > 0:
                    deleted_count += 1
            
            if deleted_count > 0:
                logger.info(f"Cleaned up {deleted_count} old batch jobs")
            
            return deleted_count
            
        except Exception as e:
            logger.error(f"Error cleaning up old batch jobs: {e}")
            return 0
    
    def close_connection(self):
        """Close database connection"""
        if self.client:
            self.client.close()
            logger.info("Database connection closed")

# Global database instance
db_manager = DatabaseManager()