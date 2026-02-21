"""
Batch Content Generation Processing Engine
Handles bulk content generation with queue management, rate limiting, and progress tracking
"""

import asyncio
import json
import time
import uuid
import threading
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Callable
from enum import Enum
from dataclasses import dataclass, asdict
from queue import Queue, Empty
import csv
import io
import zipfile
import os

class BatchStatus(Enum):
    """Batch processing status"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class ItemStatus(Enum):
    """Individual item status"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"

@dataclass
class BatchItem:
    """Individual content generation item"""
    id: str
    template_key: str
    user_prompt: str
    parameters: Dict[str, Any]
    status: ItemStatus = ItemStatus.PENDING
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    created_at: str = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now().isoformat()

@dataclass
class BatchJob:
    """Batch processing job"""
    id: str
    user_id: str
    name: str
    description: str
    items: List[BatchItem]
    status: BatchStatus = BatchStatus.PENDING
    progress: int = 0
    total_items: int = 0
    completed_items: int = 0
    failed_items: int = 0
    created_at: str = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    estimated_completion: Optional[str] = None
    settings: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now().isoformat()
        if self.total_items == 0:
            self.total_items = len(self.items)
        if self.settings is None:
            self.settings = {}

class RateLimiter:
    """Rate limiter for API calls"""
    
    def __init__(self, max_requests_per_minute: int = 20, max_concurrent: int = 3):
        self.max_requests_per_minute = max_requests_per_minute
        self.max_concurrent = max_concurrent
        self.request_times = []
        self.active_requests = 0
        self.lock = threading.RLock()  # Use RLock instead of Lock to prevent deadlocks
    
    def can_make_request(self) -> bool:
        """Check if we can make a request without exceeding limits"""
        try:
            with self.lock:
                now = time.time()
                
                # Remove requests older than 1 minute
                self.request_times = [t for t in self.request_times if now - t < 60]
                
                # Check rate limit
                if len(self.request_times) >= self.max_requests_per_minute:
                    return False
                
                # Check concurrent limit
                if self.active_requests >= self.max_concurrent:
                    return False
                
                return True
        except Exception:
            return False
    
    def acquire(self) -> bool:
        """Acquire a request slot"""
        try:
            with self.lock:
                now = time.time()
                
                # Remove requests older than 1 minute
                self.request_times = [t for t in self.request_times if now - t < 60]
                
                # Check rate limit
                if len(self.request_times) >= self.max_requests_per_minute:
                    return False
                
                # Check concurrent limit
                if self.active_requests >= self.max_concurrent:
                    return False
                
                # Acquire the slot
                self.request_times.append(time.time())
                self.active_requests += 1
                return True
        except Exception:
            return False
    
    def release(self):
        """Release a request slot"""
        try:
            with self.lock:
                self.active_requests = max(0, self.active_requests - 1)
        except Exception:
            pass
    
    def get_wait_time(self) -> float:
        """Get estimated wait time in seconds"""
        try:
            with self.lock:
                now = time.time()
                
                # If concurrent limit reached, wait a bit
                if self.active_requests >= self.max_concurrent:
                    return 5.0
                
                # If rate limit reached, wait until oldest request expires
                if len(self.request_times) >= self.max_requests_per_minute:
                    oldest_request = min(self.request_times)
                    wait_time = 60 - (now - oldest_request)
                    return max(0, wait_time)
                
                return 0
        except Exception:
            return 1.0  # Default wait time if error

