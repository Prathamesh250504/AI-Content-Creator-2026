import { useState, useEffect, useCallback } from 'react';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import authService from '../services/authService';
import PromptTemplateEditor from '../components/PromptTemplateEditor';
import TemplatePreview from '../components/TemplatePreview';
import TemplateCategoryShowcase from '../components/TemplateCategoryShowcase';

const PromptTemplates = () => {
  const { isAuthenticated } = useUser();
  const { isDarkMode } = useTheme();
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [includePublic, setIncludePublic] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);

  const loadCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/prompt-categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }, []);

  const loadTemplates = useCallback(async () => {
    // Always try to load templates, but handle authentication properly
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      params.append('include_public', includePublic.toString());

      // Check if user is authenticated and get token
      const token = authService.getToken();
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/prompt-templates?${params}`, {
        headers
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      } else if (response.status === 401) {
        // Token expired or invalid, clear auth and try without token
        authService.clearAuth();
        console.log('Authentication expired, loading public templates only');
        
        // Retry without authentication for public templates
        const publicResponse = await fetch(`/api/prompt-templates?include_public=true`);
        if (publicResponse.ok) {
          const publicData = await publicResponse.json();
          setTemplates(publicData.templates || []);
        }
      } else {
        console.error('Failed to load templates:', response.status);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory, includePublic]);

  useEffect(() => {
    loadCategories();
    loadTemplates();
  }, [loadCategories, loadTemplates]);

  useEffect(() => {
    loadTemplates();
  }, [searchTerm, selectedCategory, includePublic, loadTemplates]);

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setShowEditor(true);
  };

  const handleEditTemplate = (template) => {
    // Check if this is a system template - always duplicate instead of edit
    if (template.user_id === 'system_templates') {
      handleDuplicateTemplate(template);
      return;
    }
    
    // Check if user is authenticated for editing their own templates
    const token = authService.getToken();
    if (!token) {
      alert('Please log in to edit templates');
      return;
    }
    
    // Only allow editing if user owns the template
    if (!template.is_owner) {
      alert('You can only edit your own templates. Use "Duplicate" to create a copy.');
      return;
    }
    
    setEditingTemplate(template);
    setShowEditor(true);
  };

  const handleSaveTemplate = async (templateData) => {
    try {
      const token = authService.getToken();
      if (!token) {
        alert('Please log in to save templates');
        return;
      }

      // Check if we're editing an existing template (has valid ID) or creating new one
      const isEditing = editingTemplate && editingTemplate.id && editingTemplate.id !== 'undefined';
      
      const url = isEditing 
        ? `/api/prompt-templates/${editingTemplate.id}`
        : '/api/prompt-templates';
      
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(templateData)
      });

      if (response.ok) {
        setShowEditor(false);
        setEditingTemplate(null);
        loadTemplates();
        alert(isEditing ? 'Template updated successfully!' : 'Template created successfully!');
      } else if (response.status === 401) {
        authService.clearAuth();
        alert('Your session has expired. Please log in again.');
      } else {
        const error = await response.json();
        alert(`Failed to save template: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('Failed to save template. Please try again.');
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      const token = authService.getToken();
      if (!token) {
        alert('Please log in to delete templates');
        return;
      }

      const response = await fetch(`/api/prompt-templates/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        loadTemplates();
        alert('Template deleted successfully!');
      } else if (response.status === 401) {
        authService.clearAuth();
        alert('Your session has expired. Please log in again.');
      } else {
        const error = await response.json();
        alert(`Failed to delete template: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
      alert('Failed to delete template. Please try again.');
    }
  };

  const handleDuplicateTemplate = (template) => {
    // Check if user is authenticated for creating templates
    const token = authService.getToken();
    if (!token) {
      alert('Please log in to create templates');
      return;
    }
    
    const duplicatedTemplate = {
      ...template,
      name: `${template.name} (Copy)`,
      is_public: false,
      // Remove system template properties
      id: undefined,
      user_id: undefined,
      is_owner: undefined,
      created_at: undefined,
      updated_at: undefined,
      usage_count: 0,
      rating: 0
    };
    setEditingTemplate(duplicatedTemplate);
    setShowEditor(true);
  };

  const handlePreviewTemplate = (template) => {
    setPreviewTemplate(template);
    setShowPreview(true);
  };

  const handleUseTemplate = (template) => {
    setShowPreview(false);
    handleDuplicateTemplate(template);
  };

  const handleCategorySelect = (categoryValue) => {
    setSelectedCategory(categoryValue);
    setSearchTerm('');
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !searchTerm || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = !selectedCategory || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (!isAuthenticated) {
    return (
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-200 ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Prompt Templates
            </h1>
            <p className={`mt-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Discover our library of proven prompt templates for advanced content generation
            </p>
          </div>
        </div>

        {/* Category Showcase for unauthenticated users */}
        <TemplateCategoryShowcase
          onCategorySelect={handleCategorySelect}
          onTemplatePreview={handlePreviewTemplate}
        />
        
        <div className="text-center mt-8">
          <div className={`rounded-lg p-8 transition-colors duration-200 ${
            isDarkMode 
              ? 'glass border border-gray-700' 
              : 'bg-white border border-gray-200 shadow-sm'
          }`}>
            <h2 className={`text-2xl font-bold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Ready to Get Started?
            </h2>
            <p className={`mb-6 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Sign in to access our complete library of professional prompt templates, 
              create your own custom templates, and generate high-quality content.
            </p>
            <button className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Sign In to Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showEditor) {
    return (
      <PromptTemplateEditor
        template={editingTemplate}
        onSave={handleSaveTemplate}
        onCancel={() => {
          setShowEditor(false);
          setEditingTemplate(null);
        }}
        isEditing={!!editingTemplate}
        categories={categories}
      />
    );
  }

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-200 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className={`text-3xl font-bold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Prompt Templates
          </h1>
          <p className={`mt-2 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Create and manage custom prompt templates for advanced content generation
          </p>
          <div className="flex items-center space-x-4 mt-3">
            <div className={`flex items-center space-x-2 text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
              <span>Proven templates with 4.5+ ratings</span>
            </div>
            <div className={`flex items-center space-x-2 text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
              <span>Professional use cases</span>
            </div>
            <div className={`flex items-center space-x-2 text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              <span>Ready to customize</span>
            </div>
          </div>
        </div>
        <button
          onClick={handleCreateTemplate}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Create Template
        </button>
      </div>

      {/* Filters */}
      <div className={`rounded-lg p-6 mb-6 transition-colors duration-200 ${
        isDarkMode 
          ? 'glass border border-gray-700' 
          : 'bg-white border border-gray-200 shadow-sm'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Search Templates
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, description, or tags..."
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="include_public"
                checked={includePublic}
                onChange={(e) => setIncludePublic(e.target.checked)}
                className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border rounded ${
                  isDarkMode 
                    ? 'border-gray-600 bg-gray-800' 
                    : 'border-gray-300 bg-white'
                }`}
              />
              <label htmlFor="include_public" className={`ml-2 block text-sm ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Include public templates
              </label>
            </div>
          </div>

          <div className="flex items-end">
            <div className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </div>
        
        {/* Clear filters */}
        {(searchTerm || selectedCategory) && (
          <div className={`mt-4 pt-4 border-t ${
            isDarkMode ? 'border-gray-600' : 'border-gray-200'
          }`}>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
              }}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Category Showcase - only show when no filters are active */}
      {!searchTerm && !selectedCategory && (
        <TemplateCategoryShowcase
          onCategorySelect={handleCategorySelect}
          onTemplatePreview={handlePreviewTemplate}
        />
      )}

      {/* Templates Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <div className={`mb-4 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {searchTerm || selectedCategory ? 'No templates match your filters' : 'No templates found'}
          </div>
          {!searchTerm && !selectedCategory && (
            <button
              onClick={handleCreateTemplate}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Your First Template
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Featured Templates Section */}
          {!searchTerm && !selectedCategory && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-xl font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  🌟 Proven Templates
                </h2>
                <span className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Ready-to-use professional templates
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {filteredTemplates
                  .filter(template => template.user_id === 'system_templates' && template.rating >= 4.5)
                  .slice(0, 6)
                  .map(template => (
                    <div key={template.id} className={`rounded-lg shadow-sm border border-blue-500 hover:shadow-md transition-all duration-200 relative ${
                      isDarkMode 
                        ? 'glass' 
                        : 'bg-white shadow-sm hover:shadow-lg'
                    }`}>
                      <div className="absolute top-3 right-3">
                        <span className="px-2 py-1 bg-yellow-600 text-yellow-100 text-xs rounded-full flex items-center">
                          ⭐ {template.rating}
                        </span>
                      </div>
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1 pr-8">
                            <h3 className={`text-lg font-semibold mb-1 ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {template.name}
                            </h3>
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="px-2 py-1 bg-blue-600 text-blue-100 text-xs rounded">
                                {template.category.replace('_', ' ')}
                              </span>
                              <span className="px-2 py-1 bg-green-600 text-green-100 text-xs rounded">
                                Proven
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className={`text-sm mb-4 line-clamp-3 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {template.description}
                        </p>

                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Variables:</span>
                            <span className={`font-medium ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {template.variables.length}
                            </span>
                          </div>
                          
                          <div className="flex justify-between text-sm">
                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Usage:</span>
                            <span className={`font-medium ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {template.usage_count || 0}
                            </span>
                          </div>
                        </div>

                        {template.tags && template.tags.length > 0 && (
                          <div className={`mt-4 pt-4 border-t ${
                            isDarkMode ? 'border-gray-600' : 'border-gray-200'
                          }`}>
                            <div className="flex flex-wrap gap-1">
                              {template.tags.slice(0, 3).map(tag => (
                                <span key={tag} className={`px-2 py-1 text-xs rounded ${
                                  isDarkMode 
                                    ? 'bg-gray-700 text-gray-300' 
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {tag}
                                </span>
                              ))}
                              {template.tags.length > 3 && (
                                <span className={`px-2 py-1 text-xs rounded ${
                                  isDarkMode 
                                    ? 'bg-gray-700 text-gray-300' 
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                  +{template.tags.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        <div className={`mt-4 pt-4 border-t flex justify-between items-center ${
                          isDarkMode ? 'border-gray-600' : 'border-gray-200'
                        }`}>
                          <div className={`text-xs ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            Professional Template
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handlePreviewTemplate(template)}
                              className={`px-3 py-1 rounded text-sm transition-colors ${
                                isDarkMode 
                                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              Preview
                            </button>
                            <button
                              onClick={() => handleDuplicateTemplate(template)}
                              className="px-3 py-1 bg-blue-600 text-blue-100 rounded text-sm hover:bg-blue-700 transition-colors"
                            >
                              Use Template
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* All Templates Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {searchTerm || selectedCategory ? 'Search Results' : 'All Templates'}
              </h2>
              <span className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map(template => (
                <div key={template.id} className={`rounded-lg shadow-sm border hover:shadow-md transition-all duration-200 ${
                  isDarkMode 
                    ? 'glass border-gray-600' 
                    : 'bg-white border-gray-200 shadow-sm hover:shadow-lg'
                }`}>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className={`text-lg font-semibold mb-1 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {template.name}
                        </h3>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="px-2 py-1 bg-blue-600 text-blue-100 text-xs rounded">
                            {template.category.replace('_', ' ')}
                          </span>
                          {template.is_public && (
                            <span className="px-2 py-1 bg-green-600 text-green-100 text-xs rounded">
                              Public
                            </span>
                          )}
                          {template.user_id === 'system_templates' && (
                            <span className="px-2 py-1 bg-purple-600 text-purple-100 text-xs rounded">
                              Proven
                            </span>
                          )}
                          {template.is_owner && (
                            <span className="px-2 py-1 bg-purple-600 text-purple-100 text-xs rounded">
                              Owner
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handlePreviewTemplate(template)}
                          className={`p-1 transition-colors ${
                            isDarkMode 
                              ? 'text-gray-400 hover:text-purple-400' 
                              : 'text-gray-500 hover:text-purple-600'
                          }`}
                          title="Preview template"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        
                        <button
                          onClick={() => handleEditTemplate(template)}
                          disabled={template.user_id === 'system_templates' ? false : !template.is_owner}
                          className={`p-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            isDarkMode 
                              ? 'text-gray-400 hover:text-blue-400' 
                              : 'text-gray-500 hover:text-blue-600'
                          }`}
                          title={
                            template.user_id === 'system_templates' 
                              ? "Duplicate this proven template" 
                              : template.is_owner 
                                ? "Edit template" 
                                : "You can only edit your own templates"
                          }
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        
                        <button
                          onClick={() => handleDuplicateTemplate(template)}
                          className={`p-1 transition-colors ${
                            isDarkMode 
                              ? 'text-gray-400 hover:text-green-400' 
                              : 'text-gray-500 hover:text-green-600'
                          }`}
                          title="Duplicate template"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                        
                        {template.is_owner && (
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            className={`p-1 transition-colors ${
                              isDarkMode 
                                ? 'text-gray-400 hover:text-red-400' 
                                : 'text-gray-500 hover:text-red-600'
                            }`}
                            title="Delete template"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    <p className={`text-sm mb-4 line-clamp-3 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {template.description}
                    </p>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Variables:</span>
                        <span className={`font-medium ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {template.variables.length}
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Usage:</span>
                        <span className={`font-medium ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {template.usage_count || 0}
                        </span>
                      </div>
                      
                      {template.rating > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Rating:</span>
                          <div className="flex items-center">
                            <span className={`font-medium mr-1 ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {template.rating.toFixed(1)}
                            </span>
                            <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>

                    {template.tags && template.tags.length > 0 && (
                      <div className={`mt-4 pt-4 border-t ${
                        isDarkMode ? 'border-gray-600' : 'border-gray-200'
                      }`}>
                        <div className="flex flex-wrap gap-1">
                          {template.tags.slice(0, 3).map(tag => (
                            <span key={tag} className={`px-2 py-1 text-xs rounded ${
                              isDarkMode 
                                ? 'bg-gray-700 text-gray-300' 
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {tag}
                            </span>
                          ))}
                          {template.tags.length > 3 && (
                            <span className={`px-2 py-1 text-xs rounded ${
                              isDarkMode 
                                ? 'bg-gray-700 text-gray-300' 
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              +{template.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className={`mt-4 pt-4 border-t ${
                      isDarkMode ? 'border-gray-600' : 'border-gray-200'
                    }`}>
                      <div className={`text-xs ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Created {new Date(template.created_at).toLocaleDateString()}
                        {template.updated_at !== template.created_at && (
                          <span> • Updated {new Date(template.updated_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      
      {/* Template Preview Modal */}
      {showPreview && previewTemplate && (
        <TemplatePreview
          template={previewTemplate}
          onClose={() => {
            setShowPreview(false);
            setPreviewTemplate(null);
          }}
          onUseTemplate={handleUseTemplate}
        />
      )}
    </div>
  );
};

export default PromptTemplates;