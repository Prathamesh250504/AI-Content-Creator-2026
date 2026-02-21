"""
Seed the database with proven prompt templates from the template library
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import DatabaseManager
from template_library import get_all_templates, get_template_categories
from prompt_template_manager import PromptTemplateManager
import uuid
from datetime import datetime

def seed_template_library():
    """Seed the database with proven prompt templates"""
    
    # Initialize database and template manager
    db_manager = DatabaseManager()
    template_manager = PromptTemplateManager(db_manager)
    
    print("🌱 Starting template library seeding...")
    
    # Create a system user for public templates
    system_user_id = "system_templates"
    
    # Get all templates from library
    templates = get_all_templates()
    
    seeded_count = 0
    skipped_count = 0
    
    for template_data in templates:
        try:
            # Check if template already exists
            existing_templates = template_manager.get_user_templates(
                user_id=system_user_id,
                search=template_data["name"]
            )
            
            # Skip if template with same name already exists
            if any(t["name"] == template_data["name"] for t in existing_templates):
                print(f"⏭️  Skipping existing template: {template_data['name']}")
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
                print(f"✅ Seeded template: {template_data['name']} ({template_data['category']})")
                seeded_count += 1
            else:
                print(f"❌ Failed to seed template: {template_data['name']}")
                
        except Exception as e:
            print(f"❌ Error seeding template {template_data['name']}: {str(e)}")
    
    print(f"\n🎉 Template seeding completed!")
    print(f"   ✅ Seeded: {seeded_count} templates")
    print(f"   ⏭️  Skipped: {skipped_count} templates")
    print(f"   📊 Total in library: {len(templates)} templates")
    
    # Print category breakdown
    print(f"\n📋 Templates by category:")
    categories = get_template_categories()
    for category in categories:
        if category["value"] != "custom":
            category_templates = [t for t in templates if t["category"] == category["value"]]
            print(f"   {category['label']}: {len(category_templates)} templates")

def update_existing_templates():
    """Update existing templates with new data from library"""
    
    db_manager = DatabaseManager()
    template_manager = PromptTemplateManager(db_manager)
    
    print("🔄 Updating existing templates...")
    
    system_user_id = "system_templates"
    templates = get_all_templates()
    
    updated_count = 0
    
    for template_data in templates:
        try:
            # Find existing template by name
            existing_templates = template_manager.get_user_templates(
                user_id=system_user_id,
                search=template_data["name"]
            )
            
            existing_template = None
            for t in existing_templates:
                if t["name"] == template_data["name"]:
                    existing_template = t
                    break
            
            if existing_template:
                # Update template with new data
                update_data = {
                    "description": template_data["description"],
                    "template_content": template_data["template_content"],
                    "variables": template_data["variables"],
                    "tags": template_data["tags"],
                    "rating": template_data.get("rating", existing_template.get("rating", 0.0)),
                    "updated_at": datetime.utcnow().isoformat()
                }
                
                result = db_manager.prompt_templates_collection.update_one(
                    {"id": existing_template["id"]},
                    {"$set": update_data}
                )
                
                if result.modified_count > 0:
                    print(f"🔄 Updated template: {template_data['name']}")
                    updated_count += 1
                    
        except Exception as e:
            print(f"❌ Error updating template {template_data['name']}: {str(e)}")
    
    print(f"\n✅ Updated {updated_count} existing templates")

def main():
    """Main function to run seeding"""
    
    if len(sys.argv) > 1 and sys.argv[1] == "--update":
        update_existing_templates()
    else:
        seed_template_library()

if __name__ == "__main__":
    main()