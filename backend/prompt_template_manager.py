"""
Advanced Prompt Template Management System
Handles prompt templates, variables, A/B testing, and customization
"""

import json
import uuid
import re
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from enum import Enum

class PromptVariableType(Enum):
    """Types of variables in prompt templates"""
    TEXT = "text"
    NUMBER = "number"
    SELECT = "select"
    BOOLEAN = "boolean"
    TEXTAREA = "textarea"

class PromptCategory(Enum):
    """Categories for prompt templates"""
    MARKETING = "marketing"
    TECHNICAL = "technical"
    CREATIVE = "creative"
    BUSINESS = "business"
    SOCIAL_MEDIA = "social_media"
    EMAIL = "email"
    BLOG = "blog"
    CUSTOM = "custom"

@dataclass
class PromptVariable:
    """Variable definition in a prompt template"""
    name: str
    type: PromptVariableType
    description: str
    default_value: Any = None
    options: List[str] = None  # For SELECT type
    required: bool = True
    placeholder: str = ""
    validation_regex: str = ""

@dataclass
class PromptTemplate:
    """Advanced prompt template with variables and metadata"""
    id: str
    name: str
    description: str
    category: PromptCategory
    template_content: str
    variables: List[PromptVariable]
    created_by: str
    created_at: str
    updated_at: str
    is_public: bool = False
    usage_count: int = 0
    rating: float = 0.0
    tags: List[str] = None
    version: str = "1.0"
    
    def __post_init__(self):
        if self.tags is None:
            self.tags = []

@dataclass
class ABTestConfig:
    """A/B test configuration"""
    id: str
    name: str
    description: str
    template_a_id: str
    template_b_id: str
    user_id: str
    created_at: str
    status: str = "active"  # active, paused, completed
    results: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.results is None:
            self.results = {
                "total_tests": 0,
                "template_a_wins": 0,
                "template_b_wins": 0,
                "ties": 0,
                "template_a_avg_quality": 0.0,
                "template_b_avg_quality": 0.0,
                "template_a_avg_length": 0,
                "template_b_avg_length": 0
            }

@dataclass
class ABTestResult:
    """Individual A/B test result"""
    id: str
    test_id: str
    template_a_output: str
    template_b_output: str
    winner: str  # "a", "b", or "tie"
    user_feedback: str
    quality_score_a: float
    quality_score_b: float
    created_at: str
    metadata: Dict[str, Any] = None

