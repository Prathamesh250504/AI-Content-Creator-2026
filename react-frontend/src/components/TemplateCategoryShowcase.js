import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';

const TemplateCategoryShowcase = ({ onCategorySelect, onTemplatePreview }) => {
  const { user } = useUser();
  const [categories, setCategories] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCategoriesAndTemplates = useCallback(async () => {
    try {
      if (user && user.token) {
        // Authenticated user - load full template data
        const categoriesResponse = await fetch('/api/prompt-categories');
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          setCategories(categoriesData.categories || []);
        }

        const templatesResponse = await fetch('/api/prompt-templates?include_public=true', {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
        if (templatesResponse.ok) {
          const templatesData = await templatesResponse.json();
          setTemplates(templatesData.templates || []);
        }
      } else {
        // Unauthenticated user - load showcase data
        const showcaseResponse = await fetch('/api/template-showcase');
        if (showcaseResponse.ok) {
          const showcaseData = await showcaseResponse.json();
          setCategories(showcaseData.categories || []);
          setTemplates(showcaseData.sample_templates || []);
        }
      }
    } catch (error) {
      console.error('Failed to load categories and templates:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadCategoriesAndTemplates();
  }, [loadCategoriesAndTemplates]);

  const getCategoryIcon = (categoryValue) => {
    const icons = {
      social_media: '📱',
      marketing: '📈',
      content_creation: '✍️',
      business: '💼',
      creative: '🎨',
      technical: '⚙️',
      custom: '🔧'
    };
    return icons[categoryValue] || '📄';
  };

  const getCategoryTemplates = (categoryValue) => {
    return templates
      .filter(t => t.category === categoryValue && t.user_id === 'system_templates')
      .slice(0, 3);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show login prompt if user is not authenticated
  if (!user) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Browse by Category</h2>
          <p className="text-gray-400">Discover proven templates for every use case</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {categories
            .filter(category => category.value !== 'custom')
            .map(category => {
              const categoryTemplates = getCategoryTemplates(category.value);
              
              return (
                <div
                  key={category.value}
                  className="glass rounded-lg p-6 hover:border-blue-500 transition-colors"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-2xl">{getCategoryIcon(category.value)}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{category.label}</h3>
                      <p className="text-sm text-gray-400">
                        Professional templates available
                      </p>
                    </div>
                  </div>

                  {categoryTemplates.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-300 mb-2">Sample Templates:</p>
                      {categoryTemplates.map(template => (
                        <div
                          key={template.id}
                          className="p-2 bg-gray-800 rounded hover:bg-gray-700 transition-colors"
                        >
                          <div className="text-sm font-medium text-white truncate">
                            {template.name}
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-gray-400">
                              {template.variables.length} variables
                            </span>
                            {template.rating > 0 && (
                              <span className="text-xs text-yellow-400">
                                ⭐ {template.rating}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-600">
                    <div className="text-blue-400 text-sm font-medium">
                      Sign in to access all templates →
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Sign-in CTA */}
        <div className="glass rounded-lg p-8 text-center">
          <h3 className="text-xl font-bold text-white mb-2">Ready to Get Started?</h3>
          <p className="text-gray-300 mb-4">
            Sign in to access our complete library of professional prompt templates
          </p>
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
            Sign In to Access All Templates
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Browse by Category</h2>
        <p className="text-gray-400">Discover proven templates for every use case</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories
          .filter(category => category.value !== 'custom')
          .map(category => {
            const categoryTemplates = getCategoryTemplates(category.value);
            
            return (
              <div
                key={category.value}
                className="glass rounded-lg p-6 hover:border-blue-500 transition-colors cursor-pointer"
                onClick={() => onCategorySelect(category.value)}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-2xl">{getCategoryIcon(category.value)}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{category.label}</h3>
                    <p className="text-sm text-gray-400">
                      {categoryTemplates.length} proven template{categoryTemplates.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {categoryTemplates.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-300 mb-2">Featured Templates:</p>
                    {categoryTemplates.map(template => (
                      <div
                        key={template.id}
                        className="flex items-center justify-between p-2 bg-gray-800 rounded hover:bg-gray-700 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          onTemplatePreview(template);
                        }}
                      >
                        <div className="flex-1">
                          <div className="text-sm font-medium text-white truncate">
                            {template.name}
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-gray-400">
                              {template.variables.length} variables
                            </span>
                            {template.rating > 0 && (
                              <span className="text-xs text-yellow-400">
                                ⭐ {template.rating}
                              </span>
                            )}
                          </div>
                        </div>
                        <button className="text-gray-400 hover:text-blue-400 ml-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-600">
                  <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                    View all {category.label.toLowerCase()} templates →
                  </button>
                </div>
              </div>
            );
          })}
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-400">
            {templates.filter(t => t.user_id === 'system_templates').length}
          </div>
          <div className="text-sm text-gray-400">Proven Templates</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-400">
            {categories.length - 1}
          </div>
          <div className="text-sm text-gray-400">Categories</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-yellow-400">
            {templates.filter(t => t.rating >= 4.5).length}
          </div>
          <div className="text-sm text-gray-400">High-Rated</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-400">
            {templates.reduce((sum, t) => sum + (t.variables?.length || 0), 0)}
          </div>
          <div className="text-sm text-gray-400">Total Variables</div>
        </div>
      </div>
    </div>
  );
};

export default TemplateCategoryShowcase;