import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Sparkles, 
  Eye,
  Star,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Zap
} from 'lucide-react';
import { useContent } from '../contexts/ContentContext';

// Move TemplateCard outside to prevent recreation on every render
const TemplateCard = React.memo(({ template, templateCategories, onPreview, onUse }) => {
  const category = templateCategories[template.key] || 'Other';
  const requiredCount = template.required_fields?.length || 0;
  const optionalCount = template.optional_fields?.length || 0;
  const toneCount = template.tone_options?.length || 0;

  return (
    <div className="template-card glass rounded-xl p-6 cursor-pointer group">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <div className="flex items-center space-x-2">
          <Star className="w-4 h-4 text-yellow-400" />
          <span className="text-sm text-gray-400">4.8</span>
        </div>
      </div>
      
      <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-300 transition-colors">
        {template.name}
      </h3>
      
      <p className="text-gray-400 text-sm mb-4 leading-relaxed">
        {template.description}
      </p>
      
      {/* Template Stats */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">
          {category}
        </span>
        <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
          {toneCount} tones
        </span>
        <span className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded-full">
          {requiredCount} required
        </span>
        <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full">
          {optionalCount} optional
        </span>
      </div>
      
      <div className="flex items-center justify-between">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onPreview(template);
          }}
          className="p-2 glass glass-hover rounded-lg group-hover:bg-purple-500/20 transition-colors"
        >
          <Eye className="w-4 h-4 text-gray-400 group-hover:text-purple-300" />
        </button>
        
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onUse(template);
          }}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center"
        >
          Use Template
          <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  );
});

TemplateCard.displayName = 'TemplateCard';

const Templates = () => {
  const { templates, loadTemplates } = useContent();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // Memoize template categories to prevent re-computation
  const templateCategories = useMemo(() => ({
    'linkedin_post': 'Social Media',
    'email_marketing': 'Email',
    'ad_copy': 'Marketing',
    'blog_intro': 'Blog',
    'product_description': 'E-commerce',
    'press_release': 'PR',
    'social_media_caption': 'Social Media'
  }), []);

  // Memoize categories to prevent re-computation
  const categories = useMemo(() => {
    const cats = ['All'];
    templates.forEach(template => {
      const category = templateCategories[template.key] || 'Other';
      if (!cats.includes(category)) {
        cats.push(category);
      }
    });
    return cats;
  }, [templates, templateCategories]);

  // Memoize filtered templates to prevent re-computation
  const filteredTemplates = useMemo(() => {
    if (selectedCategory === 'All') return templates;
    return templates.filter(template => 
      templateCategories[template.key] === selectedCategory
    );
  }, [templates, selectedCategory, templateCategories]);

  // Use useCallback to prevent function recreation
  const handleUseTemplate = useCallback((template) => {
    // Store current scroll position
    const scrollPosition = window.pageYOffset;
    sessionStorage.setItem('templatesScrollPosition', scrollPosition.toString());
    
    // Close modal first if open
    setSelectedTemplate(null);
    
    // Navigate without replacing history
    navigate('/generator', { 
      state: { selectedTemplate: template },
      replace: false
    });
  }, [navigate]);

  // Restore scroll position when returning to templates
  useEffect(() => {
    const savedScrollPosition = sessionStorage.getItem('templatesScrollPosition');
    if (savedScrollPosition) {
      window.scrollTo(0, parseInt(savedScrollPosition));
      sessionStorage.removeItem('templatesScrollPosition');
    }
  }, []);

  // Memoize preview handler
  const handlePreviewTemplate = useCallback((template) => {
    setSelectedTemplate(template);
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="bg-hero-gradient rounded-3xl p-8 mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">📝 Content Templates</h1>
          <p className="text-xl text-white/90">Choose from professionally crafted templates</p>
        </div>
      </motion.div>

      {/* Template Categories */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex flex-wrap gap-4 mb-8">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                selectedCategory === category
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'glass glass-hover text-white'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Templates Grid */}
      <div className="templates-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template, index) => (
          <TemplateCard
            key={template.key || index}
            template={template}
            templateCategories={templateCategories}
            onPreview={handlePreviewTemplate}
            onUse={handleUseTemplate}
          />
        ))}
      </div>

      {/* Template Detail Modal */}
      {selectedTemplate && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 lg:left-[280px]"
          onClick={() => setSelectedTemplate(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-white">{selectedTemplate.name}</h2>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="p-2 glass glass-hover rounded-lg text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-gray-300 text-lg mb-6 leading-relaxed">
              {selectedTemplate.description}
            </p>

            {/* Template Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Tone Options */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <h3 className="text-blue-300 font-semibold mb-3 flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
                  Available Tones ({selectedTemplate.tone_options?.length || 0})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.tone_options?.map((tone) => (
                    <span key={tone} className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                      {tone}
                    </span>
                  ))}
                </div>
              </div>

              {/* Length Options */}
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <h3 className="text-green-300 font-semibold mb-3 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Length Options ({selectedTemplate.length_options?.length || 0})
                </h3>
                <div className="space-y-2">
                  {selectedTemplate.length_options?.map((length) => (
                    <div key={length} className="text-green-200 text-sm">
                      • {length}
                    </div>
                  ))}
                </div>
              </div>

              {/* Required Fields */}
              {selectedTemplate.required_fields && selectedTemplate.required_fields.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <h3 className="text-red-300 font-semibold mb-3 flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    Required Fields ({selectedTemplate.required_fields.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedTemplate.required_fields.map((field) => (
                      <div key={field} className="text-red-200 text-sm flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-red-400" />
                        {field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Optional Fields */}
              {selectedTemplate.optional_fields && selectedTemplate.optional_fields.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <h3 className="text-yellow-300 font-semibold mb-3 flex items-center">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Optional Fields ({selectedTemplate.optional_fields.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedTemplate.optional_fields.map((field) => (
                      <div key={field} className="text-yellow-200 text-sm flex items-center">
                        <span className="w-4 h-4 mr-2 text-yellow-400">○</span>
                        {field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Formatting Guidelines */}
            {selectedTemplate.formatting_guidelines && Array.isArray(selectedTemplate.formatting_guidelines) && selectedTemplate.formatting_guidelines.length > 0 && (
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-6 mb-8">
                <h3 className="text-purple-300 font-semibold mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Formatting Guidelines
                </h3>
                <ul className="space-y-2">
                  {selectedTemplate.formatting_guidelines.map((guideline, index) => (
                    <li key={index} className="text-purple-200 text-sm flex items-start">
                      <span className="text-purple-400 mr-2 mt-1">•</span>
                      {guideline}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => handleUseTemplate(selectedTemplate)}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-4 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Use This Template
              </button>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="px-6 py-4 glass glass-hover text-white rounded-lg font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Quick Start Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-2xl p-6"
      >
        <h3 className="text-xl font-bold text-white mb-6 flex items-center">
          <Sparkles className="w-6 h-6 mr-2" />
          Quick Start Guide
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold">1</span>
            </div>
            <h4 className="font-semibold text-white mb-2">Choose Template</h4>
            <p className="text-gray-400 text-sm">Select a template that matches your content needs</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold">2</span>
            </div>
            <h4 className="font-semibold text-white mb-2">Customize</h4>
            <p className="text-gray-400 text-sm">Fill in your specific requirements and preferences</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold">3</span>
            </div>
            <h4 className="font-semibold text-white mb-2">Generate</h4>
            <p className="text-gray-400 text-sm">Let AI create professional content for you</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Templates;