class BatchProcessor:
    """Main batch processing engine with MongoDB persistence and in-memory fallback"""
    
    def __init__(self, llm_client, max_requests_per_minute: int = 20, max_concurrent: int = 3):
        self.llm_client = llm_client
        self.rate_limiter = RateLimiter(max_requests_per_minute, max_concurrent)
        self.processing_queue = Queue()
        self.worker_threads = []
        self.is_running = False
        self.progress_callbacks: Dict[str, List[Callable]] = {}
        
        # Initialize database connection
        self.db = None
        self.use_memory_fallback = False
        self.memory_jobs = {}  # Fallback storage
        self.memory_items = {}  # Fallback storage
        
        self._init_database()
        
        # Start worker threads
        self.start_workers()
    
    def _init_database(self):
        """Initialize database connection with fallback"""
        try:
            # Import here to avoid circular imports
            import sys
            import os
            sys.path.append(os.path.dirname(os.path.abspath(__file__)))
            
            from database import db_manager
            
            # Check if database is properly connected
            if (hasattr(db_manager, 'db') and db_manager.db is not None and 
                hasattr(db_manager, 'batch_jobs_collection') and db_manager.batch_jobs_collection is not None):
                self.db = db_manager
                self.use_memory_fallback = False
                print("✅ Database connection initialized for batch processor")
                print(f"   - Database: {db_manager.db.name}")
            else:
                print("⚠️  Database not available, using in-memory fallback")
                self.db = None
                self.use_memory_fallback = True
                
        except Exception as e:
            print(f"⚠️  Database connection failed, using in-memory fallback: {e}")
            import traceback
            traceback.print_exc()
            self.db = None
            self.use_memory_fallback = True
    
    def start_workers(self, num_workers: int = 2):
        """Start worker threads for processing"""
        self.is_running = True
        
        for i in range(num_workers):
            worker = threading.Thread(target=self._worker_loop, name=f"BatchWorker-{i}")
            worker.daemon = True
            worker.start()
            self.worker_threads.append(worker)
    
    def stop_workers(self):
        """Stop worker threads"""
        self.is_running = False
        
        # Add sentinel values to wake up workers
        for _ in self.worker_threads:
            try:
                self.processing_queue.put(None, timeout=1)
            except:
                pass
        
        # Wait for threads to finish with timeout
        for worker in self.worker_threads:
            try:
                worker.join(timeout=2)
            except:
                pass
        
        # Clear the thread list
        self.worker_threads.clear()
    
    def create_batch_job(self, user_id: str, name: str, description: str, 
                        items: List[Dict[str, Any]], settings: Dict[str, Any] = None) -> str:
        """Create a new batch job with MongoDB persistence or in-memory fallback"""
        job_id = str(uuid.uuid4())
        
        # Convert items to BatchItem objects for processing
        batch_items = []
        items_data = []
        
        for i, item_data in enumerate(items):
            item_id = f"{job_id}-{i}"
            
            # Create BatchItem for processing
            batch_item = BatchItem(
                id=item_id,
                template_key=item_data.get('template_key', 'linkedin_post'),
                user_prompt=item_data.get('user_prompt', ''),
                parameters=item_data.get('parameters', {})
            )
            batch_items.append(batch_item)
            
            # Create item data for storage
            item_doc = {
                'item_id': item_id,
                'job_id': job_id,
                'user_id': user_id,
                'template_key': item_data.get('template_key', 'linkedin_post'),
                'user_prompt': item_data.get('user_prompt', ''),
                'parameters': item_data.get('parameters', {}),
                'status': ItemStatus.PENDING.value,
                'result': None,
                'error': None,
                'started_at': None,
                'completed_at': None
            }
            items_data.append(item_doc)
        
        # Create batch job data
        avg_time_per_item = settings.get('avg_time_per_item', 10) if settings else 10
        estimated_total_time = len(batch_items) * avg_time_per_item
        estimated_completion = (datetime.now() + timedelta(seconds=estimated_total_time)).isoformat()
        
        job_doc = {
            'job_id': job_id,
            'user_id': user_id,
            'name': name,
            'description': description,
            'status': BatchStatus.PENDING.value,
            'progress': 0,
            'total_items': len(batch_items),
            'completed_items': 0,
            'failed_items': 0,
            'started_at': None,
            'completed_at': None,
            'estimated_completion': estimated_completion,
            'settings': settings or {},
            'created_at': datetime.now().isoformat()
        }
        
        # Save to storage (MongoDB or memory)
        try:
            print(f"Creating batch job: {job_id} (MongoDB: {not self.use_memory_fallback})")
            
            if self.use_memory_fallback:
                # Use in-memory storage
                self.memory_jobs[job_id] = job_doc
                self.memory_items[job_id] = items_data
                print(f"✅ Job {job_id} created in memory storage")
            else:
                # Use MongoDB
                job_created = self.db.create_batch_job(job_doc)
                print(f"Job creation result: {job_created}")
                
                if not job_created:
                    raise Exception("Failed to create batch job in database")
                
                items_created = self.db.create_batch_items(items_data)
                print(f"Items creation result: {items_created}")
                
                if not items_created:
                    raise Exception("Failed to create batch items in database")
                
                print(f"✅ Job {job_id} created in MongoDB")
            
            # Add to processing queue
            self.processing_queue.put(job_id)
            print(f"Added job {job_id} to processing queue")
            
            return job_id
            
        except Exception as e:
            print(f"Error creating batch job: {e}")
            # Cleanup on failure
            if self.use_memory_fallback:
                self.memory_jobs.pop(job_id, None)
                self.memory_items.pop(job_id, None)
            else:
                try:
                    self.db.delete_batch_job(job_id, user_id)
                except:
                    pass
            raise
    
    def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get job status and progress from MongoDB or memory fallback"""
        try:
            if self.use_memory_fallback:
                # Use in-memory storage
                job_doc = self.memory_jobs.get(job_id)
                if not job_doc:
                    return None
                
                return {
                    'id': job_doc['job_id'],
                    'user_id': job_doc['user_id'],
                    'name': job_doc['name'],
                    'description': job_doc['description'],
                    'status': job_doc['status'],
                    'progress': job_doc['progress'],
                    'total_items': job_doc['total_items'],
                    'completed_items': job_doc['completed_items'],
                    'failed_items': job_doc['failed_items'],
                    'created_at': job_doc.get('created_at'),
                    'started_at': job_doc.get('started_at'),
                    'completed_at': job_doc.get('completed_at'),
                    'estimated_completion': job_doc.get('estimated_completion'),
                    'settings': job_doc.get('settings', {})
                }
            else:
                # Use MongoDB
                if not self.db:
                    print("Database not available for get_job_status")
                    return None
                    
                job_doc = self.db.get_batch_job(job_id)
                if not job_doc:
                    return None
                
                return {
                    'id': job_doc['job_id'],
                    'user_id': job_doc['user_id'],
                    'name': job_doc['name'],
                    'description': job_doc['description'],
                    'status': job_doc['status'],
                    'progress': job_doc['progress'],
                    'total_items': job_doc['total_items'],
                    'completed_items': job_doc['completed_items'],
                    'failed_items': job_doc['failed_items'],
                    'created_at': job_doc.get('created_at', '').isoformat() if isinstance(job_doc.get('created_at'), datetime) else job_doc.get('created_at'),
                    'started_at': job_doc.get('started_at'),
                    'completed_at': job_doc.get('completed_at'),
                    'estimated_completion': job_doc.get('estimated_completion'),
                    'settings': job_doc.get('settings', {})
                }
                
        except Exception as e:
            print(f"Error getting job status: {e}")
            return None
    
    def get_job_results(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed job results including all items from MongoDB or memory fallback"""
        try:
            if self.use_memory_fallback:
                # Use in-memory storage
                job_doc = self.memory_jobs.get(job_id)
                if not job_doc:
                    return None
                
                items_data = self.memory_items.get(job_id, [])
                
                items_list = []
                for item_doc in items_data:
                    # Convert item to dict with proper serialization
                    item_dict = {
                        'id': item_doc['item_id'],
                        'template_key': item_doc['template_key'],
                        'user_prompt': item_doc['user_prompt'],
                        'parameters': item_doc['parameters'],
                        'status': item_doc['status'],
                        'result': item_doc.get('result'),
                        'error': item_doc.get('error'),
                        'created_at': item_doc.get('created_at'),
                        'started_at': item_doc.get('started_at'),
                        'completed_at': item_doc.get('completed_at')
                    }
                    items_list.append(item_dict)
                
                return {
                    'job': self.get_job_status(job_id),
                    'items': items_list
                }
            else:
                # Use MongoDB
                job_doc = self.db.get_batch_job(job_id)
                if not job_doc:
                    return None
                
                # Get job items
                items_docs = self.db.get_batch_items(job_id)
                
                items_data = []
                for item_doc in items_docs:
                    # Convert item to dict with proper serialization
                    item_dict = {
                        'id': item_doc['item_id'],
                        'template_key': item_doc['template_key'],
                        'user_prompt': item_doc['user_prompt'],
                        'parameters': item_doc['parameters'],
                        'status': item_doc['status'],  # Already a string from MongoDB
                        'result': item_doc.get('result'),
                        'error': item_doc.get('error'),
                        'created_at': item_doc.get('created_at', '').isoformat() if isinstance(item_doc.get('created_at'), datetime) else item_doc.get('created_at'),
                        'started_at': item_doc.get('started_at'),
                        'completed_at': item_doc.get('completed_at')
                    }
                    items_data.append(item_dict)
                
                return {
                    'job': self.get_job_status(job_id),
                    'items': items_data
                }
            
        except Exception as e:
            print(f"Error getting job results: {e}")
            return None
    
    def cancel_job(self, job_id: str) -> bool:
        """Cancel a batch job"""
        try:
            if self.use_memory_fallback:
                # Use in-memory storage
                job_doc = self.memory_jobs.get(job_id)
                if not job_doc:
                    return False
                
                if job_doc['status'] in ['pending', 'processing']:
                    job_doc['status'] = BatchStatus.CANCELLED.value
                    job_doc['completed_at'] = datetime.now().isoformat()
                    return True
                
                return False
            else:
                # Use MongoDB
                job_doc = self.db.get_batch_job(job_id)
                if not job_doc:
                    return False
                
                if job_doc['status'] in ['pending', 'processing']:
                    update_data = {
                        'status': BatchStatus.CANCELLED.value,
                        'completed_at': datetime.now().isoformat()
                    }
                    return self.db.update_batch_job(job_id, update_data)
                
                return False
                
        except Exception as e:
            print(f"Error cancelling job: {e}")
            return False
    
    def add_progress_callback(self, job_id: str, callback: Callable):
        """Add a progress callback for a job"""
        if job_id not in self.progress_callbacks:
            self.progress_callbacks[job_id] = []
        self.progress_callbacks[job_id].append(callback)
    
    def _notify_progress(self, job_id: str, job: BatchJob):
        """Notify progress callbacks"""
        callbacks = self.progress_callbacks.get(job_id, [])
        for callback in callbacks:
            try:
                callback(job_id, job)
            except Exception as e:
                print(f"Progress callback error: {e}")
    
    def _worker_loop(self):
        """Main worker loop"""
        while self.is_running:
            try:
                # Get job from queue (blocking with timeout)
                job_id = self.processing_queue.get(timeout=1)
                
                # Sentinel value to stop worker
                if job_id is None:
                    break
                
                # Process the job
                self._process_job(job_id)
                
            except Empty:
                continue
            except Exception as e:
                print(f"Worker error: {e}")
    
    def _process_job(self, job_id: str):
        """Process a batch job with MongoDB persistence or memory fallback"""
        try:
            if self.use_memory_fallback:
                # Use in-memory storage
                job_doc = self.memory_jobs.get(job_id)
                if not job_doc or job_doc['status'] == 'cancelled':
                    return
                
                # Update job status to processing
                job_doc['status'] = BatchStatus.PROCESSING.value
                job_doc['started_at'] = datetime.now().isoformat()
                self._notify_progress(job_id, job_doc)
                
                # Get job items
                items_data = self.memory_items.get(job_id, [])
                
                completed_items = 0
                failed_items = 0
                
                # Process each item
                for i, item_doc in enumerate(items_data):
                    # Check if job was cancelled
                    if job_doc['status'] == 'cancelled':
                        break
                    
                    # Wait for rate limit
                    while not self.rate_limiter.acquire():
                        if job_doc['status'] == 'cancelled':
                            break
                        wait_time = self.rate_limiter.get_wait_time()
                        time.sleep(min(wait_time, 1.0))
                    
                    if job_doc['status'] == 'cancelled':
                        break
                    
                    try:
                        # Process individual item
                        success = self._process_item_memory(item_doc)
                        if success:
                            completed_items += 1
                        else:
                            failed_items += 1
                        
                    except Exception as e:
                        # Update item as failed
                        item_doc['status'] = ItemStatus.FAILED.value
                        item_doc['error'] = str(e)
                        item_doc['completed_at'] = datetime.now().isoformat()
                        failed_items += 1
                    
                    finally:
                        self.rate_limiter.release()
                    
                    # Update job progress
                    progress = int((i + 1) / len(items_data) * 100)
                    job_doc['progress'] = progress
                    job_doc['completed_items'] = completed_items
                    job_doc['failed_items'] = failed_items
                    
                    # Notify progress callbacks
                    self._notify_progress(job_id, job_doc)
                
                # Mark job as completed
                if job_doc['status'] != 'cancelled':
                    job_doc['status'] = BatchStatus.COMPLETED.value
                    job_doc['completed_at'] = datetime.now().isoformat()
                    job_doc['progress'] = 100
                    job_doc['completed_items'] = completed_items
                    job_doc['failed_items'] = failed_items
                    
                    self._notify_progress(job_id, job_doc)
            else:
                # Use MongoDB (existing implementation)
                job_doc = self.db.get_batch_job(job_id)
                if not job_doc or job_doc['status'] == 'cancelled':
                    return
                
                # Update job status to processing
                update_data = {
                    'status': BatchStatus.PROCESSING.value,
                    'started_at': datetime.now().isoformat()
                }
                self.db.update_batch_job(job_id, update_data)
                self._notify_progress(job_id, job_doc)
                
                # Get job items
                items_docs = self.db.get_batch_items(job_id)
                
                completed_items = 0
                failed_items = 0
                
                # Process each item
                for i, item_doc in enumerate(items_docs):
                    # Check if job was cancelled
                    current_job = self.db.get_batch_job(job_id)
                    if current_job and current_job['status'] == 'cancelled':
                        break
                    
                    # Wait for rate limit
                    while not self.rate_limiter.acquire():
                        current_job = self.db.get_batch_job(job_id)
                        if current_job and current_job['status'] == 'cancelled':
                            break
                        wait_time = self.rate_limiter.get_wait_time()
                        time.sleep(min(wait_time, 1.0))
                    
                    current_job = self.db.get_batch_job(job_id)
                    if current_job and current_job['status'] == 'cancelled':
                        break
                    
                    try:
                        # Process individual item
                        success = self._process_item_mongodb(item_doc)
                        if success:
                            completed_items += 1
                        else:
                            failed_items += 1
                        
                    except Exception as e:
                        # Update item as failed
                        item_update = {
                            'status': ItemStatus.FAILED.value,
                            'error': str(e),
                            'completed_at': datetime.now().isoformat()
                        }
                        self.db.update_batch_item(item_doc['item_id'], item_update)
                        failed_items += 1
                    
                    finally:
                        self.rate_limiter.release()
                    
                    # Update job progress
                    progress = int((i + 1) / len(items_docs) * 100)
                    job_update = {
                        'progress': progress,
                        'completed_items': completed_items,
                        'failed_items': failed_items
                    }
                    self.db.update_batch_job(job_id, job_update)
                    
                    # Notify progress callbacks
                    updated_job = self.db.get_batch_job(job_id)
                    if updated_job:
                        self._notify_progress(job_id, updated_job)
                
                # Mark job as completed
                current_job = self.db.get_batch_job(job_id)
                if current_job and current_job['status'] != 'cancelled':
                    final_update = {
                        'status': BatchStatus.COMPLETED.value,
                        'completed_at': datetime.now().isoformat(),
                        'progress': 100,
                        'completed_items': completed_items,
                        'failed_items': failed_items
                    }
                    self.db.update_batch_job(job_id, final_update)
                    
                    updated_job = self.db.get_batch_job(job_id)
                    if updated_job:
                        self._notify_progress(job_id, updated_job)
            
        except Exception as e:
            # Mark job as failed
            if self.use_memory_fallback:
                job_doc = self.memory_jobs.get(job_id)
                if job_doc:
                    job_doc['status'] = BatchStatus.FAILED.value
                    job_doc['completed_at'] = datetime.now().isoformat()
                    self._notify_progress(job_id, job_doc)
            else:
                error_update = {
                    'status': BatchStatus.FAILED.value,
                    'completed_at': datetime.now().isoformat()
                }
                self.db.update_batch_job(job_id, error_update)
                
                updated_job = self.db.get_batch_job(job_id)
                if updated_job:
                    self._notify_progress(job_id, updated_job)
            
            print(f"Job processing error: {e}")
            import traceback
            traceback.print_exc()
    
    def _process_item_memory(self, item_doc: Dict[str, Any]) -> bool:
        """Process an individual batch item with memory storage"""
        item_id = item_doc['item_id']
        
        # Update item status to processing
        item_doc['status'] = ItemStatus.PROCESSING.value
        item_doc['started_at'] = datetime.now().isoformat()
        
        try:
            # Import here to avoid circular imports
            from multi_content_engine import MultiContentGenerator
            
            # Create generator
            generator = MultiContentGenerator(self.llm_client)
            
            # Ensure parameters have proper defaults for batch processing
            enhanced_parameters = item_doc['parameters'].copy()
            
            # Set HIGH QUALITY content_mode for batch processing (instead of default)
            if 'content_mode' not in enhanced_parameters:
                enhanced_parameters['content_mode'] = 'high_quality'  # Use high quality model for better content
            
            # Ensure tone is set
            if 'tone' not in enhanced_parameters:
                enhanced_parameters['tone'] = 'professional'
            
            # Ensure length is set with more substantial default
            if 'length' not in enhanced_parameters:
                enhanced_parameters['length'] = 'medium (200-400 words)'
            
            # Add explicit content requirements
            enhanced_parameters['include_cta'] = enhanced_parameters.get('include_cta', True)
            enhanced_parameters['creativity'] = enhanced_parameters.get('creativity', 75)  # Higher creativity for better content
            
            # Generate content
            result = generator.generate_single_content(
                item_doc['template_key'],
                item_doc['user_prompt'],
                enhanced_parameters
            )
            
            if result['success']:
                # Update item as completed
                item_result = {
                    'content': result['content'],
                    'word_count': result.get('word_count', 0),
                    'quality_score': result.get('quality_score', 0),
                    'model_used': result.get('model_name', result.get('model_used', 'Unknown')),
                    'validation': result.get('validation', {}),
                    'template_used': result.get('template_key', item_doc['template_key']),
                    'char_count': result.get('char_count', 0),
                    'processing_applied': result.get('processing_applied', False),
                    'strategy_used': result.get('strategy_used', item_doc['template_key'])
                }
                
                item_doc['status'] = ItemStatus.COMPLETED.value
                item_doc['result'] = item_result
                item_doc['completed_at'] = datetime.now().isoformat()
                return True
            else:
                # Update item as failed
                item_doc['status'] = ItemStatus.FAILED.value
                item_doc['error'] = result.get('error', 'Unknown error')
                item_doc['completed_at'] = datetime.now().isoformat()
                return False
            
        except Exception as e:
            # Update item as failed
            item_doc['status'] = ItemStatus.FAILED.value
            item_doc['error'] = str(e)
            item_doc['completed_at'] = datetime.now().isoformat()
            return False

    def _process_item_mongodb(self, item_doc: Dict[str, Any]) -> bool:
        """Process an individual batch item with MongoDB persistence"""
        item_id = item_doc['item_id']
        
        # Update item status to processing
        item_update = {
            'status': ItemStatus.PROCESSING.value,
            'started_at': datetime.now().isoformat()
        }
        self.db.update_batch_item(item_id, item_update)
        
        try:
            # Import here to avoid circular imports
            from multi_content_engine import MultiContentGenerator
            
            # Create generator
            generator = MultiContentGenerator(self.llm_client)
            
            # Ensure parameters have proper defaults for batch processing
            enhanced_parameters = item_doc['parameters'].copy()
            
            # Set HIGH QUALITY content_mode for batch processing (instead of default)
            if 'content_mode' not in enhanced_parameters:
                enhanced_parameters['content_mode'] = 'high_quality'  # Use high quality model for better content
            
            # Ensure tone is set
            if 'tone' not in enhanced_parameters:
                enhanced_parameters['tone'] = 'professional'
            
            # Ensure length is set with more substantial default
            if 'length' not in enhanced_parameters:
                enhanced_parameters['length'] = 'medium (200-400 words)'
            
            # Add explicit content requirements
            enhanced_parameters['include_cta'] = enhanced_parameters.get('include_cta', True)
            enhanced_parameters['creativity'] = enhanced_parameters.get('creativity', 75)  # Higher creativity for better content
            
            # Generate content
            result = generator.generate_single_content(
                item_doc['template_key'],
                item_doc['user_prompt'],
                enhanced_parameters
            )
            
            if result['success']:
                # Update item as completed
                item_result = {
                    'content': result['content'],
                    'word_count': result.get('word_count', 0),
                    'quality_score': result.get('quality_score', 0),
                    'model_used': result.get('model_name', result.get('model_used', 'Unknown')),
                    'validation': result.get('validation', {}),
                    'template_used': result.get('template_key', item_doc['template_key']),
                    'char_count': result.get('char_count', 0),
                    'processing_applied': result.get('processing_applied', False),
                    'strategy_used': result.get('strategy_used', item_doc['template_key'])
                }
                
                item_update = {
                    'status': ItemStatus.COMPLETED.value,
                    'result': item_result,
                    'completed_at': datetime.now().isoformat()
                }
                self.db.update_batch_item(item_id, item_update)
                return True
            else:
                # Update item as failed
                item_update = {
                    'status': ItemStatus.FAILED.value,
                    'error': result.get('error', 'Unknown error'),
                    'completed_at': datetime.now().isoformat()
                }
                self.db.update_batch_item(item_id, item_update)
                return False
            
        except Exception as e:
            # Update item as failed
            item_update = {
                'status': ItemStatus.FAILED.value,
                'error': str(e),
                'completed_at': datetime.now().isoformat()
            }
            self.db.update_batch_item(item_id, item_update)
            return False
    
    def export_results_to_zip(self, job_id: str, export_format: str = 'json') -> Optional[bytes]:
        """Export job results to ZIP file"""
        try:
            # Get job results using the appropriate storage method
            job_results = self.get_job_results(job_id)
            if not job_results:
                return None
            
            job_info = job_results['job']
            items = job_results['items']
            
            # Create ZIP file in memory
            zip_buffer = io.BytesIO()
            
            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                # Add job summary
                completed_items = sum(1 for item in items if item['status'] == 'completed')
                failed_items = sum(1 for item in items if item['status'] == 'failed')
                total_items = len(items)
                
                job_summary = {
                    'job_info': job_info,
                    'summary': {
                        'total_items': total_items,
                        'completed_items': completed_items,
                        'failed_items': failed_items,
                        'success_rate': (completed_items / total_items * 100) if total_items > 0 else 0
                    }
                }
                
                zip_file.writestr('job_summary.json', json.dumps(job_summary, indent=2))
                
                # Add individual results
                for i, item in enumerate(items):
                    if item['status'] == 'completed' and item.get('result'):
                        filename = f"item_{i+1:03d}_{item['template_key']}"
                        
                        if export_format == 'json':
                            content_data = {
                                'id': item['id'],
                                'template_key': item['template_key'],
                                'user_prompt': item['user_prompt'],
                                'parameters': item['parameters'],
                                'result': item['result'],
                                'created_at': item.get('created_at'),
                                'completed_at': item.get('completed_at')
                            }
                            zip_file.writestr(f"{filename}.json", json.dumps(content_data, indent=2))
                        
                        elif export_format == 'txt':
                            content = item['result'].get('content', '')
                            metadata = f"Template: {item['template_key']}\nPrompt: {item['user_prompt']}\nGenerated: {item.get('completed_at', 'N/A')}\n\n"
                            zip_file.writestr(f"{filename}.txt", metadata + content)
                        
                        elif export_format == 'csv':
                            # For CSV, we'll create a single file with all results
                            pass  # Handled separately below
                
                # Add CSV export if requested
                if export_format == 'csv':
                    csv_buffer = io.StringIO()
                    writer = csv.writer(csv_buffer)
                    
                    # Write header
                    writer.writerow([
                        'Item ID', 'Template', 'Prompt', 'Content', 'Word Count', 
                        'Quality Score', 'Model Used', 'Status', 'Created At', 'Completed At'
                    ])
                    
                    # Write data
                    for item in items:
                        if item['status'] == 'completed' and item.get('result'):
                            result = item['result']
                            writer.writerow([
                                item['id'],
                                item['template_key'],
                                item['user_prompt'],
                                result.get('content', ''),
                                result.get('word_count', 0),
                                result.get('quality_score', 0),
                                result.get('model_used', 'Unknown'),
                                item['status'],
                                item.get('created_at', ''),
                                item.get('completed_at', '')
                            ])
                    
                    zip_file.writestr('batch_results.csv', csv_buffer.getvalue())
                
                # Add failed items log
                failed_items_list = [item for item in items if item['status'] == 'failed']
                if failed_items_list:
                    failed_log = []
                    for item in failed_items_list:
                        failed_log.append({
                            'id': item['id'],
                            'template_key': item['template_key'],
                            'user_prompt': item['user_prompt'],
                            'error': item.get('error', 'Unknown error'),
                            'created_at': item.get('created_at')
                        })
                    
                    zip_file.writestr('failed_items.json', json.dumps(failed_log, indent=2))
            
            zip_buffer.seek(0)
            return zip_buffer.getvalue()
            
        except Exception as e:
            print(f"Error creating export ZIP: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def parse_csv_input(self, csv_content: str) -> List[Dict[str, Any]]:
        """Parse CSV input for batch processing"""
        items = []
        
        try:
            csv_reader = csv.DictReader(io.StringIO(csv_content))
            
            for row in csv_reader:
                # Extract required fields
                template_key = row.get('template_key', row.get('template', 'linkedin_post'))
                user_prompt = row.get('user_prompt', row.get('prompt', ''))
                
                if not user_prompt.strip():
                    continue
                
                # Extract parameters
                parameters = {}
                for key, value in row.items():
                    if key not in ['template_key', 'template', 'user_prompt', 'prompt'] and value:
                        parameters[key] = value
                
                items.append({
                    'template_key': template_key,
                    'user_prompt': user_prompt,
                    'parameters': parameters
                })
        
        except Exception as e:
            raise ValueError(f"CSV parsing error: {e}")
        
        return items
    
    def get_user_jobs(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all jobs for a user from MongoDB or memory fallback"""
        try:
            if self.use_memory_fallback:
                # Use in-memory storage
                user_jobs = []
                for job_id, job_doc in self.memory_jobs.items():
                    if job_doc['user_id'] == user_id:
                        job_status = {
                            'id': job_doc['job_id'],
                            'user_id': job_doc['user_id'],
                            'name': job_doc['name'],
                            'description': job_doc['description'],
                            'status': job_doc['status'],
                            'progress': job_doc['progress'],
                            'total_items': job_doc['total_items'],
                            'completed_items': job_doc['completed_items'],
                            'failed_items': job_doc['failed_items'],
                            'created_at': job_doc.get('created_at'),
                            'started_at': job_doc.get('started_at'),
                            'completed_at': job_doc.get('completed_at'),
                            'estimated_completion': job_doc.get('estimated_completion'),
                            'settings': job_doc.get('settings', {})
                        }
                        user_jobs.append(job_status)
                
                # Sort by created_at descending
                user_jobs.sort(key=lambda x: x.get('created_at', ''), reverse=True)
                return user_jobs
            else:
                # Use MongoDB
                jobs_docs = self.db.get_user_batch_jobs(user_id)
                
                user_jobs = []
                for job_doc in jobs_docs:
                    job_status = {
                        'id': job_doc['job_id'],
                        'user_id': job_doc['user_id'],
                        'name': job_doc['name'],
                        'description': job_doc['description'],
                        'status': job_doc['status'],
                        'progress': job_doc['progress'],
                        'total_items': job_doc['total_items'],
                        'completed_items': job_doc['completed_items'],
                        'failed_items': job_doc['failed_items'],
                        'created_at': job_doc.get('created_at', '').isoformat() if isinstance(job_doc.get('created_at'), datetime) else job_doc.get('created_at'),
                        'started_at': job_doc.get('started_at'),
                        'completed_at': job_doc.get('completed_at'),
                        'estimated_completion': job_doc.get('estimated_completion'),
                        'settings': job_doc.get('settings', {})
                    }
                    user_jobs.append(job_status)
                
                return user_jobs
            
        except Exception as e:
            print(f"Error getting user jobs: {e}")
            return []
    
    def cleanup_old_jobs(self, max_age_hours: int = 24):
        """Clean up old completed jobs from MongoDB"""
        try:
            deleted_count = self.db.cleanup_old_batch_jobs(max_age_hours)
            if deleted_count > 0:
                print(f"Cleaned up {deleted_count} old batch jobs")
        except Exception as e:
            print(f"Error cleaning up old jobs: {e}")
    
    def __del__(self):
        """Cleanup when processor is destroyed"""
        try:
            self.stop_workers()
        except:
            pass

# Global batch processor instance
batch_processor = None

def get_batch_processor():
    """Get or create the global batch processor instance"""
    global batch_processor
    if batch_processor is None:
        try:
            print("Creating new batch processor instance...")
            from llm_client import OpenRouterClient
            client = OpenRouterClient()
            batch_processor = BatchProcessor(client)
            print("Batch processor created successfully")
        except Exception as e:
            print(f"Error creating batch processor: {e}")
            import traceback
            traceback.print_exc()
            raise
    return batch_processor