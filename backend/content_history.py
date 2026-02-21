"""
Content History and Version Management System
Stores generated content with timestamps, parameters, and provides search/filter capabilities
Uses MongoDB Atlas for persistent storage
"""

import json
import os
from typing import Dict, List, Optional, Any
from datetime import datetime
import csv
from io import StringIO
from database import db_manager

class ContentHistoryEntry:
    """Represents a single content generation entry"""
    
    def __init__(self, content_id: str = None):
        self.content_id = content_id or self._generate_id()
        self.timestamp = datetime.now().isoformat()
        self.user_id = "default_user"
        self.content = ""
        self.content_type = ""
        self.template_key = ""
        self.parameters = {}
        self.word_count = 0
        self.char_count = 0
        self.validation_status = "valid"
        self.validation_messages = []
        self.model_used = ""
        self.tags = []
        self.favorite = False
        self.version = 1
        self.parent_id = None  # For tracking variations
    
    def _generate_id(self) -> str:
        """Generate unique content ID"""
        import uuid
        return f"content_{uuid.uuid4().hex[:12]}"
    
    def to_dict(self) -> Dict:
        """Convert entry to dictionary"""
        return {
            'content_id': self.content_id,
            'timestamp': self.timestamp,
            'user_id': self.user_id,
            'content': self.content,
            'content_type': self.content_type,
            'template_key': self.template_key,
            'parameters': self.parameters,
            'word_count': self.word_count,
            'char_count': self.char_count,
            'validation_status': self.validation_status,
            'validation_messages': self.validation_messages,
            'model_used': self.model_used,
            'tags': self.tags,
            'favorite': self.favorite,
            'version': self.version,
            'parent_id': self.parent_id
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'ContentHistoryEntry':
        """Create entry from dictionary"""
        entry = cls(data.get('content_id'))
        entry.timestamp = data.get('timestamp', datetime.now().isoformat())
        entry.user_id = data.get('user_id', 'default_user')
        entry.content = data.get('content', '')
        entry.content_type = data.get('content_type', '')
        entry.template_key = data.get('template_key', '')
        entry.parameters = data.get('parameters', {})
        entry.word_count = data.get('word_count', 0)
        entry.char_count = data.get('char_count', 0)
        entry.validation_status = data.get('validation_status', 'valid')
        entry.validation_messages = data.get('validation_messages', [])
        entry.model_used = data.get('model_used', '')
        entry.tags = data.get('tags', [])
        entry.favorite = data.get('favorite', False)
        entry.version = data.get('version', 1)
        entry.parent_id = data.get('parent_id')
        return entry

class ContentHistoryManager:
    """Manages content history with MongoDB persistence and search capabilities"""
    
    def __init__(self, storage_path: str = None):
        """
        Initialize history manager
        
        Args:
            storage_path: Path to JSON file for fallback storage (legacy support)
        """
        if storage_path is None:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            storage_path = os.path.join(current_dir, 'content_history.json')
        
        self.storage_path = storage_path
        self.history: Dict[str, ContentHistoryEntry] = {}
        
        # Try to use MongoDB first, fallback to local storage if needed
        if not db_manager.is_connected():
            print("MongoDB not connected, using local storage fallback")
            self._ensure_storage_file()
            self.load_history()
    
    def _ensure_storage_file(self):
        """Ensure storage file exists (fallback only)"""
        if not os.path.exists(self.storage_path):
            os.makedirs(os.path.dirname(self.storage_path), exist_ok=True)
            with open(self.storage_path, 'w') as f:
                json.dump({}, f)
    
    def load_history(self):
        """Load all history from storage (fallback only)"""
        try:
            if os.path.exists(self.storage_path):
                with open(self.storage_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.history = {
                        content_id: ContentHistoryEntry.from_dict(entry_data)
                        for content_id, entry_data in data.items()
                    }
            else:
                self.history = {}
        except (json.JSONDecodeError, IOError) as e:
            print(f"Error loading history: {e}")
            self.history = {}
    
    def save_history(self):
        """Save all history to storage (fallback only)"""
        try:
            data = {
                content_id: entry.to_dict()
                for content_id, entry in self.history.items()
            }
            with open(self.storage_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            return True
        except IOError as e:
            print(f"Error saving history: {e}")
            return False
    
    def add_entry(self, content: str, content_type: str, template_key: str,
                  parameters: Dict, user_id: str = "default_user",
                  validation_result: Dict = None, model_used: str = "",
                  parent_id: str = None) -> ContentHistoryEntry:
        """
        Add a new content entry to history
        
        Args:
            content: Generated content
            content_type: Type of content
            template_key: Template used
            parameters: Generation parameters
            user_id: User identifier
            validation_result: Validation results
            model_used: AI model used
            parent_id: Parent content ID for variations
            
        Returns:
            Created ContentHistoryEntry
        """
        entry = ContentHistoryEntry()
        entry.user_id = user_id
        entry.content = content
        entry.content_type = content_type
        entry.template_key = template_key
        entry.parameters = parameters
        entry.word_count = len(content.split())
        entry.char_count = len(content)
        entry.model_used = model_used
        entry.parent_id = parent_id
        
        if validation_result:
            entry.validation_status = "valid" if validation_result.get('is_valid', True) else "warning"
            entry.validation_messages = validation_result.get('messages', [])
        
        # Set version number if this is a variation
        if parent_id:
            if db_manager.is_connected():
                # Get parent from MongoDB
                parent_entries = db_manager.get_content_history(user_id, limit=1000)
                parent_entry = next((e for e in parent_entries if e.get('content', {}).get('content_id') == parent_id), None)
                if parent_entry:
                    entry.version = parent_entry.get('content', {}).get('version', 1) + 1
            elif parent_id in self.history:
                parent = self.history[parent_id]
                entry.version = parent.version + 1
        
        # Save to MongoDB or local storage
        if db_manager.is_connected():
            content_data = entry.to_dict()
            success = db_manager.save_content_history(user_id, content_data)
            if not success:
                print(f"Failed to save content history to MongoDB for user {user_id}")
        else:
            # Fallback to local storage
            self.history[entry.content_id] = entry
            self.save_history()
        
        return entry
    
    def get_entry(self, content_id: str, user_id: str = None) -> Optional[ContentHistoryEntry]:
        """Get a specific entry by ID"""
        if db_manager.is_connected() and user_id:
            # Get from MongoDB
            entries = db_manager.get_content_history(user_id, limit=1000)
            for entry_doc in entries:
                content_data = entry_doc.get('content', {})
                if content_data.get('content_id') == content_id:
                    return ContentHistoryEntry.from_dict(content_data)
            return None
        else:
            # Fallback to local storage
            return self.history.get(content_id)
    
    def get_all_entries(self, user_id: str = None) -> List[ContentHistoryEntry]:
        """Get all entries, optionally filtered by user"""
        if db_manager.is_connected() and user_id:
            # Get from MongoDB
            entries = []
            entry_docs = db_manager.get_content_history(user_id, limit=1000)
            for entry_doc in entry_docs:
                content_data = entry_doc.get('content', {})
                if content_data:
                    entries.append(ContentHistoryEntry.from_dict(content_data))
            
            # Sort by timestamp (newest first)
            entries.sort(key=lambda x: x.timestamp, reverse=True)
            return entries
        else:
            # Fallback to local storage
            entries = list(self.history.values())
            if user_id:
                entries = [e for e in entries if e.user_id == user_id]
            # Sort by timestamp (newest first)
            entries.sort(key=lambda x: x.timestamp, reverse=True)
            return entries
    
    def search_entries(self, query: str, user_id: str = None) -> List[ContentHistoryEntry]:
        """
        Search entries by content or parameters
        
        Args:
            query: Search query
            user_id: Optional user filter
            
        Returns:
            List of matching entries
        """
        query_lower = query.lower()
        entries = self.get_all_entries(user_id)
        
        results = []
        for entry in entries:
            # Search in content
            if query_lower in entry.content.lower():
                results.append(entry)
                continue
            
            # Search in content type
            if query_lower in entry.content_type.lower():
                results.append(entry)
                continue
            
            # Search in parameters
            params_str = json.dumps(entry.parameters).lower()
            if query_lower in params_str:
                results.append(entry)
                continue
            
            # Search in tags
            if any(query_lower in tag.lower() for tag in entry.tags):
                results.append(entry)
                continue
        
        return results
    
    def filter_entries(self, user_id: str = None, content_type: str = None,
                      start_date: str = None, end_date: str = None,
                      favorite_only: bool = False, tags: List[str] = None) -> List[ContentHistoryEntry]:
        """
        Filter entries by various criteria
        
        Args:
            user_id: Filter by user
            content_type: Filter by content type
            start_date: Filter by start date (ISO format)
            end_date: Filter by end date (ISO format)
            favorite_only: Show only favorites
            tags: Filter by tags
            
        Returns:
            List of filtered entries
        """
        entries = self.get_all_entries(user_id)
        
        # Apply content type filter
        if content_type:
            entries = [e for e in entries if e.content_type == content_type or e.template_key == content_type]
        
        # Apply date filters
        if start_date:
            entries = [e for e in entries if e.timestamp >= start_date]
        
        if end_date:
            entries = [e for e in entries if e.timestamp <= end_date]
        
        # Apply favorite filter
        if favorite_only:
            entries = [e for e in entries if e.favorite]
        
        # Apply tags filter
        if tags:
            entries = [e for e in entries if any(tag in e.tags for tag in tags)]
        
        return entries
    
    def update_entry(self, content_id: str, user_id: str = None, **kwargs) -> bool:
        """Update entry fields"""
        if db_manager.is_connected() and user_id:
            # For MongoDB, we need to get the entry, update it, and save it back
            entry = self.get_entry(content_id, user_id)
            if not entry:
                return False
            
            if 'favorite' in kwargs:
                entry.favorite = kwargs['favorite']
            if 'tags' in kwargs:
                entry.tags = kwargs['tags']
            if 'content' in kwargs:
                entry.content = kwargs['content']
                entry.word_count = len(entry.content.split())
                entry.char_count = len(entry.content)
            
            # Save updated entry back to MongoDB
            content_data = entry.to_dict()
            return db_manager.save_content_history(user_id, content_data)
        else:
            # Fallback to local storage
            entry = self.get_entry(content_id)
            if not entry:
                return False
            
            if 'favorite' in kwargs:
                entry.favorite = kwargs['favorite']
            if 'tags' in kwargs:
                entry.tags = kwargs['tags']
            if 'content' in kwargs:
                entry.content = kwargs['content']
                entry.word_count = len(entry.content.split())
                entry.char_count = len(entry.content)
            
            return self.save_history()
    
    def delete_entry(self, content_id: str, user_id: str = None) -> bool:
        """Delete an entry"""
        if db_manager.is_connected() and user_id:
            try:
                # Delete from MongoDB - content_id is nested under 'content' field
                result = db_manager.content_history_collection.delete_one({
                    "user_id": user_id,
                    "content.content_id": content_id
                })
                print(f"MongoDB delete result: deleted_count = {result.deleted_count}")
                return result.deleted_count > 0
            except Exception as e:
                print(f"Error deleting entry from MongoDB: {e}")
                return False
        else:
            # Fallback to local storage
            if content_id in self.history:
                del self.history[content_id]
                return self.save_history()
            return False
    
    def clear_history(self, user_id: str = None) -> bool:
        """Clear all history or for specific user"""
        if db_manager.is_connected() and user_id:
            return db_manager.clear_content_history(user_id)
        else:
            # Fallback to local storage
            if user_id:
                self.history = {
                    cid: entry for cid, entry in self.history.items()
                    if entry.user_id != user_id
                }
            else:
                self.history = {}
            
            return self.save_history()
    
    def get_statistics(self, user_id: str = None) -> Dict:
        """Get statistics about content history"""
        entries = self.get_all_entries(user_id)
        
        if not entries:
            return {
                'total_entries': 0,
                'total_words': 0,
                'total_chars': 0,
                'content_types': {},
                'favorites_count': 0,
                'recent_entries': []
            }
        
        content_types = {}
        for entry in entries:
            ct = entry.content_type or entry.template_key
            content_types[ct] = content_types.get(ct, 0) + 1
        
        # Convert recent entries to dictionaries for JSON serialization
        recent_entries = []
        for entry in entries[:5]:  # Last 5 entries
            recent_entries.append({
                'content_id': entry.content_id,
                'timestamp': entry.timestamp,
                'content_type': entry.content_type,
                'template_key': entry.template_key,
                'word_count': entry.word_count,
                'content_preview': entry.content[:100] + '...' if len(entry.content) > 100 else entry.content
            })
        
        return {
            'total_entries': len(entries),
            'total_words': sum(e.word_count for e in entries),
            'total_chars': sum(e.char_count for e in entries),
            'content_types': content_types,
            'favorites_count': sum(1 for e in entries if e.favorite),
            'recent_entries': recent_entries
        }
    
    def export_to_csv(self, user_id: str = None, entries: List[ContentHistoryEntry] = None) -> str:
        """
        Export history to CSV format
        
        Args:
            user_id: Optional user filter
            entries: Optional specific entries to export
            
        Returns:
            CSV string
        """
        if entries is None:
            entries = self.get_all_entries(user_id)
        
        output = StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'Content ID', 'Timestamp', 'Content Type', 'Template',
            'Word Count', 'Char Count', 'Validation Status',
            'Model Used', 'Favorite', 'Tags', 'Content Preview'
        ])
        
        # Write data
        for entry in entries:
            content_preview = entry.content[:100].replace('\n', ' ') + '...' if len(entry.content) > 100 else entry.content
            writer.writerow([
                entry.content_id,
                entry.timestamp,
                entry.content_type,
                entry.template_key,
                entry.word_count,
                entry.char_count,
                entry.validation_status,
                entry.model_used,
                'Yes' if entry.favorite else 'No',
                ', '.join(entry.tags),
                content_preview
            ])
        
        return output.getvalue()
    
    def export_to_pdf(self, user_id: str = None, entries: List[ContentHistoryEntry] = None) -> str:
        """
        Export history to PDF format
        
        Args:
            user_id: Optional user filter
            entries: Optional specific entries to export
            
        Returns:
            PDF filename or error message
        """
        try:
            from pdf_export import create_pdf_report
            
            if entries is None:
                entries = self.get_all_entries(user_id)
            
            if not entries:
                return "No entries to export"
            
            # Generate filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"content_history_{user_id or 'default'}_{timestamp}.pdf"
            
            # Create PDF
            result = create_pdf_report(entries, filename, user_id or "default_user")
            
            return result
            
        except ImportError:
            return "PDF export not available - missing dependencies"
        except Exception as e:
            return f"Error creating PDF: {str(e)}"
    
    def create_variation(self, parent_id: str, new_content: str,
                        modified_parameters: Dict, user_id: str = "default_user",
                        validation_result: Dict = None, model_used: str = "") -> Optional[ContentHistoryEntry]:
        """
        Create a variation of existing content
        
        Args:
            parent_id: ID of parent content
            new_content: New generated content
            modified_parameters: Modified parameters
            user_id: User identifier
            validation_result: Validation results
            model_used: AI model used
            
        Returns:
            New ContentHistoryEntry or None if parent not found
        """
        parent = self.get_entry(parent_id, user_id)
        if not parent:
            return None
        
        return self.add_entry(
            content=new_content,
            content_type=parent.content_type,
            template_key=parent.template_key,
            parameters=modified_parameters,
            user_id=user_id,
            validation_result=validation_result,
            model_used=model_used,
            parent_id=parent_id
        )
    
    def get_user_statistics(self, user_id: str = None) -> Dict:
        """Get statistics about content history for a specific user"""
        return self.get_statistics(user_id)
    
    def get_variations(self, content_id: str, user_id: str = None) -> List[ContentHistoryEntry]:
        """Get all variations of a content piece"""
        entries = self.get_all_entries(user_id)
        variations = [
            entry for entry in entries
            if entry.parent_id == content_id
        ]
        variations.sort(key=lambda x: x.version)
        return variations

# Global instance
history_manager = ContentHistoryManager()