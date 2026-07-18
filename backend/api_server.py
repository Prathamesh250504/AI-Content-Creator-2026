#!/usr/bin/env python3
"""
Flask API Server for AI Content Creator React Frontend
Provides REST API endpoints for content generation, history, and analytics
"""

import os
import sys
from datetime import datetime
import json
import io
import csv
import uuid

# CRITICAL: Add backend path for imports BEFORE any local imports
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

print(f"Backend directory: {current_dir}")
print(f"Python path: {sys.path[:3]}")

from flask import Flask, request, jsonify, send_file
try:
    from flask_cors import CORS
    CORS_AVAILABLE = True
except ImportError:
    CORS_AVAILABLE = False
    print("WARNING: flask-cors not available, CORS will be handled manually")

# Import backend modules
try:
    from content_templates import template_manager
    from parameter_engine import parameter_engine
    from multi_content_engine import MultiContentGenerator, ContentValidator
    from multi_model_manager import multi_model_manager, ContentMode
    from user_profile import profile_manager
    from content_history import history_manager
    from llm_client import OpenRouterClient
    from database import db_manager
    from content_quality_analyzer import quality_analyzer
    from auth import auth_manager
    from batch_processor import get_batch_processor
    from template_library import get_template_categories, get_all_templates
    from prompt_template_manager import PromptTemplateManager
    from ab_test_manager import ab_test_manager
    print("✅ All backend modules imported successfully")
except ImportError as e:
    print(f"❌ Import error: {e}")
    print(f"Current directory: {current_dir}")
    print(f"Directory contents: {os.listdir(current_dir)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

app = Flask(__name__)
if CORS_AVAILABLE:
    # Configure CORS with specific origins
    cors_origins = os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000,http://192.168.1.5:3000').split(',')
    CORS(app, origins=cors_origins, supports_credentials=True)
else:
    # Manual CORS handling
    @app.after_request
    def after_request(response):
        origin = request.headers.get('Origin')
        allowed_origins = os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000,http://192.168.1.5:3000').split(',')
        
        if origin in allowed_origins:
            response.headers.add('Access-Control-Allow-Origin', origin)
        else:
            response.headers.add('Access-Control-Allow-Origin', '*')
            
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response

# Initialize OpenRouter client
openrouter_client = OpenRouterClient()

# Initialize template manager
template_manager = PromptTemplateManager()

# Handle preflight requests
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = jsonify({'status': 'ok'})
        origin = request.headers.get('Origin')
        allowed_origins = os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000,http://192.168.1.5:3000').split(',')
        
        if origin in allowed_origins:
            response.headers.add('Access-Control-Allow-Origin', origin)
        else:
            response.headers.add('Access-Control-Allow-Origin', '*')
            
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response

def get_template_by_key(template_key):
    """Get template from template library by key"""
    try:
        # Backward compatibility mapping for old template keys
        key_mapping = {
            'linkedin_post': 'linkedin_professional_post',
            'email_marketing': 'email_marketing_campaign',
            'blog_post': 'blog_post_structure',
            'ad_copy': 'product_description_optimizer',  # Closest match
            'press_release': 'business_proposal_generator',  # Closest match
            'product_description': 'product_description_optimizer'
        }
        
        # Use mapped key if available
        mapped_key = key_mapping.get(template_key, template_key)
        
        templates = get_all_templates()
        print(f"Looking for template: {template_key} (mapped to: {mapped_key})")
        
        for template in templates:
            key = template['name'].lower().replace(' ', '_')
            if key == mapped_key:
                print(f"Found template: {template['name']}")
                return {
                    'name': template['name'],
                    'description': template['description'],
                    'template_content': template.get('template_content', ''),
                    'variables': template.get('variables', []),
                    'required_fields': [var['name'] for var in template.get('variables', []) if var.get('required', False)],
                    'optional_fields': [var['name'] for var in template.get('variables', []) if not var.get('required', False)],
                    'category': template.get('category', 'general')
                }
        
        print(f"Template not found: {template_key} (mapped to: {mapped_key})")
        return None
    except Exception as e:
        print(f"Error in get_template_by_key: {e}")
        return None

# Authentication middleware
def require_auth(f):
    """Decorator to require authentication for endpoints"""
    from functools import wraps
    
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'error': 'Authorization token required'
            }), 401
        
        token = auth_header.split(' ')[1]
        user = auth_manager.get_user_from_token(token)
        
        if not user:
            return jsonify({
                'success': False,
                'error': 'Invalid or expired token'
            }), 401
        
        # Add user to request context
        request.current_user = user
        return f(*args, **kwargs)
    
    return decorated_function

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

# Authentication Endpoints

@app.route('/api/auth/register', methods=['POST'])
def register_user():
    """Register a new user"""
    try:
        data = request.get_json()
        
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        first_name = data.get('firstName', '').strip()
        last_name = data.get('lastName', '').strip()
        
        # Validate input
        if not all([email, password, first_name, last_name]):
            return jsonify({
                'success': False,
                'error': 'All fields are required'
            }), 400
        
        # Register user
        result = auth_manager.register_user(email, password, first_name, last_name)
        
        if result['success']:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Registration failed. Please try again.'
        }), 500

@app.route('/api/auth/login', methods=['POST'])
def login_user():
    """Login user"""
    try:
        data = request.get_json()
        
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        # Validate input
        if not email or not password:
            return jsonify({
                'success': False,
                'error': 'Email and password are required'
            }), 400
        
        # Login user
        result = auth_manager.login_user(email, password)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 401
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Login failed. Please try again.'
        }), 500

@app.route('/api/auth/verify', methods=['POST'])
def verify_token():
    """Verify JWT token and return user info"""
    try:
        data = request.get_json()
        token = data.get('token', '')
        
        if not token:
            return jsonify({
                'success': False,
                'error': 'Token is required'
            }), 400
        
        # Verify token and get user
        user = auth_manager.get_user_from_token(token)
        
        if user:
            return jsonify({
                'success': True,
                'user': user,
                'valid': True
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Invalid or expired token',
                'valid': False
            }), 401
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Token verification failed'
        }), 500

@app.route('/api/auth/logout', methods=['POST'])
def logout_user():
    """Logout user (client-side token removal)"""
    try:
        # For JWT tokens, logout is handled client-side by removing the token
        # This endpoint exists for consistency and future server-side session management
        return jsonify({
            'success': True,
            'message': 'Logged out successfully'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Logout failed'
        }), 500

@app.route('/api/auth/google', methods=['POST'])
def google_auth():
    """Authenticate user with Google OAuth"""
    try:
        data = request.get_json()
        
        if not data or 'token' not in data:
            return jsonify({
                'success': False,
                'error': 'Google token is required'
            }), 400
        
        google_token = data['token']
        
        # Import Google auth handler
        from google_auth import google_auth_handler
        
        # Authenticate with Google
        result = google_auth_handler.authenticate_google_user(google_token)
        
        if result['success']:
            return jsonify(result), 200
        else:
            error_msg = result.get('error', '')
            # 401 only for actual auth failures (bad/expired token, unverified email)
            # 500 for server-side issues like DB being unavailable
            if any(k in error_msg.lower() for k in ['token', 'verified', 'invalid google']):
                return jsonify(result), 401
            return jsonify(result), 500
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': 'Google authentication failed. Please try again.'
        }), 500

@app.route('/api/auth/profile', methods=['GET'])
def get_authenticated_user_profile():
    """Get current user profile from token"""
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'error': 'Authorization token required'
            }), 401
        
        token = auth_header.split(' ')[1]
        user = auth_manager.get_user_from_token(token)
        
        if not user:
            return jsonify({
                'success': False,
                'error': 'Invalid or expired token'
            }), 401
        
        return jsonify({
            'success': True,
            'user': user
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to get user profile'
        }), 500

@app.route('/api/auth/update-preferences', methods=['PUT'])
def update_authenticated_user_preferences():
    """Update preferences for authenticated user"""
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'error': 'Authorization token required'
            }), 401
        
        token = auth_header.split(' ')[1]
        user = auth_manager.get_user_from_token(token)
        
        if not user:
            return jsonify({
                'success': False,
                'error': 'Invalid or expired token'
            }), 401
        
        data = request.get_json()
        preferences = data.get('preferences', {})
        
        # Update preferences
        success = auth_manager.update_user_preferences(user['user_id'], preferences)
        
        if success:
            # Get updated user data
            updated_user = auth_manager.get_user_from_token(token)
            return jsonify({
                'success': True,
                'message': 'Preferences updated successfully',
                'user': updated_user
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to update preferences'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to update preferences'
        }), 500

@app.route('/api/auth/check-usage', methods=['GET'])
def check_user_usage_limits():
    """Check usage limits for authenticated user"""
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'error': 'Authorization token required'
            }), 401
        
        token = auth_header.split(' ')[1]
        user = auth_manager.get_user_from_token(token)
        
        if not user:
            return jsonify({
                'success': False,
                'error': 'Invalid or expired token'
            }), 401
        
        # Check usage limits
        usage_check = auth_manager.check_usage_limits(user['user_id'])
        
        return jsonify({
            'success': True,
            'usage': usage_check
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to check usage limits'
        }), 500

