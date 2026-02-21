#!/usr/bin/env python3
"""
Cleanup script to remove unnecessary files before deployment
Run this before deploying to production
"""

import os
import shutil
from pathlib import Path

def remove_file(filepath):
    """Remove a file if it exists"""
    try:
        if os.path.exists(filepath):
            os.remove(filepath)
            print(f"✅ Removed: {filepath}")
            return True
        else:
            print(f"⏭️  Skipped (not found): {filepath}")
            return False
    except Exception as e:
        print(f"❌ Error removing {filepath}: {e}")
        return False

def remove_directory(dirpath):
    """Remove a directory if it exists"""
    try:
        if os.path.exists(dirpath):
            shutil.rmtree(dirpath)
            print(f"✅ Removed directory: {dirpath}")
            return True
        else:
            print(f"⏭️  Skipped (not found): {dirpath}")
            return False
    except Exception as e:
        print(f"❌ Error removing {dirpath}: {e}")
        return False

def main():
    print("🧹 AI Content Creator - Cleanup Script")
    print("=" * 50)
    print("This script removes unnecessary files before deployment")
    print()
    
    # Get project root
    project_root = Path(__file__).parent
    
    # Files to remove
    files_to_remove = [
        # Test files
        "test_*.py",
        "*_test.py",
        "*.test.js",
        
        # Backup files
        "*.bak",
        "*.backup",
        "*.tmp",
        
        # OS files
        ".DS_Store",
        "Thumbs.db",
        
        # Development files
        "setup_environment.py",  # Not needed in production
    ]
    
    # Directories to remove
    dirs_to_remove = [
        "backend/__pycache__",
        ".pytest_cache",
        ".coverage",
        "htmlcov",
    ]
    
    print("📋 Files to remove:")
    removed_count = 0
    
    # Remove specific files
    for pattern in files_to_remove:
        if "*" in pattern:
            # Handle wildcards
            for file in project_root.rglob(pattern):
                if remove_file(file):
                    removed_count += 1
        else:
            # Handle specific files
            if remove_file(project_root / pattern):
                removed_count += 1
    
    print()
    print("📁 Directories to remove:")
    
    # Remove directories
    for dir_pattern in dirs_to_remove:
        if "*" in dir_pattern:
            # Handle wildcards
            for directory in project_root.rglob(dir_pattern):
                if remove_directory(directory):
                    removed_count += 1
        else:
            # Handle specific directories
            if remove_directory(project_root / dir_pattern):
                removed_count += 1
    
    print()
    print("=" * 50)
    print(f"✨ Cleanup complete! Removed {removed_count} items")
    print()
    print("📝 Next steps:")
    print("1. Review changes with: git status")
    print("2. Test the application locally")
    print("3. Commit changes: git add . && git commit -m 'Prepare for deployment'")
    print("4. Push to GitHub: git push")
    print("5. Follow DEPLOYMENT.md for deployment instructions")

if __name__ == "__main__":
    main()