class PromptTemplateManager:
    """Manager for prompt templates and A/B testing"""
    
    def __init__(self):
        self.templates: Dict[str, PromptTemplate] = {}
        self.ab_tests: Dict[str, ABTestConfig] = {}
        self.ab_results: Dict[str, List[ABTestResult]] = {}
        self.load_default_templates()
    
    def load_default_templates(self):
        """Load default prompt templates"""
        default_templates = [
            {
                "name": "Professional LinkedIn Post",
                "description": "Create engaging LinkedIn posts for professional networking",
                "category": PromptCategory.SOCIAL_MEDIA,
                "template_content": """Create a professional LinkedIn post about {{topic}}.

Context: {{context}}
Target Audience: {{target_audience}}
Tone: {{tone}}
Call to Action: {{include_cta}}

Requirements:
- Keep it engaging and professional
- Use relevant hashtags
- Include a clear call to action if requested
- Length: {{length}} words
- Make it {{creativity_level}} creative

Structure:
1. Hook (attention-grabbing opening)
2. Value proposition or insight
3. Supporting details or examples
4. Call to action (if requested)
5. Relevant hashtags

Generate a compelling LinkedIn post that will drive engagement and establish thought leadership.""",
                "variables": [
                    PromptVariable("topic", PromptVariableType.TEXT, "Main topic or subject", placeholder="e.g., AI trends, remote work"),
                    PromptVariable("context", PromptVariableType.TEXTAREA, "Additional context or background", placeholder="Provide relevant context..."),
                    PromptVariable("target_audience", PromptVariableType.SELECT, "Target audience", options=["professionals", "entrepreneurs", "developers", "marketers", "general"]),
                    PromptVariable("tone", PromptVariableType.SELECT, "Tone of voice", options=["professional", "casual", "enthusiastic", "authoritative"]),
                    PromptVariable("length", PromptVariableType.SELECT, "Post length", options=["short (50-100)", "medium (100-200)", "long (200-300)"]),
                    PromptVariable("creativity_level", PromptVariableType.SELECT, "Creativity level", options=["moderately", "highly", "extremely"]),
                    PromptVariable("include_cta", PromptVariableType.BOOLEAN, "Include call to action", default_value=True)
                ]
            },
            {
                "name": "Technical Blog Post",
                "description": "Generate comprehensive technical blog posts with code examples",
                "category": PromptCategory.TECHNICAL,
                "template_content": """Write a technical blog post about {{topic}}.

Technical Details:
- Technology/Framework: {{technology}}
- Skill Level: {{skill_level}}
- Include Code Examples: {{include_code}}
- Post Length: {{length}}

Requirements:
- Start with a compelling introduction
- Explain concepts clearly for {{skill_level}} developers
- Include practical examples and use cases
- Add code snippets if requested
- Conclude with key takeaways
- Use proper technical terminology
- Make it {{engagement_style}}

Structure:
1. Introduction (why this matters)
2. Problem statement or use case
3. Solution explanation
4. Implementation details (with code if requested)
5. Best practices and tips
6. Conclusion and next steps

Generate a comprehensive technical blog post that educates and engages developers.""",
                "variables": [
                    PromptVariable("topic", PromptVariableType.TEXT, "Technical topic", placeholder="e.g., React Hooks, Docker containers"),
                    PromptVariable("technology", PromptVariableType.TEXT, "Specific technology or framework", placeholder="e.g., React, Python, AWS"),
                    PromptVariable("skill_level", PromptVariableType.SELECT, "Target skill level", options=["beginner", "intermediate", "advanced"]),
                    PromptVariable("length", PromptVariableType.SELECT, "Article length", options=["short (500-800 words)", "medium (800-1500 words)", "long (1500+ words)"]),
                    PromptVariable("include_code", PromptVariableType.BOOLEAN, "Include code examples", default_value=True),
                    PromptVariable("engagement_style", PromptVariableType.SELECT, "Engagement style", options=["educational", "conversational", "authoritative"])
                ]
            },
            {
                "name": "Marketing Email Campaign",
                "description": "Create compelling marketing emails that drive conversions",
                "category": PromptCategory.EMAIL,
                "template_content": """Create a marketing email for {{campaign_type}}.

Campaign Details:
- Product/Service: {{product_service}}
- Target Audience: {{target_audience}}
- Primary Goal: {{primary_goal}}
- Tone: {{tone}}
- Email Type: {{email_type}}

Key Elements to Include:
- Compelling subject line
- Personalized greeting
- Clear value proposition
- Social proof (if applicable)
- Strong call to action
- Professional closing

Requirements:
- Keep the email {{length}}
- Make it {{urgency_level}} urgent
- Focus on {{primary_benefit}}
- Include {{cta_count}} call(s) to action

Structure:
1. Subject line (compelling and clear)
2. Personalized opening
3. Problem identification or opportunity
4. Solution presentation
5. Benefits and value proposition
6. Social proof or testimonials
7. Clear call to action
8. Professional closing

Generate a high-converting marketing email that drives {{primary_goal}}.""",
                "variables": [
                    PromptVariable("campaign_type", PromptVariableType.SELECT, "Campaign type", options=["product launch", "promotion", "newsletter", "follow-up", "re-engagement"]),
                    PromptVariable("product_service", PromptVariableType.TEXT, "Product or service name", placeholder="e.g., SaaS platform, online course"),
                    PromptVariable("target_audience", PromptVariableType.TEXT, "Target audience description", placeholder="e.g., small business owners, developers"),
                    PromptVariable("primary_goal", PromptVariableType.SELECT, "Primary goal", options=["sales", "sign-ups", "engagement", "awareness", "retention"]),
                    PromptVariable("tone", PromptVariableType.SELECT, "Email tone", options=["professional", "friendly", "urgent", "casual"]),
                    PromptVariable("email_type", PromptVariableType.SELECT, "Email type", options=["promotional", "informational", "transactional", "nurturing"]),
                    PromptVariable("length", PromptVariableType.SELECT, "Email length", options=["short and punchy", "medium length", "detailed and comprehensive"]),
                    PromptVariable("urgency_level", PromptVariableType.SELECT, "Urgency level", options=["low", "moderate", "high"]),
                    PromptVariable("primary_benefit", PromptVariableType.TEXT, "Primary benefit to highlight", placeholder="e.g., save time, increase revenue"),
                    PromptVariable("cta_count", PromptVariableType.SELECT, "Number of CTAs", options=["1", "2", "3"])
                ]
            }
        ]
        
        for template_data in default_templates:
            template_id = str(uuid.uuid4())
            template = PromptTemplate(
                id=template_id,
                name=template_data["name"],
                description=template_data["description"],
                category=template_data["category"],
                template_content=template_data["template_content"],
                variables=template_data["variables"],
                created_by="system",
                created_at=datetime.now().isoformat(),
                updated_at=datetime.now().isoformat(),
                is_public=True,
                tags=["default", template_data["category"].value]
            )
            self.templates[template_id] = template
    
    def create_template(self, name: str, description: str, category: PromptCategory,
                       template_content: str, variables: List[Dict], user_id: str,
                       is_public: bool = False, tags: List[str] = None) -> str:
        """Create a new prompt template"""
        template_id = str(uuid.uuid4())
        
        # Convert variable dicts to PromptVariable objects
        variable_objects = []
        for var_data in variables:
            variable = PromptVariable(
                name=var_data["name"],
                type=PromptVariableType(var_data["type"]),
                description=var_data["description"],
                default_value=var_data.get("default_value"),
                options=var_data.get("options"),
                required=var_data.get("required", True),
                placeholder=var_data.get("placeholder", ""),
                validation_regex=var_data.get("validation_regex", "")
            )
            variable_objects.append(variable)
        
        template = PromptTemplate(
            id=template_id,
            name=name,
            description=description,
            category=category,
            template_content=template_content,
            variables=variable_objects,
            created_by=user_id,
            created_at=datetime.now().isoformat(),
            updated_at=datetime.now().isoformat(),
            is_public=is_public,
            tags=tags or []
        )
        
        self.templates[template_id] = template
        return template_id
    
    def get_template(self, template_id: str) -> Optional[PromptTemplate]:
        """Get a template by ID"""
        return self.templates.get(template_id)
    
    def get_user_templates(self, user_id: str, include_public: bool = True) -> List[PromptTemplate]:
        """Get templates for a user"""
        user_templates = []
        
        for template in self.templates.values():
            if template.created_by == user_id:
                user_templates.append(template)
            elif include_public and template.is_public:
                user_templates.append(template)
        
        return sorted(user_templates, key=lambda t: t.updated_at, reverse=True)
    
    def update_template(self, template_id: str, user_id: str, **updates) -> bool:
        """Update a template"""
        template = self.templates.get(template_id)
        if not template or template.created_by != user_id:
            return False
        
        # Update allowed fields
        allowed_fields = ["name", "description", "template_content", "variables", "is_public", "tags"]
        for field, value in updates.items():
            if field in allowed_fields:
                if field == "variables" and isinstance(value, list):
                    # Convert variable dicts to objects
                    variable_objects = []
                    for var_data in value:
                        if isinstance(var_data, dict):
                            variable = PromptVariable(
                                name=var_data["name"],
                                type=PromptVariableType(var_data["type"]),
                                description=var_data["description"],
                                default_value=var_data.get("default_value"),
                                options=var_data.get("options"),
                                required=var_data.get("required", True),
                                placeholder=var_data.get("placeholder", ""),
                                validation_regex=var_data.get("validation_regex", "")
                            )
                            variable_objects.append(variable)
                    setattr(template, field, variable_objects)
                else:
                    setattr(template, field, value)
        
        template.updated_at = datetime.now().isoformat()
        return True
    
    def delete_template(self, template_id: str, user_id: str) -> bool:
        """Delete a template"""
        template = self.templates.get(template_id)
        if not template or template.created_by != user_id:
            return False
        
        del self.templates[template_id]
        return True
    
    def render_template(self, template_id: str, variables: Dict[str, Any]) -> str:
        """Render a template with provided variables"""
        template = self.templates.get(template_id)
        if not template:
            raise ValueError(f"Template {template_id} not found")
        
        rendered_content = template.template_content
        
        # Replace variables in the format {{variable_name}}
        for var_name, var_value in variables.items():
            placeholder = f"{{{{{var_name}}}}}"
            rendered_content = rendered_content.replace(placeholder, str(var_value))
        
        # Increment usage count
        template.usage_count += 1
        
        return rendered_content
    
    def validate_template_variables(self, template_id: str, variables: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate variables against template requirements"""
        template = self.templates.get(template_id)
        if not template:
            return False, ["Template not found"]
        
        errors = []
        
        for var_def in template.variables:
            var_name = var_def.name
            var_value = variables.get(var_name)
            
            # Check required variables
            if var_def.required and (var_value is None or var_value == ""):
                errors.append(f"Variable '{var_name}' is required")
                continue
            
            # Skip validation if variable is not provided and not required
            if var_value is None:
                continue
            
            # Type validation
            if var_def.type == PromptVariableType.NUMBER:
                try:
                    float(var_value)
                except (ValueError, TypeError):
                    errors.append(f"Variable '{var_name}' must be a number")
            
            elif var_def.type == PromptVariableType.BOOLEAN:
                if not isinstance(var_value, bool):
                    errors.append(f"Variable '{var_name}' must be a boolean")
            
            elif var_def.type == PromptVariableType.SELECT:
                if var_def.options and var_value not in var_def.options:
                    errors.append(f"Variable '{var_name}' must be one of: {', '.join(var_def.options)}")
            
            # Regex validation
            if var_def.validation_regex and isinstance(var_value, str):
                if not re.match(var_def.validation_regex, var_value):
                    errors.append(f"Variable '{var_name}' does not match required format")
        
        return len(errors) == 0, errors
    
    def search_templates(self, query: str, category: Optional[PromptCategory] = None,
                        user_id: Optional[str] = None) -> List[PromptTemplate]:
        """Search templates by name, description, or tags"""
        results = []
        query_lower = query.lower()
        
        for template in self.templates.values():
            # Check access permissions
            if user_id and not template.is_public and template.created_by != user_id:
                continue
            
            # Category filter
            if category and template.category != category:
                continue
            
            # Text search
            if (query_lower in template.name.lower() or
                query_lower in template.description.lower() or
                any(query_lower in tag.lower() for tag in template.tags)):
                results.append(template)
        
        return sorted(results, key=lambda t: t.rating, reverse=True)
    
    # A/B Testing Methods
    
    def create_ab_test(self, name: str, description: str, template_a_id: str,
                      template_b_id: str, user_id: str) -> str:
        """Create a new A/B test"""
        test_id = str(uuid.uuid4())
        
        ab_test = ABTestConfig(
            id=test_id,
            name=name,
            description=description,
            template_a_id=template_a_id,
            template_b_id=template_b_id,
            user_id=user_id,
            created_at=datetime.now().isoformat()
        )
        
        self.ab_tests[test_id] = ab_test
        self.ab_results[test_id] = []
        
        return test_id
    
    def get_ab_test(self, test_id: str) -> Optional[ABTestConfig]:
        """Get an A/B test by ID"""
        return self.ab_tests.get(test_id)
    
    def get_user_ab_tests(self, user_id: str) -> List[ABTestConfig]:
        """Get A/B tests for a user"""
        return [test for test in self.ab_tests.values() if test.user_id == user_id]
    
    def add_ab_test_result(self, test_id: str, template_a_output: str, template_b_output: str,
                          winner: str, user_feedback: str, quality_score_a: float,
                          quality_score_b: float, metadata: Dict[str, Any] = None) -> str:
        """Add a result to an A/B test"""
        if test_id not in self.ab_tests:
            raise ValueError(f"A/B test {test_id} not found")
        
        result_id = str(uuid.uuid4())
        
        result = ABTestResult(
            id=result_id,
            test_id=test_id,
            template_a_output=template_a_output,
            template_b_output=template_b_output,
            winner=winner,
            user_feedback=user_feedback,
            quality_score_a=quality_score_a,
            quality_score_b=quality_score_b,
            created_at=datetime.now().isoformat(),
            metadata=metadata or {}
        )
        
        self.ab_results[test_id].append(result)
        
        # Update test statistics
        test_config = self.ab_tests[test_id]
        results = test_config.results
        
        results["total_tests"] += 1
        
        if winner == "a":
            results["template_a_wins"] += 1
        elif winner == "b":
            results["template_b_wins"] += 1
        else:
            results["ties"] += 1
        
        # Update average quality scores
        total_tests = results["total_tests"]
        results["template_a_avg_quality"] = (
            (results["template_a_avg_quality"] * (total_tests - 1) + quality_score_a) / total_tests
        )
        results["template_b_avg_quality"] = (
            (results["template_b_avg_quality"] * (total_tests - 1) + quality_score_b) / total_tests
        )
        
        # Update average lengths
        results["template_a_avg_length"] = (
            (results["template_a_avg_length"] * (total_tests - 1) + len(template_a_output.split())) / total_tests
        )
        results["template_b_avg_length"] = (
            (results["template_b_avg_length"] * (total_tests - 1) + len(template_b_output.split())) / total_tests
        )
        
        return result_id
    
    def get_ab_test_results(self, test_id: str) -> List[ABTestResult]:
        """Get results for an A/B test"""
        return self.ab_results.get(test_id, [])
    
    def get_template_statistics(self, template_id: str) -> Dict[str, Any]:
        """Get usage statistics for a template"""
        template = self.templates.get(template_id)
        if not template:
            return {}
        
        # Count A/B test participation
        ab_test_count = 0
        ab_wins = 0
        
        for test in self.ab_tests.values():
            if test.template_a_id == template_id or test.template_b_id == template_id:
                ab_test_count += 1
                
                if test.template_a_id == template_id:
                    ab_wins += test.results["template_a_wins"]
                else:
                    ab_wins += test.results["template_b_wins"]
        
        return {
            "usage_count": template.usage_count,
            "rating": template.rating,
            "ab_test_count": ab_test_count,
            "ab_wins": ab_wins,
            "created_at": template.created_at,
            "updated_at": template.updated_at
        }

# Global instance
prompt_template_manager = PromptTemplateManager()