@app.route('/api/parameters', methods=['GET'])
def get_parameter_configs():
    """Get parameter configurations for the frontend"""
    try:
        from parameter_engine import parameter_engine
        
        configs = parameter_engine.get_all_parameter_configs()
        
        # Convert ParameterConfig objects to dictionaries
        parameter_data = {}
        for name, config in configs.items():
            parameter_data[name] = {
                'name': config.name,
                'type': config.param_type,
                'description': config.description,
                'tooltip': config.tooltip,
                'example': config.example,
                'default_value': config.default_value,
                'options': config.options,
                'min_value': config.min_value,
                'max_value': config.max_value,
                'required': config.required
            }
        
        return jsonify({
            'success': True,
            'parameters': parameter_data
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/templates', methods=['GET'])
def get_templates():
    """Get available content templates from template library"""
    try:
        from template_library import get_all_templates
        
        # Get templates from the new template library
        templates = get_all_templates()
        
        # Convert to the expected format for backward compatibility
        templates_list = []
        for template in templates:
            # Extract required and optional fields from variables
            required_fields = []
            optional_fields = []
            
            for var in template.get('variables', []):
                if var.get('required', False):
                    required_fields.append(var['name'])
                else:
                    optional_fields.append(var['name'])
            
            template_data = {
                'key': template['name'].lower().replace(' ', '_'),
                'name': template['name'],
                'description': template['description'],
                'tone_options': ['Professional', 'Casual', 'Friendly', 'Authoritative'],
                'length_options': ['Short', 'Medium', 'Long'],
                'required_fields': required_fields,
                'optional_fields': optional_fields,
                'formatting_guidelines': template.get('template_content', ''),
                'category': template.get('category', 'general'),
                'tags': template.get('tags', [])
            }
            templates_list.append(template_data)
        
        return jsonify({'success': True, 'templates': templates_list})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/generate/multiple', methods=['POST'])
def generate_multiple_content():
    """Generate multiple content types simultaneously"""
    try:
        data = request.get_json()
        
        # Extract content requests
        content_requests = data.get('content_requests', [])
        user_id = data.get('user_id', 'default_user')
        
        if not content_requests:
            return jsonify({'success': False, 'error': 'No content requests provided'}), 400
        
        # Validate each request
        for i, request in enumerate(content_requests):
            if 'template_key' not in request:
                return jsonify({'success': False, 'error': f'Request {i}: template_key is required'}), 400
            if 'user_prompt' not in request:
                return jsonify({'success': False, 'error': f'Request {i}: user_prompt is required'}), 400
        
        # Generate multiple content using enhanced engine
        results = openrouter_client.generate_multiple_content_types(content_requests)
        
        # Save successful results to history
        saved_entries = []
        for result in results:
            if result.get('success'):
                history_entry = history_manager.add_entry(
                    content=result['content'],
                    content_type=result['template_key'],
                    template_key=result['template_key'],
                    parameters=result.get('template_params', {}),
                    user_id=user_id,
                    model_used=openrouter_client.model
                )
                saved_entries.append(history_entry.content_id)
        
        # Generate batch statistics
        from multi_content_engine import MultiContentGenerator
        generator = MultiContentGenerator(openrouter_client)
        batch_stats = generator.get_content_statistics(results)
        
        return jsonify({
            'success': True,
            'results': results,
            'batch_statistics': batch_stats,
            'saved_entries': saved_entries,
            'model': openrouter_client.model
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/validate', methods=['POST'])
def validate_content():
    """Validate content against type-specific requirements"""
    try:
        data = request.get_json()
        
        content = data.get('content', '')
        content_type = data.get('content_type', '')
        parameters = data.get('parameters', {})
        
        if not content:
            return jsonify({'success': False, 'error': 'Content is required'}), 400
        
        if not content_type:
            return jsonify({'success': False, 'error': 'Content type is required'}), 400
        
        # Validate using enhanced validator
        from multi_content_engine import ContentValidator
        validator = ContentValidator()
        
        is_valid, messages = validator.validate_content(content, content_type, parameters)
        
        return jsonify({
            'success': True,
            'validation': {
                'is_valid': is_valid,
                'messages': messages
            },
            'content_type': content_type,
            'word_count': len(content.split()),
            'char_count': len(content)
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/post-process', methods=['POST'])
def post_process_content():
    """Apply post-processing to existing content"""
    try:
        data = request.get_json()
        
        content = data.get('content', '')
        content_type = data.get('content_type', '')
        parameters = data.get('parameters', {})
        
        if not content:
            return jsonify({'success': False, 'error': 'Content is required'}), 400
        
        if not content_type:
            return jsonify({'success': False, 'error': 'Content type is required'}), 400
        
        # Apply post-processing
        from multi_content_engine import MultiContentGenerator
        generator = MultiContentGenerator(openrouter_client)
        
        processed_content = generator._post_process_content(content_type, content, parameters)
        
        # Validate processed content
        is_valid, validation_messages = generator.validator.validate_content(
            processed_content, content_type, parameters
        )
        
        # Calculate quality score
        quality_score = generator._calculate_quality_score(processed_content, content_type, parameters)
        
        return jsonify({
            'success': True,
            'original_content': content,
            'processed_content': processed_content,
            'validation': {
                'is_valid': is_valid,
                'messages': validation_messages
            },
            'quality_score': quality_score,
            'processing_applied': processed_content != content
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/content-types', methods=['GET'])
def get_supported_content_types():
    """Get list of supported content types with their requirements"""
    try:
        from multi_content_engine import ContentType
        
        content_types = {}
        
        for content_type in ContentType:
            # Get template info
            template = get_template_by_key(content_type.value)
            
            if template:
                content_types[content_type.value] = {
                    'name': template['name'],
                    'description': template['description'],
                    'tone_options': ['Professional', 'Casual', 'Friendly', 'Authoritative'],
                    'length_options': ['Short', 'Medium', 'Long'],
                    'required_fields': template['required_fields'],
                    'optional_fields': template['optional_fields'],
                    'formatting_guidelines': template['template_content'],
                    'post_processing_available': True,
                    'validation_available': True
                }
        
        return jsonify({
            'success': True,
            'content_types': content_types,
            'total_types': len(content_types)
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/test-template/<template_key>', methods=['GET'])
def test_template_lookup(template_key):
    """Test endpoint to debug template lookup"""
    try:
        print(f"Testing template lookup for: {template_key}")
        template = get_template_by_key(template_key)
        if template:
            return jsonify({
                'success': True,
                'template_found': True,
                'template_name': template['name'],
                'template_key': template_key
            })
        else:
            return jsonify({
                'success': True,
                'template_found': False,
                'template_key': template_key,
                'message': f'Template {template_key} not found'
            })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/generate', methods=['POST'])
def generate_content():
    """Generate content using enhanced multi-content engine with post-processing and validation"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400
        
        # Extract parameters
        template_key = data.get('template_key', 'blog_post')
        user_prompt = data.get('user_prompt', data.get('prompt', ''))
        template_params = data.get('parameters', {})
        user_id = data.get('user_id', 'default_user')
        
        # Validate required parameters
        if not user_prompt or not user_prompt.strip():
            return jsonify({
                'success': False,
                'error': 'user_prompt is required and cannot be empty'
            }), 400
        
        # Extract model selection parameters
        selected_model = data.get('selected_model')
        content_mode = data.get('content_mode', 'default')
        
        # Add model selection to template params if provided
        if selected_model:
            template_params['selected_model'] = selected_model
        if content_mode:
            template_params['content_mode'] = content_mode
        
        # Check if user is authenticated
        auth_header = request.headers.get('Authorization', '')
        authenticated_user = None
        preferred_language = 'english'  # Default language
        
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            authenticated_user = auth_manager.get_user_from_token(token)
            if authenticated_user:
                user_id = authenticated_user['user_id']
                
                # Get user's preferred content generation language
                preferred_language = authenticated_user.get('preferences', {}).get('content_generation_language', 'english')
                
                # Check usage limits for authenticated users
                usage_check = auth_manager.check_usage_limits(user_id)
                if not usage_check['allowed']:
                    return jsonify({
                        'success': False,
                        'error': usage_check['reason'],
                        'usage_info': usage_check
                    }), 429  # Too Many Requests
        
        # Get the template to check required fields
        template = get_template_by_key(template_key)
        if not template:
            return jsonify({'success': False, 'error': f'Template {template_key} not found'}), 400
        
        # Ensure all required fields have values
        for field in template['required_fields']:
            if field not in template_params or not template_params[field]:
                # Provide default values for common required fields
                if field == 'target_audience':
                    template_params[field] = 'general audience'
                elif field == 'topic':
                    template_params[field] = user_prompt.split('.')[0][:50]  # First sentence or 50 chars
                elif field == 'key_message':
                    template_params[field] = 'Main message from the content'
                elif field == 'subject_line':
                    template_params[field] = f'Subject: {user_prompt[:30]}...'
                elif field == 'main_offer':
                    template_params[field] = 'Special offer or value proposition'
                elif field == 'product_service':
                    template_params[field] = 'Product or service'
                elif field == 'main_benefit':
                    template_params[field] = 'Key benefit or advantage'
                elif field == 'blog_topic':
                    template_params[field] = user_prompt.split('.')[0][:50]
                elif field == 'main_points':
                    template_params[field] = 'Key points to cover in the content'
                elif field == 'product_name':
                    template_params[field] = 'Product Name'
                elif field == 'key_features':
                    template_params[field] = 'Key features and benefits'
                elif field == 'target_customer':
                    template_params[field] = 'Target customer segment'
                elif field == 'announcement':
                    template_params[field] = user_prompt[:100]
                elif field == 'company_name':
                    template_params[field] = 'Company Name'
                elif field == 'key_details':
                    template_params[field] = 'Important details and information'
                elif field == 'platform':
                    template_params[field] = 'Social Media Platform'
                elif field == 'content_theme':
                    template_params[field] = user_prompt[:50]
                elif field == 'main_message':
                    template_params[field] = user_prompt[:100]
                else:
                    template_params[field] = f'Default {field.replace("_", " ")}'
        
        # Ensure basic parameters have defaults
        if 'tone' not in template_params:
            template_params['tone'] = 'Professional'
        if 'length' not in template_params:
            template_params['length'] = 'Medium (200-400 words)'
        
        # Add language instruction to template parameters
        template_params['content_language'] = preferred_language
        
        # Use enhanced multi-content generator
        from multi_content_engine import MultiContentGenerator
        generator = MultiContentGenerator(openrouter_client)
        
        # Generate single content with enhanced processing
        result = generator.generate_single_content(template_key, user_prompt, template_params)
        
        if not result['success']:
            return jsonify({
                'success': False,
                'error': result.get('error', 'Content generation failed')
            }), 500
        
        # Save to history
        history_entry = history_manager.add_entry(
            content=result['content'],
            content_type=template_key,
            template_key=template_key,
            parameters=template_params,
            user_id=user_id,
            model_used=openrouter_client.model
        )
        
        # Update usage stats for authenticated users
        if authenticated_user:
            word_count = len(result['content'].split())
            auth_manager.update_user_stats(user_id, {
                'content_generated': 1,
                'total_words_generated': word_count
            })
        
        # Get model information for response - prioritize user selection
        model_info = {}
        actual_model_used = result.get('model_used', openrouter_client.model)
        actual_model_name = result.get('model_name', 'Unknown')
        
        if selected_model and selected_model in multi_model_manager.models:
            # Specific model selected
            model_config = multi_model_manager.models[selected_model]
            model_info = {
                'model_id': selected_model,
                'model_name': model_config.name,
                'mode': content_mode,
                'selection_type': 'specific'
            }
            actual_model_used = selected_model
            actual_model_name = model_config.name
        elif content_mode and content_mode != 'default':
            # Mode-based selection - prioritize this over result model info
            mode_model = multi_model_manager.get_model_for_mode(
                getattr(ContentMode, content_mode.upper(), ContentMode.DEFAULT)
            )
            if mode_model in multi_model_manager.models:
                model_config = multi_model_manager.models[mode_model]
                model_info = {
                    'model_id': mode_model,
                    'model_name': model_config.name,
                    'mode': content_mode,
                    'selection_type': 'mode'
                }
                actual_model_used = mode_model
                actual_model_name = model_config.name
            else:
                # Fallback if mode model not found
                model_info = {
                    'model_id': actual_model_used,
                    'model_name': actual_model_name,
                    'mode': content_mode,
                    'selection_type': 'fallback'
                }
        else:
            # Use default model info
            model_info = {
                'model_id': actual_model_used,
                'model_name': actual_model_name,
                'mode': 'default',
                'selection_type': 'default'
            }
        
        return jsonify({
            'success': True,
            'content': result['content'],
            'template_used': template_key,
            'model': actual_model_name,  # Use the actual model name instead of ID
            'model_info': model_info,
            'validation': result['validation'],
            'quality_score': result.get('quality_score', 0),
            'word_count': result.get('word_count', 0),
            'processing_applied': result.get('processing_applied', False),
            'enhanced_prompt_used': True,
            'user_authenticated': authenticated_user is not None
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/history/<user_id>', methods=['GET'])
def get_content_history(user_id):
    """Get content generation history for a user"""
    try:
        limit = int(request.args.get('limit', 50))
        
        entries = history_manager.get_all_entries(user_id)
        
        # Convert entries to dictionaries and limit results
        history_list = []
        for entry in entries[:limit]:
            history_item = {
                'id': entry.content_id,
                'content': entry.content,
                'template_used': entry.template_key,
                'parameters': entry.parameters,
                'timestamp': entry.timestamp,
                'model': entry.model_used,
                'word_count': entry.word_count
            }
            history_list.append(history_item)
        
        return jsonify({
            'success': True,
            'history': history_list,
            'total': len(history_list)
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/auth/history', methods=['GET'])
def get_authenticated_user_history():
    """Get content history for authenticated user"""
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'error': 'Authorization token required'
            }), 401
        
        token = auth_header.split(' ')[1]
        user = auth_manager.get_user_from_token(token)
        
        if not user:
            return jsonify({
                'success': False,
                'error': 'Invalid or expired token'
            }), 401
        
        limit = int(request.args.get('limit', 50))
        user_id = user['user_id']
        
        entries = history_manager.get_all_entries(user_id)
        
        # Convert entries to dictionaries and limit results
        history_list = []
        for entry in entries[:limit]:
            history_item = {
                'id': entry.content_id,
                'content': entry.content,
                'template_used': entry.template_key,
                'parameters': entry.parameters,
                'timestamp': entry.timestamp,
                'model': entry.model_used,
                'word_count': entry.word_count
            }
            history_list.append(history_item)
        
        return jsonify({
            'success': True,
            'history': history_list,
            'total': len(history_list),
            'user_id': user_id
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/statistics/<user_id>', methods=['GET'])
def get_user_statistics(user_id):
    """Get analytics and statistics for a user"""
    try:
        # Get statistics from history manager
        stats = history_manager.get_statistics(user_id)
        
        return jsonify({
            'success': True,
            'statistics': stats
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/auth/statistics', methods=['GET'])
def get_authenticated_user_statistics():
    """Get statistics for authenticated user"""
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'error': 'Authorization token required'
            }), 401
        
        token = auth_header.split(' ')[1]
        user = auth_manager.get_user_from_token(token)
        
        if not user:
            return jsonify({
                'success': False,
                'error': 'Invalid or expired token'
            }), 401
        
        user_id = user['user_id']
        
        # Get statistics from history manager
        stats = history_manager.get_statistics(user_id)
        
        return jsonify({
            'success': True,
            'statistics': stats,
            'user_id': user_id
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/profile/<user_id>', methods=['GET'])
def get_user_profile_by_id(user_id):
    """Get user profile by ID"""
    try:
        profile = profile_manager.get_user_profile(user_id)
        
        return jsonify({
            'success': True,
            'profile': {
                'user_id': profile.get('user_id', user_id),
                'preferences': profile.get('preferences', {}),
                'created_at': profile.get('created_at', ''),
                'updated_at': profile.get('updated_at', ''),
                'version': profile.get('version', '1.0')
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/history/<entry_id>', methods=['DELETE'])
@require_auth
def delete_history_entry(entry_id):
    """Delete a specific history entry"""
    try:
        # Get authenticated user
        auth_header = request.headers.get('Authorization', '')
        token = auth_header.split(' ')[1]
        user = auth_manager.get_user_from_token(token)
        user_id = user['user_id']
        
        print(f"DEBUG: Deleting history entry {entry_id} for user {user_id}")
        
        success = history_manager.delete_entry(entry_id, user_id)
        
        if success:
            return jsonify({'success': True, 'message': 'Entry deleted'})
        else:
            return jsonify({'success': False, 'error': 'Entry not found or access denied'}), 404
            
    except Exception as e:
        print(f"DEBUG: Error deleting history entry: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/history/clear', methods=['POST'])
def clear_history():
    """Clear all history for a user"""
    try:
        data = request.get_json()
        user_id = data.get('user_id', 'default_user')
        
        history_manager.clear_history(user_id)
        
        return jsonify({'success': True, 'message': 'History cleared'})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    """Get analytics and statistics for a user"""
    try:
        user_id = request.args.get('user_id', 'default_user')
        
        # Get statistics from history manager
        stats = history_manager.get_user_statistics(user_id)
        
        return jsonify({
            'success': True,
            'statistics': stats
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/profile', methods=['GET'])
def get_user_profile():
    """Get user profile"""
    try:
        user_id = request.args.get('user_id', 'default_user')
        profile = profile_manager.get_user_profile(user_id)
        
        return jsonify({
            'success': True,
            'profile': {
                'user_id': profile.get('user_id', user_id),
                'preferences': profile.get('preferences', {}),
                'created_at': profile.get('created_at', ''),
                'updated_at': profile.get('updated_at', ''),
                'version': profile.get('version', '1.0')
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/profile', methods=['POST'])
def update_user_profile():
    """Update user profile"""
    try:
        data = request.get_json()
        user_id = data.get('user_id', 'default_user')
        
        # Update profile
        updates = {}
        if 'display_name' in data:
            updates['display_name'] = data['display_name']
        if 'role' in data:
            updates['role'] = data['role']
        if 'preferences' in data:
            updates['preferences'] = data['preferences']
        
        profile_manager.update_user_profile(user_id, updates)
        
        # Get updated profile
        profile = profile_manager.get_user_profile(user_id)
        
        return jsonify({
            'success': True,
            'profile': {
                'user_id': profile.get('user_id', user_id),
                'preferences': profile.get('preferences', {}),
                'created_at': profile.get('created_at', ''),
                'updated_at': profile.get('updated_at', ''),
                'version': profile.get('version', '1.0')
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/export/<user_id>', methods=['GET'])
@require_auth
def export_history(user_id):
    """Export content history in various formats"""
    try:
        # Verify user can access this data
        current_user = request.current_user
        if current_user['user_id'] != user_id:
            return jsonify({'success': False, 'error': 'Unauthorized access'}), 403
            
        format_type = request.args.get('format', 'json').lower()
        
        # Get user's content history
        entries = history_manager.get_all_entries(user_id)
        
        if not entries:
            return jsonify({
                'success': False,
                'error': 'No content history found for this user'
            }), 404
        
        if format_type == 'json':
            # Export as JSON
            export_data = []
            for entry in entries:
                export_data.append({
                    'id': entry.content_id,
                    'timestamp': entry.timestamp,
                    'content_type': entry.content_type,
                    'template_key': entry.template_key,
                    'content': entry.content,
                    'parameters': entry.parameters,
                    'word_count': entry.word_count,
                    'model_used': entry.model_used,
                    'favorite': entry.favorite,
                    'version': entry.version
                })
            
            return jsonify({
                'success': True,
                'data': export_data,
                'total_entries': len(export_data),
                'export_format': 'json',
                'exported_at': datetime.now().isoformat()
            })
        
        elif format_type == 'csv':
            # Export as CSV
            csv_data = history_manager.export_to_csv(user_id, entries)
            
            return jsonify({
                'success': True,
                'data': csv_data,
                'total_entries': len(entries),
                'export_format': 'csv',
                'exported_at': datetime.now().isoformat()
            })
        
        elif format_type == 'pdf':
            # Export as PDF using content history manager
            pdf_result = history_manager.export_to_pdf(user_id, entries)
            
            if pdf_result.endswith('.pdf'):
                # PDF created successfully
                import base64
                
                # Read the PDF file and encode it
                try:
                    with open(pdf_result, 'rb') as pdf_file:
                        pdf_data = pdf_file.read()
                        pdf_base64 = base64.b64encode(pdf_data).decode('utf-8')
                    
                    # Clean up the temporary file
                    import os
                    if os.path.exists(pdf_result):
                        os.remove(pdf_result)
                    
                    return jsonify({
                        'success': True,
                        'data': pdf_base64,
                        'filename': os.path.basename(pdf_result),
                        'total_entries': len(entries),
                        'export_format': 'pdf',
                        'exported_at': datetime.now().isoformat(),
                        'content_type': 'application/pdf'
                    })
                    
                except Exception as file_error:
                    return jsonify({
                        'success': False,
                        'error': f'Failed to read PDF file: {str(file_error)}'
                    }), 500
            else:
                # PDF creation failed
                return jsonify({
                    'success': False,
                    'error': pdf_result
                }), 500
        
        else:
            return jsonify({
                'success': False,
                'error': f'Unsupported export format: {format_type}. Supported formats: json, csv, pdf'
            }), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/auth/export', methods=['GET'])
@require_auth
def export_user_history():
    """Export authenticated user's content history in various formats"""
    try:
        current_user = request.current_user
        user_id = current_user['user_id']
        
        format_type = request.args.get('format', 'json').lower()
        
        # Get user's content history
        entries = history_manager.get_all_entries(user_id)
        
        if not entries:
            return jsonify({
                'success': False,
                'error': 'No content history found for this user'
            }), 404
        
        if format_type == 'json':
            # Export as JSON
            export_data = []
            for entry in entries:
                export_data.append({
                    'id': entry.content_id,
                    'timestamp': entry.timestamp,
                    'content_type': entry.content_type,
                    'template_key': entry.template_key,
                    'content': entry.content,
                    'parameters': entry.parameters,
                    'word_count': entry.word_count,
                    'model_used': entry.model_used,
                    'favorite': entry.favorite,
                    'version': entry.version
                })
            
            return jsonify({
                'success': True,
                'data': export_data,
                'total_entries': len(export_data),
                'export_format': 'json',
                'exported_at': datetime.now().isoformat()
            })
        
        elif format_type == 'csv':
            # Export as CSV
            csv_data = history_manager.export_to_csv(user_id, entries)
            
            return jsonify({
                'success': True,
                'data': csv_data,
                'total_entries': len(entries),
                'export_format': 'csv',
                'exported_at': datetime.now().isoformat()
            })
        
        elif format_type == 'pdf':
            # Export as PDF using content history manager
            pdf_result = history_manager.export_to_pdf(user_id, entries)
            
            if pdf_result.endswith('.pdf'):
                # PDF created successfully
                import base64
                
                # Read the PDF file and encode it
                try:
                    with open(pdf_result, 'rb') as pdf_file:
                        pdf_data = pdf_file.read()
                        pdf_base64 = base64.b64encode(pdf_data).decode('utf-8')
                    
                    # Clean up the temporary file
                    import os
                    if os.path.exists(pdf_result):
                        os.remove(pdf_result)
                    
                    return jsonify({
                        'success': True,
                        'data': pdf_base64,
                        'filename': os.path.basename(pdf_result),
                        'total_entries': len(entries),
                        'export_format': 'pdf',
                        'exported_at': datetime.now().isoformat(),
                        'content_type': 'application/pdf'
                    })
                    
                except Exception as file_error:
                    return jsonify({
                        'success': False,
                        'error': f'Failed to read PDF file: {str(file_error)}'
                    }), 500
            else:
                # PDF creation failed
                return jsonify({
                    'success': False,
                    'error': pdf_result
                }), 500
        
        else:
            return jsonify({
                'success': False,
                'error': f'Unsupported export format: {format_type}. Supported formats: json, csv, pdf'
            }), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/export/pdf', methods=['POST'])
def export_to_pdf():
    """Export content to PDF"""
    try:
        from pdf_export import PDFExporter
        
        data = request.get_json()
        content = data.get('content', '')
        title = data.get('title', 'Generated Content')
        
        exporter = PDFExporter()
        pdf_path = exporter.export_content(content, title)
        
        return jsonify({
            'success': True,
            'pdf_path': pdf_path,
            'message': 'PDF exported successfully'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Enhanced Profile Management Endpoints

@app.route('/api/profile/create', methods=['POST'])
def create_user_profile():
    """Create a new user profile with preferences"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        profile_data = data.get('profile_data', {})
        
        if not user_id:
            return jsonify({'success': False, 'error': 'user_id is required'}), 400
        
        # Create profile using enhanced manager
        profile = profile_manager.create_user_profile(user_id, profile_data)
        
        return jsonify({
            'success': True,
            'profile': profile,
            'message': 'Profile created successfully'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/profile/<user_id>/preferences', methods=['GET'])
def get_user_preferences(user_id):
    """Get user preferences for content generation"""
    try:
        preferences = profile_manager.get_user_preferences(user_id)
        
        return jsonify({
            'success': True,
            'preferences': preferences,
            'user_id': user_id
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/profile/<user_id>/preferences', methods=['PUT'])
def update_user_preferences(user_id):
    """Update user preferences"""
    try:
        data = request.get_json()
        preferences = data.get('preferences', {})
        
        success = profile_manager.update_user_preferences(user_id, preferences)
        
        if success:
            updated_preferences = profile_manager.get_user_preferences(user_id)
            return jsonify({
                'success': True,
                'preferences': updated_preferences,
                'message': 'Preferences updated successfully'
            })
        else:
            return jsonify({'success': False, 'error': 'Failed to update preferences'}), 500
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/profile/<user_id>/delete', methods=['DELETE'])
def delete_user_profile_endpoint(user_id):
    """Delete user profile and all associated data"""
    try:
        success = profile_manager.delete_user_profile(user_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Profile deleted successfully'
            })
        else:
            return jsonify({'success': False, 'error': 'Profile not found or deletion failed'}), 404
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/profiles', methods=['GET'])
def get_all_user_profiles():
    """Get list of all user profiles (admin endpoint)"""
    try:
        users = profile_manager.get_all_users()
        
        return jsonify({
            'success': True,
            'users': users,
            'total': len(users)
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/profile/<user_id>/analytics', methods=['GET'])
def get_user_profile_analytics(user_id):
    """Get analytics data for user profile"""
    try:
        # Try MongoDB analytics first
        from database import db_manager
        
        if db_manager.is_connected():
            analytics = db_manager.get_user_analytics(user_id)
        else:
            # Fallback to history manager
            analytics = history_manager.get_user_statistics(user_id)
        
        return jsonify({
            'success': True,
            'analytics': analytics,
            'user_id': user_id
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/profile/<user_id>/apply-preferences', methods=['POST'])
def apply_user_preferences_to_parameters(user_id):
    """Apply user preferences to content generation parameters"""
    try:
        data = request.get_json()
        parameters = data.get('parameters', {})
        
        enhanced_parameters = profile_manager.apply_preferences_to_parameters(user_id, parameters)
        
        return jsonify({
            'success': True,
            'original_parameters': parameters,
            'enhanced_parameters': enhanced_parameters,
            'preferences_applied': True
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/database/status', methods=['GET'])
def get_database_status():
    """Get database connection status"""
    try:
        from database import db_manager
        
        is_connected = db_manager.is_connected()
        
        return jsonify({
            'success': True,
            'database_connected': is_connected,
            'storage_type': 'MongoDB Atlas' if is_connected else 'Local JSON',
            'fallback_available': True
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Content Quality Analysis Endpoints

@app.route('/api/analyze/quality', methods=['POST'])
def analyze_content_quality():
    """Analyze content quality with comprehensive metrics"""
    try:
        data = request.get_json()
        
        content = data.get('content', '')
        content_type = data.get('content_type', 'general')
        
        if not content or not content.strip():
            return jsonify({
                'success': False,
                'error': 'Content is required for analysis'
            }), 400
        
        # Perform quality analysis
        analysis = quality_analyzer.analyze_content(content, content_type)
        
        return jsonify({
            'success': True,
            'analysis': analysis,
            'analyzed_at': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/analyze/readability', methods=['POST'])
def analyze_readability():
    """Analyze content readability metrics"""
    try:
        data = request.get_json()
        content = data.get('content', '')
        
        if not content:
            return jsonify({'success': False, 'error': 'Content is required'}), 400
        
        # Get readability analysis
        analysis = quality_analyzer.analyze_content(content)
        readability = analysis['readability']
        
        return jsonify({
            'success': True,
            'readability': readability,
            'recommendations': [
                suggestion for suggestion in analysis['suggestions']
                if suggestion['category'] == 'readability'
            ]
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/analyze/sentiment', methods=['POST'])
def analyze_sentiment():
    """Analyze content sentiment"""
    try:
        data = request.get_json()
        content = data.get('content', '')
        
        if not content:
            return jsonify({'success': False, 'error': 'Content is required'}), 400
        
        # Get sentiment analysis
        analysis = quality_analyzer.analyze_content(content)
        sentiment = analysis['sentiment']
        
        return jsonify({
            'success': True,
            'sentiment': sentiment,
            'recommendations': [
                suggestion for suggestion in analysis['suggestions']
                if suggestion['category'] == 'tone'
            ]
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/analyze/engagement', methods=['POST'])
def analyze_engagement_potential():
    """Analyze content engagement potential"""
    try:
        data = request.get_json()
        content = data.get('content', '')
        content_type = data.get('content_type', 'general')
        
        if not content:
            return jsonify({'success': False, 'error': 'Content is required'}), 400
        
        # Get engagement analysis
        analysis = quality_analyzer.analyze_content(content, content_type)
        engagement = analysis['engagement_potential']
        
        return jsonify({
            'success': True,
            'engagement': engagement,
            'recommendations': [
                suggestion for suggestion in analysis['suggestions']
                if suggestion['category'] == 'engagement'
            ]
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/analyze/keywords', methods=['POST'])
def analyze_keyword_density():
    """Analyze keyword density and vocabulary"""
    try:
        data = request.get_json()
        content = data.get('content', '')
        
        if not content:
            return jsonify({'success': False, 'error': 'Content is required'}), 400
        
        # Get keyword analysis
        analysis = quality_analyzer.analyze_content(content)
        keywords = analysis['keyword_density']
        
        return jsonify({
            'success': True,
            'keywords': keywords,
            'recommendations': [
                suggestion for suggestion in analysis['suggestions']
                if suggestion['category'] == 'vocabulary'
            ]
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/analyze/structure', methods=['POST'])
def analyze_content_structure():
    """Analyze content structure and formatting"""
    try:
        data = request.get_json()
        content = data.get('content', '')
        
        if not content:
            return jsonify({'success': False, 'error': 'Content is required'}), 400
        
        # Get structure analysis
        analysis = quality_analyzer.analyze_content(content)
        structure = analysis['structure_analysis']
        
        return jsonify({
            'success': True,
            'structure': structure,
            'recommendations': [
                suggestion for suggestion in analysis['suggestions']
                if suggestion['category'] == 'structure'
            ]
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/analyze/batch', methods=['POST'])
def analyze_multiple_content():
    """Analyze multiple content pieces for quality comparison"""
    try:
        data = request.get_json()
        content_list = data.get('content_list', [])
        
        if not content_list:
            return jsonify({'success': False, 'error': 'Content list is required'}), 400
        
        results = []
        for i, content_item in enumerate(content_list):
            content = content_item.get('content', '')
            content_type = content_item.get('content_type', 'general')
            content_id = content_item.get('id', f'content_{i}')
            
            if content:
                analysis = quality_analyzer.analyze_content(content, content_type)
                results.append({
                    'id': content_id,
                    'analysis': analysis
                })
        
        # Calculate comparative metrics
        if results:
            scores = [r['analysis']['overall_score'] for r in results]
            avg_score = sum(scores) / len(scores)
            best_content = max(results, key=lambda x: x['analysis']['overall_score'])
            worst_content = min(results, key=lambda x: x['analysis']['overall_score'])
            
            comparison = {
                'average_score': round(avg_score, 1),
                'best_content_id': best_content['id'],
                'best_score': best_content['analysis']['overall_score'],
                'worst_content_id': worst_content['id'],
                'worst_score': worst_content['analysis']['overall_score'],
                'score_range': max(scores) - min(scores)
            }
        else:
            comparison = {}
        
        return jsonify({
            'success': True,
            'results': results,
            'comparison': comparison,
            'total_analyzed': len(results)
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/analyze/suggestions', methods=['POST'])
def get_improvement_suggestions():
    """Get actionable suggestions for content improvement"""
    try:
        data = request.get_json()
        content = data.get('content', '')
        content_type = data.get('content_type', 'general')
        priority_filter = data.get('priority', None)  # 'high', 'medium', 'low'
        
        if not content:
            return jsonify({'success': False, 'error': 'Content is required'}), 400
        
        # Get full analysis
        analysis = quality_analyzer.analyze_content(content, content_type)
        suggestions = analysis['suggestions']
        
        # Filter by priority if specified
        if priority_filter:
            suggestions = [s for s in suggestions if s['priority'] == priority_filter]
        
        # Group suggestions by category
        grouped_suggestions = {}
        for suggestion in suggestions:
            category = suggestion['category']
            if category not in grouped_suggestions:
                grouped_suggestions[category] = []
            grouped_suggestions[category].append(suggestion)
        
        return jsonify({
            'success': True,
            'suggestions': suggestions,
            'grouped_suggestions': grouped_suggestions,
            'total_suggestions': len(suggestions),
            'overall_score': analysis['overall_score'],
            'priority_counts': {
                'high': len([s for s in suggestions if s['priority'] == 'high']),
                'medium': len([s for s in suggestions if s['priority'] == 'medium']),
                'low': len([s for s in suggestions if s['priority'] == 'low'])
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/analyze/history/<user_id>', methods=['GET'])
def analyze_user_content_history():
    """Analyze quality trends in user's content history"""
    try:
        limit = int(request.args.get('limit', 20))
        
        # Get user's recent content
        entries = history_manager.get_all_entries(user_id)[:limit]
        
        if not entries:
            return jsonify({
                'success': False,
                'error': 'No content history found for analysis'
            }), 404
        
        # Analyze each entry
        analyses = []
        for entry in entries:
            analysis = quality_analyzer.analyze_content(entry.content, entry.content_type)
            analyses.append({
                'content_id': entry.content_id,
                'timestamp': entry.timestamp,
                'content_type': entry.content_type,
                'overall_score': analysis['overall_score'],
                'readability_score': analysis['readability']['score'],
                'engagement_score': analysis['engagement_potential']['score'],
                'sentiment_polarity': analysis['sentiment']['polarity'],
                'word_count': analysis['word_count']
            })
        
        # Calculate trends
        if len(analyses) > 1:
            scores = [a['overall_score'] for a in analyses]
            trend = {
                'average_score': sum(scores) / len(scores),
                'score_trend': 'improving' if scores[-1] > scores[0] else 'declining' if scores[-1] < scores[0] else 'stable',
                'best_score': max(scores),
                'worst_score': min(scores),
                'consistency': 100 - (max(scores) - min(scores))  # Higher is more consistent
            }
        else:
            trend = {'message': 'Need more content for trend analysis'}
        
        return jsonify({
            'success': True,
            'analyses': analyses,
            'trend': trend,
            'total_analyzed': len(analyses)
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ============================================================================
# MULTI-MODEL MANAGEMENT ENDPOINTS
# ============================================================================

@app.route('/api/models/available', methods=['GET'])
def get_available_models():
    """Get all available models with their information"""
    try:
        models = multi_model_manager.get_available_models()
        return jsonify({
            'success': True,
            'models': models
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/models/recommendations', methods=['POST'])
def get_model_recommendations():
    """Get model recommendations based on content type and user preferences"""
    try:
        data = request.get_json()
        content_type = data.get('content_type', 'general')
        user_preferences = data.get('user_preferences', {})
        
        recommendations = multi_model_manager.get_model_recommendations(
            content_type, user_preferences
        )
        
        return jsonify({
            'success': True,
            'recommendations': recommendations
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/models/health', methods=['GET'])
def get_model_health():
    """Get health status of all models"""
    try:
        health_status = multi_model_manager.get_model_health_status()
        return jsonify({
            'success': True,
            'health_status': health_status
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/models/modes', methods=['GET'])
def get_content_modes():
    """Get available content modes and their descriptions"""
    try:
        modes = {
            'default': {
                'name': 'Default / Fast Mode',
                'model': 'GPT-OSS 20B',
                'description': 'Fast, efficient generation for general content',
                'strengths': ['Speed', 'Cost Effective', 'Reliable'],
                'best_for': ['Quick drafts', 'General content', 'High volume'],
                'icon': '⚡'
            },
            'high_quality': {
                'name': 'High Quality Mode',
                'model': 'Llama 3.3 70B',
                'description': 'Premium quality for professional content',
                'strengths': ['High Quality', 'Detailed', 'Professional'],
                'best_for': ['Blog posts', 'Articles', 'Professional content'],
                'icon': '💎'
            },
            'structured': {
                'name': 'Structured / Tech Mode',
                'model': 'Gemma 2 27B IT',
                'description': 'Optimized for technical and structured content',
                'strengths': ['Technical Writing', 'Structure', 'Analysis'],
                'best_for': ['Documentation', 'Technical content', 'Reports'],
                'icon': '🔧'
            },
            'creative': {
                'name': 'Creative Mode',
                'model': 'Hermes 3 Llama 405B',
                'description': 'Ultra-creative for innovative content',
                'strengths': ['Creativity', 'Storytelling', 'Innovation'],
                'best_for': ['Marketing copy', 'Creative writing', 'Campaigns'],
                'icon': '🎨'
            }
        }
        
        return jsonify({
            'success': True,
            'modes': modes
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/content/generate-with-model', methods=['POST'])
def generate_content_with_specific_model():
    """Generate content using a specific model"""
    try:
        data = request.get_json()
        
        # Required parameters
        template_key = data.get('template_key')
        user_prompt = data.get('user_prompt')
        
        if not template_key or not user_prompt:
            return jsonify({
                'success': False,
                'error': 'template_key and user_prompt are required'
            }), 400
        
        # Optional parameters
        selected_model = data.get('selected_model')
        content_mode = data.get('content_mode', 'default')
        template_params = data.get('template_params', {})
        
        # Add model selection to template params
        if selected_model:
            template_params['selected_model'] = selected_model
        
        # Generate content
        content = client.generate_content_with_template(
            template_key, user_prompt, **template_params
        )
        
        # Get model info for response
        model_info = {}
        if selected_model and selected_model in multi_model_manager.models:
            model_config = multi_model_manager.models[selected_model]
            model_info = {
                'model_id': selected_model,
                'model_name': model_config.name,
                'mode': content_mode
            }
        
        return jsonify({
            'success': True,
            'content': content,
            'model_info': model_info,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/content/generate-by-mode', methods=['POST'])
def generate_content_by_mode():
    """Generate content using mode-based model selection"""
    try:
        data = request.get_json()
        
        # Required parameters
        template_key = data.get('template_key')
        user_prompt = data.get('user_prompt')
        content_mode = data.get('content_mode', 'default')
        
        if not template_key or not user_prompt:
            return jsonify({
                'success': False,
                'error': 'template_key and user_prompt are required'
            }), 400
        
        # Convert string mode to ContentMode enum
        mode_mapping = {
            'default': ContentMode.DEFAULT,
            'high_quality': ContentMode.HIGH_QUALITY,
            'structured': ContentMode.STRUCTURED,
            'creative': ContentMode.CREATIVE
        }
        
        mode_enum = mode_mapping.get(content_mode, ContentMode.DEFAULT)
        template_params = data.get('template_params', {})
        
        # Build system prompt
        system_prompt = f"Generate {content_mode} content for {template_key}"
        
        # Generate content using multi-model manager
        success, content, metadata = multi_model_manager.generate_content_by_mode(
            mode_enum, system_prompt, user_prompt, **template_params
        )
        
        if success:
            return jsonify({
                'success': True,
                'content': content,
                'metadata': metadata,
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({
                'success': False,
                'error': content  # Error message is in content when success=False
            }), 500
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ============================================================================
# BATCH PROCESSING ENDPOINTS
# ============================================================================

@app.route('/api/batch/create', methods=['POST'])
@require_auth
def create_batch_job():
    """Create a new batch processing job"""
    try:
        # Get authenticated user
        auth_header = request.headers.get('Authorization', '')
        token = auth_header.split(' ')[1]
        user = auth_manager.get_user_from_token(token)
        user_id = user['user_id']
        
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400
        
        # Extract parameters
        name = data.get('name', f'Batch Job {datetime.now().strftime("%Y-%m-%d %H:%M")}')
        description = data.get('description', '')
        items = data.get('items', [])
        settings = data.get('settings', {})
        
        # Validate items
        if not items:
            return jsonify({
                'success': False,
                'error': 'No items provided for batch processing'
            }), 400
        
        if len(items) > 100:  # Limit batch size
            return jsonify({
                'success': False,
                'error': 'Batch size limited to 100 items'
            }), 400
        
        # Validate each item
        for i, item in enumerate(items):
            if not item.get('user_prompt', '').strip():
                return jsonify({
                    'success': False,
                    'error': f'Item {i+1}: user_prompt is required'
                }), 400
            
            template_key = item.get('template_key', 'linkedin_professional_post')
            template = get_template_by_key(template_key)
            if not template:
                return jsonify({
                    'success': False,
                    'error': f'Item {i+1}: Invalid template_key "{template_key}"'
                }), 400
        
        # Create batch job
        processor = get_batch_processor()
        job_id = processor.create_batch_job(user_id, name, description, items, settings)
        
        return jsonify({
            'success': True,
            'job_id': job_id,
            'message': f'Batch job created with {len(items)} items'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/batch/upload-csv', methods=['POST'])
def upload_csv_batch():
    """Create batch job from CSV upload"""
    try:
        # Get user ID - try authentication first, fallback to test user
        user_id = 'test_user'
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            try:
                token = auth_header.split(' ')[1]
                user = auth_manager.get_user_from_token(token)
                if user:
                    user_id = user['user_id']
            except Exception as auth_error:
                print(f"Authentication error (using fallback): {auth_error}")
        
        print(f"Processing CSV upload for user: {user_id}")
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No file uploaded'
            }), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'No file selected'
            }), 400
        
        # Read CSV content
        csv_content = file.read().decode('utf-8')
        
        # Get additional parameters
        name = request.form.get('name', f'CSV Batch {datetime.now().strftime("%Y-%m-%d %H:%M")}')
        description = request.form.get('description', f'Batch job from {file.filename}')
        
        # Parse CSV
        processor = get_batch_processor()
        items = processor.parse_csv_input(csv_content)
        
        if not items:
            return jsonify({
                'success': False,
                'error': 'No valid items found in CSV'
            }), 400
        
        # Create batch job
        settings = {
            'source': 'csv_upload',
            'filename': file.filename
        }
        
        job_id = processor.create_batch_job(user_id, name, description, items, settings)
        
        return jsonify({
            'success': True,
            'job_id': job_id,
            'items_count': len(items),
            'message': f'Batch job created from CSV with {len(items)} items'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/batch/jobs', methods=['GET'])
@require_auth
def get_user_batch_jobs():
    """Get all batch jobs for the current user"""
    try:
        # Get authenticated user
        auth_header = request.headers.get('Authorization', '')
        token = auth_header.split(' ')[1]
        user = auth_manager.get_user_from_token(token)
        user_id = user['user_id']
        
        processor = get_batch_processor()
        jobs = processor.get_user_jobs(user_id)
        
        return jsonify({
            'success': True,
            'jobs': jobs
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/batch/job/<job_id>/status', methods=['GET'])
@require_auth
def get_batch_job_status(job_id):
    """Get status of a specific batch job"""
    try:
        # Get authenticated user
        auth_header = request.headers.get('Authorization', '')
        token = auth_header.split(' ')[1]
        user = auth_manager.get_user_from_token(token)
        user_id = user['user_id']
        
        processor = get_batch_processor()
        
        # Verify job belongs to user
        job_doc = processor.db.get_batch_job(job_id, user_id)
        if not job_doc:
            return jsonify({
                'success': False,
                'error': 'Job not found or access denied'
            }), 404
        
        status = processor.get_job_status(job_id)
        
        if not status:
            return jsonify({
                'success': False,
                'error': 'Job not found'
            }), 404
        
        return jsonify({
            'success': True,
            'job': status
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/batch/job/<job_id>/results', methods=['GET'])
@require_auth
def get_batch_job_results(job_id):
    """Get detailed results of a batch job"""
    try:
        # Get authenticated user
        auth_header = request.headers.get('Authorization', '')
        token = auth_header.split(' ')[1]
        user = auth_manager.get_user_from_token(token)
        user_id = user['user_id']
        
        processor = get_batch_processor()
        
        # Verify job belongs to user
        job_doc = processor.db.get_batch_job(job_id, user_id)
        if not job_doc:
            return jsonify({
                'success': False,
                'error': 'Job not found or access denied'
            }), 404
        
        results = processor.get_job_results(job_id)
        
        if not results:
            return jsonify({
                'success': False,
                'error': 'Job not found'
            }), 404
        
        return jsonify({
            'success': True,
            **results
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/batch/job/<job_id>/cancel', methods=['POST'])
@require_auth
def cancel_batch_job(job_id):
    """Cancel a batch job"""
    try:
        # Get authenticated user
        auth_header = request.headers.get('Authorization', '')
        token = auth_header.split(' ')[1]
        user = auth_manager.get_user_from_token(token)
        user_id = user['user_id']
        
        processor = get_batch_processor()
        
        # Verify job belongs to user
        job_doc = processor.db.get_batch_job(job_id, user_id)
        if not job_doc:
            return jsonify({
                'success': False,
                'error': 'Job not found or access denied'
            }), 404
        
        success = processor.cancel_job(job_id)
        
        if not success:
            return jsonify({
                'success': False,
                'error': 'Job not found or cannot be cancelled'
            }), 404
        
        return jsonify({
            'success': True,
            'message': 'Job cancelled successfully'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/batch/job/<job_id>/export', methods=['GET'])
@require_auth
def export_batch_job_results(job_id):
    """Export batch job results as ZIP file"""
    try:
        # Get authenticated user
        auth_header = request.headers.get('Authorization', '')
        token = auth_header.split(' ')[1]
        user = auth_manager.get_user_from_token(token)
        user_id = user['user_id']
        
        processor = get_batch_processor()
        
        # Verify job belongs to user
        job_doc = processor.db.get_batch_job(job_id, user_id)
        if not job_doc:
            return jsonify({
                'success': False,
                'error': 'Job not found or access denied'
            }), 404
        export_format = request.args.get('format', 'json')  # json, txt, csv
        
        if export_format not in ['json', 'txt', 'csv']:
            return jsonify({
                'success': False,
                'error': 'Invalid export format. Use: json, txt, or csv'
            }), 400
        
        processor = get_batch_processor()
        zip_data = processor.export_results_to_zip(job_id, export_format)
        
        if not zip_data:
            return jsonify({
                'success': False,
                'error': 'Job not found or no results to export'
            }), 404
        
        # Get job info for filename
        job_status = processor.get_job_status(job_id)
        filename = f"batch_results_{job_status['name'].replace(' ', '_')}_{job_id[:8]}.zip"
        
        return send_file(
            io.BytesIO(zip_data),
            mimetype='application/zip',
            as_attachment=True,
            download_name=filename
        )
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/batch/templates', methods=['GET'])
def get_batch_templates():
    """Get available templates for batch processing"""
    try:
        from template_library import get_all_templates
        
        # Get templates from the new template library
        templates = get_all_templates()
        
        # Convert to list format suitable for batch processing
        templates_list = []
        for template in templates:
            # Extract required and optional fields from variables
            required_fields = []
            optional_fields = []
            tone_options = []
            length_options = []
            
            for var in template.get('variables', []):
                if var.get('required', False):
                    required_fields.append(var['name'])
                else:
                    optional_fields.append(var['name'])
                
                # Extract tone and length options if available
                if var['name'] == 'tone' and var.get('options'):
                    tone_options = var['options']
                elif var['name'] in ['length', 'word_count', 'duration'] and var.get('options'):
                    length_options = var['options']
            
            template_data = {
                'key': template['name'].lower().replace(' ', '_'),
                'name': template['name'],
                'description': template['description'],
                'required_fields': required_fields,
                'optional_fields': optional_fields,
                'tone_options': tone_options or ['Professional', 'Casual', 'Friendly'],
                'length_options': length_options or ['Short', 'Medium', 'Long'],
                'category': template.get('category', 'general'),
                'template_content': template.get('template_content', ''),
                'variables': template.get('variables', [])
            }
            templates_list.append(template_data)
        
        return jsonify({
            'success': True,
            'templates': templates_list
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ============================================================================
# ADVANCED PROMPT ENGINEERING ENDPOINTS
# ============================================================================

@app.route('/api/seed-templates', methods=['POST'])
def seed_template_library():
    """Seed the database with proven prompt templates (admin only)"""
    try:
        from template_library import get_all_templates
        import uuid
        from datetime import datetime
        
        # Get all templates from library
        templates = get_all_templates()
        
        seeded_count = 0
        system_user_id = "system_templates"
        
        for template_data in templates:
            # Check if template already exists
            existing = db_manager.prompt_templates_collection.find_one({
                "user_id": system_user_id,
                "name": template_data["name"]
            })
            
            if existing:
                continue  # Skip existing templates
            
            # Prepare template data for database
            template_record = {
                "id": str(uuid.uuid4()),
                "user_id": system_user_id,
                "name": template_data["name"],
                "description": template_data["description"],
                "category": template_data["category"],
                "template_content": template_data["template_content"],
                "variables": template_data["variables"],
                "tags": template_data["tags"],
                "is_public": template_data["is_public"],
                "usage_count": template_data.get("usage_count", 0),
                "rating": template_data.get("rating", 0.0),
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            # Insert template into database
            result = db_manager.prompt_templates_collection.insert_one(template_record)
            
            if result.inserted_id:
                seeded_count += 1
        
        return jsonify({
            'success': True,
            'message': f'Seeded {seeded_count} new templates',
            'seeded_count': seeded_count,
            'total_library': len(templates)
        })
        
    except Exception as e:
        print(f"Error seeding templates: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/prompt-categories', methods=['GET'])
def get_prompt_categories():
    """Get available prompt template categories"""
    try:
        categories = get_template_categories()
        return jsonify({
            'success': True,
            'categories': categories
        })
    except Exception as e:
        print(f"Error getting prompt categories: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/template-showcase', methods=['GET'])
def get_template_showcase():
    """Get template showcase data for unauthenticated users"""
    try:
        categories = get_template_categories()
        
        # Get sample templates for showcase (no auth required)
        sample_templates = []
        if db_manager.prompt_templates_collection is not None:
            # Add template counts to categories
            for category in categories:
                if category['value'] != 'custom':
                    # Count templates in this category
                    template_count = db_manager.prompt_templates_collection.count_documents({
                        "user_id": "system_templates",
                        "category": category['value'],
                        "is_public": True
                    })
                    category['template_count'] = template_count
                    
                    # Get sample templates for this category
                    category_templates = list(db_manager.prompt_templates_collection.find({
                        "user_id": "system_templates",
                        "category": category['value'],
                        "is_public": True
                    }).limit(2))
                    
                    # Convert ObjectId to string and clean up data
                    for template in category_templates:
                        template['_id'] = str(template['_id'])
                        # Only include basic info for showcase
                        sample_template = {
                            'id': template.get('id', str(template['_id'])),
                            'name': template['name'],
                            'description': template['description'],
                            'category': template['category'],
                            'variables': template.get('variables', []),
                            'tags': template.get('tags', []),
                            'rating': template.get('rating', 0),
                            'usage_count': template.get('usage_count', 0),
                            'user_id': template.get('user_id')
                        }
                        sample_templates.append(sample_template)
        
        return jsonify({
            'success': True,
            'categories': categories,
            'sample_templates': sample_templates
        })
        
    except Exception as e:
        print(f"Error getting template showcase: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/prompt-templates', methods=['GET'])
@require_auth
def get_prompt_templates():
    """Get prompt templates for authenticated user"""
    try:
        # Get authenticated user
        auth_header = request.headers.get('Authorization', '')
        token = auth_header.split(' ')[1]
        user = auth_manager.get_user_from_token(token)
        user_id = user['user_id']
        
        # Get query parameters
        category = request.args.get('category')
        search = request.args.get('search', '')
        include_public = request.args.get('include_public', 'true').lower() == 'true'
        
        # Build query for MongoDB
        query = {}
        
        if include_public:
            # Include user's own templates and public templates
            query = {
                "$or": [
                    {"user_id": user_id},
                    {"is_public": True}
                ]
            }
        else:
            # Only user's own templates
            query = {"user_id": user_id}
        
        # Add category filter
        if category:
            query["category"] = category
        
        # Add search filter
        if search:
            search_regex = {"$regex": search, "$options": "i"}
            query["$or"] = [
                {"name": search_regex},
                {"description": search_regex},
                {"tags": {"$in": [search_regex]}}
            ]
        
        # Get templates from database
        templates_cursor = db_manager.prompt_templates_collection.find(query).sort("created_at", -1)
        templates = list(templates_cursor)
        
        # Convert to JSON-serializable format
        templates_data = []
        for template in templates:
            template_dict = {
                'id': template.get('id', str(template['_id'])),
                'name': template['name'],
                'description': template['description'],
                'category': template['category'],
                'template_content': template['template_content'],
                'variables': template.get('variables', []),
                'tags': template.get('tags', []),
                'is_public': template.get('is_public', False),
                'is_owner': template['user_id'] == user_id,
                'usage_count': template.get('usage_count', 0),
                'rating': template.get('rating', 0.0),
                'created_at': template.get('created_at', ''),
                'updated_at': template.get('updated_at', ''),
                'user_id': template['user_id']
            }
            templates_data.append(template_dict)
        
        return jsonify({
            'success': True,
            'templates': templates_data
        })
        
    except Exception as e:
        print(f"Error getting prompt templates: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/prompt-templates', methods=['POST'])
@require_auth
def create_prompt_template():
    """Create a new prompt template"""
    try:
        # Get authenticated user
        auth_header = request.headers.get('Authorization', '')
        token = auth_header.split(' ')[1]
        user = auth_manager.get_user_from_token(token)
        user_id = user['user_id']
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'description', 'category', 'template_content', 'variables']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        # Create template document
        template_id = str(uuid.uuid4())
        template_doc = {
            'id': template_id,
            'user_id': user_id,
            'name': data['name'],
            'description': data['description'],
            'category': data['category'],
            'template_content': data['template_content'],
            'variables': data['variables'],
            'tags': data.get('tags', []),
            'is_public': data.get('is_public', False),
            'usage_count': 0,
            'rating': 0.0,
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        # Insert into database
        result = db_manager.prompt_templates_collection.insert_one(template_doc)
        
        if result.inserted_id:
            return jsonify({
                'success': True,
                'template_id': template_id,
                'message': 'Template created successfully'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to create template'
            }), 500
        
    except Exception as e:
        print(f"Error creating prompt template: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/generate/advanced', methods=['POST'])
@require_auth
def generate_content_advanced():
    """Generate content using advanced prompt templates"""
    try:
        print("DEBUG: Advanced generation endpoint called")
        
        # Get authenticated user
        auth_header = request.headers.get('Authorization', '')
        print(f"DEBUG: Auth header present: {bool(auth_header)}")
        
        token = auth_header.split(' ')[1]
        user = auth_manager.get_user_from_token(token)
        user_id = user['user_id']
        
        print(f"DEBUG: User authenticated: {user_id}")
        
        data = request.get_json()
        print(f"DEBUG: Request data keys: {list(data.keys()) if data else 'No data'}")
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400
        
        # Extract parameters
        mode = data.get('mode', 'standard')
        template_id = data.get('template_id')
        ab_test_id = data.get('ab_test_id')
        variables = data.get('variables', {})
        user_prompt = data.get('user_prompt', '')
        parameters = data.get('parameters', {})
        
        print(f"DEBUG: Mode: {mode}, Template ID: {template_id}, User prompt: {user_prompt[:50] if user_prompt else 'None'}...")
        
        # For now, use the existing content generation system
        # This avoids the enhanced_multi_content_engine import issues
        
        if mode == 'standard':
            # Use existing template system
            template_key = parameters.get('template_key', 'linkedin_professional_post')
            
            # Process parameters using parameter engine
            processed_params = parameter_engine.process_parameters(template_key, parameters)
            print(f"DEBUG: Processed parameters: {list(processed_params.keys())}")
            
            # Remove template_key from processed_params to avoid conflict
            processed_params_clean = {k: v for k, v in processed_params.items() if k != 'template_key'}
            
            # Generate content using existing system
            content = openrouter_client.generate_content_with_template(
                template_key, user_prompt, **processed_params_clean
            )
            
            if content and not content.startswith("Error"):
                result = {
                    'success': True,
                    'content': content,
                    'template_key': template_key,
                    'template_name': template_key.replace('_', ' ').title(),
                    'generation_mode': 'standard',
                    'word_count': len(content.split()),
                    'model_used': openrouter_client.model,
                    'parameters_used': processed_params
                }
                
                # Save to history
                history_entry = history_manager.add_entry(
                    content=content,
                    content_type=template_key,
                    template_key=template_key,
                    parameters=processed_params,
                    user_id=user_id,
                    model_used=openrouter_client.model
                )
                
                return jsonify(result)
            else:
                return jsonify({
                    'success': False,
                    'error': content if content else 'No content generated'
                })
        
        elif mode == 'advanced':
            # For advanced mode with custom templates
            if not template_id:
                return jsonify({
                    'success': False,
                    'error': 'Template ID is required for Advanced mode'
                })
            
            # Get the custom template from database
            template = db_manager.prompt_templates_collection.find_one({
                "id": template_id,
                "$or": [
                    {"user_id": user_id},  # User's own templates
                    {"is_public": True}    # Public templates
                ]
            })
            
            if not template:
                return jsonify({
                    'success': False,
                    'error': f'Template not found or access denied: {template_id}'
                })
            
            print(f"DEBUG: Using custom template: {template.get('name')}")
            
            # Process the template content with variables
            template_content = template.get('template_content', '')
            
            # Replace variables in template content
            for var_name, var_value in variables.items():
                placeholder = f"{{{{{var_name}}}}}"
                template_content = template_content.replace(placeholder, str(var_value))
            
            # Add user prompt to the template
            if user_prompt:
                if '{{user_prompt}}' in template_content:
                    template_content = template_content.replace('{{user_prompt}}', user_prompt)
                else:
                    # If no user_prompt placeholder, append it
                    template_content = f"{template_content}\n\nUser Request: {user_prompt}"
            
            # Process parameters using parameter engine
            processed_params = parameter_engine.process_parameters('custom_template', parameters)
            processed_params_clean = {k: v for k, v in processed_params.items() if k != 'template_key'}
            
            print(f"DEBUG: Template content length: {len(template_content)}")
            print(f"DEBUG: Processed parameters: {list(processed_params_clean.keys())}")
            
            # Generate content using the processed template as the prompt
            content = openrouter_client.generate_content(
                template_content,
                content_type="custom_template",
                tone=processed_params_clean.get('tone', 'professional')
            )
            
            if content and not content.startswith("Error"):
                result = {
                    'success': True,
                    'content': content,
                    'template_id': template_id,
                    'template_name': template.get('name', 'Custom Template'),
                    'generation_mode': 'advanced',
                    'word_count': len(content.split()),
                    'model_used': openrouter_client.model,
                    'parameters_used': processed_params_clean,
                    'variables_used': variables
                }
                
                # Save to history
                history_entry = history_manager.add_entry(
                    content=content,
                    content_type='custom_template',
                    template_key=template_id,
                    parameters=processed_params_clean,
                    user_id=user_id,
                    model_used=openrouter_client.model
                )
                
                return jsonify(result)
            else:
                return jsonify({
                    'success': False,
                    'error': content if content else 'No content generated'
                })
        
        elif mode == 'ab_test':
            # For A/B testing mode
            if not ab_test_id:
                return jsonify({
                    'success': False,
                    'error': 'A/B Test ID is required for A/B Test mode'
                })
            
            print(f"DEBUG: Running A/B test: {ab_test_id}")
            
            # Run the A/B test
            result = ab_test_manager.run_ab_test(
                ab_test_id=ab_test_id,
                user_prompt=user_prompt,
                variables=variables,
                parameters=parameters,
                user_id=user_id
            )
            
            return jsonify(result)
        
        else:
            return jsonify({
                'success': False,
                'error': f'Invalid generation mode: {mode}'
            }), 400
        
    except Exception as e:
        print(f"DEBUG: Exception in generate_content_advanced: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/prompt-templates/<template_id>', methods=['PUT'])
@require_auth
def update_prompt_template(template_id):
    """Update an existing prompt template"""
    try:
        # Get authenticated user
        auth_header = request.headers.get('Authorization', '')
        token = auth_header.split(' ')[1]
        user = auth_manager.get_user_from_token(token)
        user_id = user['user_id']
        
        data = request.get_json()
        
        # Check if template exists and user owns it
        template = db_manager.prompt_templates_collection.find_one({
            "id": template_id,
            "user_id": user_id
        })
        
        if not template:
            return jsonify({
                'success': False,
                'error': 'Template not found or access denied'
            }), 404
        
        # Prepare update data
        update_data = {}
        allowed_fields = ['name', 'description', 'category', 'template_content', 'variables', 'tags', 'is_public']
        
        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]
        
        update_data['updated_at'] = datetime.utcnow().isoformat()
        
        # Update template
        result = db_manager.prompt_templates_collection.update_one(
            {"id": template_id, "user_id": user_id},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            return jsonify({
                'success': True,
                'message': 'Template updated successfully'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'No changes made to template'
            }), 400
        
    except Exception as e:
        print(f"Error updating prompt template: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/prompt-templates/<template_id>', methods=['DELETE'])
@require_auth
def delete_prompt_template(template_id):
    """Delete a prompt template"""
    try:
        # Get authenticated user
        auth_header = request.headers.get('Authorization', '')
        token = auth_header.split(' ')[1]
        user = auth_manager.get_user_from_token(token)
        user_id = user['user_id']
        
        # Check if template exists and user owns it
        template = db_manager.prompt_templates_collection.find_one({
            "id": template_id,
            "user_id": user_id
        })
        
        if not template:
            return jsonify({
                'success': False,
                'error': 'Template not found or access denied'
            }), 404
        
        # Delete template
        result = db_manager.prompt_templates_collection.delete_one({
            "id": template_id,
            "user_id": user_id
        })
        
        if result.deleted_count > 0:
            return jsonify({
                'success': True,
                'message': 'Template deleted successfully'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to delete template'
            }), 500
        
    except Exception as e:
        print(f"Error deleting prompt template: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/batch/csv-template', methods=['GET'])
def get_csv_template():
    """Get CSV template for batch upload"""
    try:
        template_key = request.args.get('template', 'linkedin_post')
        
        # Get template info
        template = get_template_by_key(template_key)
        if not template:
            return jsonify({
                'success': False,
                'error': f'Template "{template_key}" not found'
            }), 404
        
        # Create CSV template
        csv_buffer = io.StringIO()
        
        # Headers
        headers = ['template_key', 'user_prompt']
        headers.extend(template['required_fields'])
        headers.extend(template['optional_fields'])
        
        # Write CSV headers
        writer = csv.writer(csv_buffer)
        writer.writerow(headers)
        
        # Write example row
        example_row = [template_key, f'Example prompt for {template["name"]}']
        for field in template['required_fields']:
            if field == 'tone':
                example_row.append('professional')
            elif field == 'length':
                example_row.append('medium')
            else:
                example_row.append(f'example_{field}')
        
        for field in template['optional_fields']:
            example_row.append('')  # Optional fields can be empty
        
        writer.writerow(example_row)
        
        # Return CSV content
        csv_content = csv_buffer.getvalue()
        
        return jsonify({
            'success': True,
            'template_key': template_key,
            'csv_content': csv_content,
            'headers': headers
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ============================================================================
# BATCH PROCESSING DATABASE TEST ENDPOINT
# ============================================================================
        headers.extend(['tone', 'length', 'target_audience'])
        
        # Remove duplicates while preserving order
        unique_headers = []
        for header in headers:
            if header not in unique_headers:
                unique_headers.append(header)
        
        csv_buffer.write(','.join(unique_headers) + '\n')
        
        # Add example row
        example_row = [template_key, 'Your content prompt here']
        for field in unique_headers[2:]:  # Skip template_key and user_prompt
            if field in template.required_fields:
                example_row.append(f'Required {field}')
            elif field == 'tone':
                example_row.append(template.tone_options[0] if template.tone_options else 'Professional')
            elif field == 'length':
                example_row.append(template.length_options[0] if template.length_options else 'Medium')
            elif field == 'target_audience':
                example_row.append('Your target audience')
            else:
                example_row.append(f'Optional {field}')
        
        csv_buffer.write(','.join(f'"{item}"' for item in example_row) + '\n')
        
        # Return as downloadable file
        return send_file(
            io.BytesIO(csv_buffer.getvalue().encode('utf-8')),
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'{template_key}_batch_template.csv'
        )
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'success': False, 'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'success': False, 'error': 'Internal server error'}), 500

# ============================================================================
# BATCH PROCESSING DATABASE TEST ENDPOINT
# ============================================================================

@app.route('/api/batch/test-db', methods=['GET'])
def test_batch_database():
    """Test batch processing database connection"""
    try:
        from database import db_manager
        
        # Test database connection
        db_status = {
            'database_connected': db_manager.db is not None,
            'batch_jobs_collection': db_manager.batch_jobs_collection is not None,
            'batch_items_collection': db_manager.batch_items_collection is not None
        }
        
        if db_status['database_connected']:
            db_status['database_name'] = db_manager.db.name
            
        # Test batch processor
        try:
            processor = get_batch_processor()
            db_status['processor_created'] = processor is not None
            db_status['processor_db_connected'] = processor.db is not None
        except Exception as e:
            db_status['processor_error'] = str(e)
            db_status['processor_created'] = False
            db_status['processor_db_connected'] = False
        
        return jsonify({
            'success': True,
            'database_status': db_status
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'database_status': {}
        }), 500

@app.route('/api/seed-templates', methods=['POST'])
def seed_templates():
    """Seed the database with proven prompt templates"""
    try:
        from template_library import get_all_templates
        import uuid
        from datetime import datetime
        
        # Create a system user for public templates
        system_user_id = "system_templates"
        
        # Get all templates from library
        templates = get_all_templates()
        
        seeded_count = 0
        skipped_count = 0
        
        for template_data in templates:
            try:
                # Check if template already exists
                existing = db_manager.prompt_templates_collection.find_one({
                    "user_id": system_user_id,
                    "name": template_data["name"]
                })
                
                if existing:
                    skipped_count += 1
                    continue
                
                # Prepare template data for database
                template_id = str(uuid.uuid4())
                template_record = {
                    "id": template_id,
                    "user_id": system_user_id,
                    "name": template_data["name"],
                    "description": template_data["description"],
                    "category": template_data["category"],
                    "template_content": template_data["template_content"],
                    "variables": template_data["variables"],
                    "tags": template_data["tags"],
                    "is_public": template_data["is_public"],
                    "usage_count": template_data.get("usage_count", 0),
                    "rating": template_data.get("rating", 0.0),
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }
                
                # Insert template into database
                result = db_manager.prompt_templates_collection.insert_one(template_record)
                
                if result.inserted_id:
                    seeded_count += 1
                    
            except Exception as e:
                print(f"Error seeding template {template_data['name']}: {str(e)}")
        
        return jsonify({
            'success': True,
            'message': f'Seeded {seeded_count} templates, skipped {skipped_count} existing templates',
            'seeded_count': seeded_count,
            'skipped_count': skipped_count,
            'total_templates': len(templates)
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/debug/templates', methods=['GET'])
def debug_templates():
    """Debug endpoint to check template status"""
    try:
        if not db_manager.is_connected():
            return jsonify({'error': 'Database not connected'}), 500
        
        # Count templates
        total_count = db_manager.prompt_templates_collection.count_documents({})
        system_count = db_manager.prompt_templates_collection.count_documents({"user_id": "system_templates"})
        
        # Count by category
        categories = {}
        for cat in ["social_media", "marketing", "content_creation", "business", "creative", "technical"]:
            count = db_manager.prompt_templates_collection.count_documents({
                "user_id": "system_templates",
                "category": cat
            })
            categories[cat] = count
        
        # Get sample templates
        sample_templates = list(db_manager.prompt_templates_collection.find(
            {"user_id": "system_templates"}
        ).limit(5))
        
        # Clean up sample templates
        for template in sample_templates:
            template['_id'] = str(template['_id'])
        
        return jsonify({
            'success': True,
            'database_connected': db_manager.is_connected(),
            'total_templates': total_count,
            'system_templates': system_count,
            'categories': categories,
            'sample_templates': sample_templates
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/debug/auth', methods=['GET'])
def debug_auth():
    """Debug endpoint to check authentication status"""
    try:
        auth_header = request.headers.get('Authorization', '')
        
        debug_info = {
            'has_auth_header': bool(auth_header),
            'auth_header_format': auth_header[:20] + '...' if len(auth_header) > 20 else auth_header,
            'auth_header_length': len(auth_header)
        }
        
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            debug_info.update({
                'has_token': bool(token),
                'token_length': len(token),
                'token_segments': len(token.split('.')) if token else 0,
                'token_preview': token[:20] + '...' if len(token) > 20 else token
            })
            
            # Try to verify the token
            try:
                user = auth_manager.get_user_from_token(token)
                debug_info['token_valid'] = bool(user)
                debug_info['user_id'] = user.get('user_id') if user else None
            except Exception as e:
                debug_info['token_valid'] = False
                debug_info['token_error'] = str(e)
        
        return jsonify({
            'success': True,
            'debug_info': debug_info
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ============================================================================
# A/B TESTING ENDPOINTS
# ============================================================================

@app.route('/api/ab-tests', methods=['GET'])
@require_auth
def get_ab_tests():
    """Get all A/B tests for the authenticated user"""
    try:
        auth_header = request.headers.get('Authorization', '')
        token = auth_header.split(' ')[1]
        user = auth_manager.get_user_from_token(token)
        user_id = user['user_id']
        
        status = request.args.get('status')  # Optional filter by status
        
        ab_tests = ab_test_manager.get_user_ab_tests(user_id, status)
        
        return jsonify({
            'success': True,
            'ab_tests': ab_tests,
            'count': len(ab_tests)
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/ab-tests', methods=['POST'])
@require_auth
def create_ab_test():
    """Create a new A/B test"""
    try:
        auth_header = request.headers.get('Authorization', '')
        token = auth_header.split(' ')[1]
        user = auth_manager.get_user_from_token(token)
        user_id = user['user_id']
        
        data = request.get_json()
        
        name = data.get('name', '').strip()
        description = data.get('description', '').strip()
        template_a_id = data.get('template_a_id', '').strip()
        template_b_id = data.get('template_b_id', '').strip()
        test_parameters = data.get('test_parameters', {})
        
        # Validate required fields
        if not all([name, template_a_id, template_b_id]):
            return jsonify({
                'success': False,
                'error': 'Name, Template A ID, and Template B ID are required'
            }), 400
        
        if template_a_id == template_b_id:
            return jsonify({
                'success': False,
                'error': 'Template A and Template B must be different'
            }), 400
        
        # Create A/B test
        result = ab_test_manager.create_ab_test(
            user_id=user_id,
            name=name,
            description=description,
            template_a_id=template_a_id,
            template_b_id=template_b_id,
            test_parameters=test_parameters
        )
        
        if result['success']:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/ab-tests/<ab_test_id>', methods=['GET'])
@require_auth
def get_ab_test(ab_test_id):
    """Get a specific A/B test"""
    try:
        auth_header = request.headers.get('Authorization', '')
        token = auth_header.split(' ')[1]
        user = auth_manager.get_user_from_token(token)
        user_id = user['user_id']
        
        ab_test = ab_test_manager.get_ab_test(ab_test_id, user_id)
        
        if ab_test:
            return jsonify({
                'success': True,
                'ab_test': ab_test
            })
        else:
            return jsonify({
                'success': False,
                'error': 'A/B test not found'
            }), 404
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/ab-tests/<ab_test_id>/start', methods=['POST'])
@require_auth
def start_ab_test(ab_test_id):
    """Start an A/B test"""
    try:
        auth_header = request.headers.get('Authorization', '')
        token = auth_header.split(' ')[1]
        user = auth_manager.get_user_from_token(token)
        user_id = user['user_id']
        
        result = ab_test_manager.start_ab_test(ab_test_id, user_id)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/ab-tests/<ab_test_id>/pause', methods=['POST'])
@require_auth
def pause_ab_test(ab_test_id):
    """Pause an A/B test"""
    try:
        auth_header = request.headers.get('Authorization', '')
        token = auth_header.split(' ')[1]
        user = auth_manager.get_user_from_token(token)
        user_id = user['user_id']
        
        result = ab_test_manager.pause_ab_test(ab_test_id, user_id)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/ab-tests/<ab_test_id>/run', methods=['POST'])
@require_auth
def run_ab_test(ab_test_id):
    """Run an A/B test and generate content with both templates"""
    try:
        auth_header = request.headers.get('Authorization', '')
        token = auth_header.split(' ')[1]
        user = auth_manager.get_user_from_token(token)
        user_id = user['user_id']
        
        data = request.get_json()
        
        user_prompt = data.get('user_prompt', '')
        variables = data.get('variables', {})
        parameters = data.get('parameters', {})
        
        result = ab_test_manager.run_ab_test(
            ab_test_id=ab_test_id,
            user_prompt=user_prompt,
            variables=variables,
            parameters=parameters,
            user_id=user_id
        )
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/ab-tests/<ab_test_id>/results', methods=['POST'])
@require_auth
def submit_ab_test_result(ab_test_id):
    """Submit A/B test result"""
    try:
        auth_header = request.headers.get('Authorization', '')
        token = auth_header.split(' ')[1]
        user = auth_manager.get_user_from_token(token)
        user_id = user['user_id']
        
        data = request.get_json()
        
        winner = data.get('winner', '').lower()  # 'a', 'b', or 'tie'
        user_feedback = data.get('user_feedback', '')
        template_a_score = float(data.get('template_a_score', 0))
        template_b_score = float(data.get('template_b_score', 0))
        
        result = ab_test_manager.submit_ab_test_result(
            ab_test_id=ab_test_id,
            winner=winner,
            user_feedback=user_feedback,
            template_a_score=template_a_score,
            template_b_score=template_b_score,
            user_id=user_id
        )
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/ab-tests/<ab_test_id>/results', methods=['GET'])
@require_auth
def get_ab_test_results(ab_test_id):
    """Get all results for an A/B test"""
    try:
        auth_header = request.headers.get('Authorization', '')
        token = auth_header.split(' ')[1]
        user = auth_manager.get_user_from_token(token)
        user_id = user['user_id']
        
        results = ab_test_manager.get_ab_test_results(ab_test_id, user_id)
        
        return jsonify({
            'success': True,
            'results': results,
            'count': len(results)
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/ab-tests/<ab_test_id>', methods=['DELETE'])
@require_auth
def delete_ab_test(ab_test_id):
    """Delete an A/B test"""
    try:
        auth_header = request.headers.get('Authorization', '')
        token = auth_header.split(' ')[1]
        user = auth_manager.get_user_from_token(token)
        user_id = user['user_id']
        
        result = ab_test_manager.delete_ab_test(ab_test_id, user_id)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 404
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/ab-test-results', methods=['GET'])
@require_auth
def get_all_ab_test_results():
    """Get all A/B test results for the authenticated user"""
    try:
        auth_header = request.headers.get('Authorization', '')
        token = auth_header.split(' ')[1]
        user = auth_manager.get_user_from_token(token)
        user_id = user['user_id']
        
        results = ab_test_manager.get_all_user_ab_test_results(user_id)
        
        return jsonify({
            'success': True,
            'results': results,
            'count': len(results)
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# CONTENT ENHANCEMENT ENDPOINTS
# ============================================================================

@app.route('/api/content/enhance/tone', methods=['POST'])
@require_auth
def enhance_content_tone():
    """Adjust content tone without complete regeneration"""
    try:
        auth_header = request.headers.get('Authorization', '')
        token = auth_header.split(' ')[1]
        user = auth_manager.get_user_from_token(token)
        user_id = user['user_id']
        
        data = request.get_json()
        content = data.get('content', '').strip()
        target_tone = data.get('target_tone', '').strip()
        content_type = data.get('content_type', 'general')
        
        if not content:
            return jsonify({'success': False, 'error': 'Content is required'}), 400
        
        if not target_tone:
            return jsonify({'success': False, 'error': 'Target tone is required'}), 400
        
        # Import here to avoid circular imports
        from content_enhancement_engine import content_enhancement_engine
        
        result = content_enhancement_engine.adjust_tone(content, target_tone, content_type)
        
        if result['success']:
            # Save enhancement to history
            history_entry = history_manager.add_entry(
                content=result['enhanced_content'],
                content_type=f"tone_enhanced_{content_type}",
                template_key="tone_enhancement",
                parameters={
                    'original_content': content,
                    'target_tone': target_tone,
                    'enhancement_type': 'tone_adjustment'
                },
                user_id=user_id,
                model_used=openrouter_client.model
            )
            
            result['history_entry_id'] = history_entry.content_id
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/content/enhance/length', methods=['POST'])
@require_auth
def enhance_content_length():
    """Modify content length while preserving key information"""
    try:
        auth_header = request.headers.get('Authorization', '')
        token = auth_header.split(' ')[1]
        user = auth_manager.get_user_from_token(token)
        user_id = user['user_id']
        
        data = request.get_json()
        content = data.get('content', '').strip()
        target_length = data.get('target_length', '').strip()
        content_type = data.get('content_type', 'general')
        
        if not content:
            return jsonify({'success': False, 'error': 'Content is required'}), 400
        
        if not target_length:
            return jsonify({'success': False, 'error': 'Target length is required'}), 400
        
        from content_enhancement_engine import content_enhancement_engine
        
        result = content_enhancement_engine.modify_length(content, target_length, content_type)
        
        if result['success']:
            # Save enhancement to history
            history_entry = history_manager.add_entry(
                content=result['enhanced_content'],
                content_type=f"length_enhanced_{content_type}",
                template_key="length_enhancement",
                parameters={
                    'original_content': content,
                    'target_length': target_length,
                    'enhancement_type': 'length_modification'
                },
                user_id=user_id,
                model_used=openrouter_client.model
            )
            
            result['history_entry_id'] = history_entry.content_id
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/content/enhance/style', methods=['POST'])
@require_auth
def enhance_content_style():
    """Refine content style based on preferences"""
    try:
        auth_header = request.headers.get('Authorization', '')
        token = auth_header.split(' ')[1]
        user = auth_manager.get_user_from_token(token)
        user_id = user['user_id']
        
        data = request.get_json()
        content = data.get('content', '').strip()
        style_preferences = data.get('style_preferences', {})
        
        if not content:
            return jsonify({'success': False, 'error': 'Content is required'}), 400
        
        from content_enhancement_engine import content_enhancement_engine
        
        result = content_enhancement_engine.refine_style(content, style_preferences)
        
        if result['success']:
            # Save enhancement to history
            history_entry = history_manager.add_entry(
                content=result['enhanced_content'],
                content_type="style_enhanced",
                template_key="style_enhancement",
                parameters={
                    'original_content': content,
                    'style_preferences': style_preferences,
                    'enhancement_type': 'style_refinement'
                },
                user_id=user_id,
                model_used=openrouter_client.model
            )
            
            result['history_entry_id'] = history_entry.content_id
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/content/suggestions', methods=['POST'])
@require_auth
def get_enhancement_suggestions():
    """Get AI-powered enhancement suggestions for content"""
    try:
        data = request.get_json()
        content = data.get('content', '').strip()
        content_type = data.get('content_type', 'general')
        
        if not content:
            return jsonify({'success': False, 'error': 'Content is required'}), 400
        
        from content_enhancement_engine import content_enhancement_engine
        
        result = content_enhancement_engine.generate_enhancement_suggestions(content, content_type)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/content/apply-suggestion', methods=['POST'])
@require_auth
def apply_enhancement_suggestion():
    """Apply a specific enhancement suggestion to content"""
    try:
        auth_header = request.headers.get('Authorization', '')
        token = auth_header.split(' ')[1]
        user = auth_manager.get_user_from_token(token)
        user_id = user['user_id']
        
        data = request.get_json()
        content = data.get('content', '').strip()
        suggestion = data.get('suggestion', {})
        
        if not content:
            return jsonify({'success': False, 'error': 'Content is required'}), 400
        
        if not suggestion:
            return jsonify({'success': False, 'error': 'Suggestion is required'}), 400
        
        from content_enhancement_engine import content_enhancement_engine
        
        result = content_enhancement_engine.apply_enhancement_suggestion(content, suggestion)
        
        if result['success']:
            # Save enhancement to history
            history_entry = history_manager.add_entry(
                content=result['enhanced_content'],
                content_type="suggestion_enhanced",
                template_key="suggestion_enhancement",
                parameters={
                    'original_content': content,
                    'applied_suggestion': suggestion,
                    'enhancement_type': 'suggestion_application'
                },
                user_id=user_id,
                model_used=openrouter_client.model
            )
            
            result['history_entry_id'] = history_entry.content_id
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/content/merge', methods=['POST'])
@require_auth
def merge_content_pieces():
    """Merge multiple content pieces into one cohesive piece"""
    try:
        auth_header = request.headers.get('Authorization', '')
        token = auth_header.split(' ')[1]
        user = auth_manager.get_user_from_token(token)
        user_id = user['user_id']
        
        data = request.get_json()
        content_pieces = data.get('content_pieces', [])
        merge_style = data.get('merge_style', 'cohesive')
        
        if len(content_pieces) < 2:
            return jsonify({'success': False, 'error': 'At least 2 content pieces required'}), 400
        
        from content_enhancement_engine import content_enhancement_engine
        
        result = content_enhancement_engine.merge_content_pieces(content_pieces, merge_style)
        
        if result['success']:
            # Save merged content to history
            history_entry = history_manager.add_entry(
                content=result['merged_content'],
                content_type="merged_content",
                template_key="content_merge",
                parameters={
                    'original_pieces': content_pieces,
                    'merge_style': merge_style,
                    'enhancement_type': 'content_merge'
                },
                user_id=user_id,
                model_used=openrouter_client.model
            )
            
            result['history_entry_id'] = history_entry.content_id
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    # Check for API key
    api_key = os.getenv('OPENROUTER_API_KEY')
    if not api_key:
        print("Warning: OPENROUTER_API_KEY not found in environment variables")
        print("Please set your API key in the .env file")
    
    # Get port from environment variable (for Render deployment) or default to 8000
    port = int(os.getenv('PORT', 8000))
    
    print("Starting AI Content Creator API Server...")
    print(f"Server will run on port {port}")
    print("React frontend should proxy to this server")
    
    # Run the Flask app
    app.run(
        host='0.0.0.0',
        port=port,
        debug=os.getenv('FLASK_ENV') != 'production',
        threaded=True
    )