import { useState, useEffect } from 'react';

const PromptTemplateEditor = ({ 
  template, 
  onSave, 
  onCancel, 
  isEditing = false,
  categories = []
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'custom',
    template_content: '',
    variables: [],
    is_public: false,
    tags: []
  });

  const [currentVariable, setCurrentVariable] = useState({
    name: '',
    type: 'text',
    description: '',
    default_value: '',
    options: [],
    required: true,
    placeholder: '',
    validation_regex: ''
  });

  const [showVariableForm, setShowVariableForm] = useState(false);
  const [editingVariableIndex, setEditingVariableIndex] = useState(-1);
  const [previewMode, setPreviewMode] = useState(false);
  const [errors, setErrors] = useState({});

  const variableTypes = [
    { value: 'text', label: 'Text Input' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'number', label: 'Number' },
    { value: 'select', label: 'Select Dropdown' },
    { value: 'boolean', label: 'Checkbox' }
  ];

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
        description: template.description || '',
        category: template.category || 'custom',
        template_content: template.template_content || '',
        variables: template.variables || [],
        is_public: template.is_public || false,
        tags: template.tags || []
      });
    }
  }, [template]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleVariableChange = (field, value) => {
    setCurrentVariable(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addVariable = () => {
    if (!currentVariable.name.trim()) {
      alert('Variable name is required');
      return;
    }

    // Check for duplicate variable names
    const existingNames = formData.variables.map(v => v.name);
    if (existingNames.includes(currentVariable.name) && editingVariableIndex === -1) {
      alert('Variable name already exists');
      return;
    }

    const newVariables = [...formData.variables];
    
    if (editingVariableIndex >= 0) {
      // Editing existing variable
      newVariables[editingVariableIndex] = { ...currentVariable };
      setEditingVariableIndex(-1);
    } else {
      // Adding new variable
      newVariables.push({ ...currentVariable });
    }

    setFormData(prev => ({
      ...prev,
      variables: newVariables
    }));

    // Reset form
    setCurrentVariable({
      name: '',
      type: 'text',
      description: '',
      default_value: '',
      options: [],
      required: true,
      placeholder: '',
      validation_regex: ''
    });
    setShowVariableForm(false);
  };

  const editVariable = (index) => {
    setCurrentVariable({ ...formData.variables[index] });
    setEditingVariableIndex(index);
    setShowVariableForm(true);
  };

  const removeVariable = (index) => {
    const newVariables = formData.variables.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      variables: newVariables
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Template name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.template_content.trim()) {
      newErrors.template_content = 'Template content is required';
    }

    // Check for variables in template content
    const variableMatches = formData.template_content.match(/{{(\w+)}}/g);
    if (variableMatches) {
      const templateVariables = variableMatches.map(match => match.slice(2, -2));
      const definedVariables = formData.variables.map(v => v.name);
      
      const missingVariables = templateVariables.filter(v => !definedVariables.includes(v));
      if (missingVariables.length > 0) {
        newErrors.template_content = `Missing variable definitions: ${missingVariables.join(', ')}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    onSave(formData);
  };

  const renderPreview = () => {
    let previewContent = formData.template_content;
    
    // Replace variables with example values
    formData.variables.forEach(variable => {
      const placeholder = `{{${variable.name}}}`;
      let exampleValue = variable.default_value || `[${variable.name}]`;
      
      if (variable.type === 'select' && variable.options && variable.options.length > 0) {
        exampleValue = variable.options[0];
      } else if (variable.type === 'boolean') {
        exampleValue = 'true';
      } else if (variable.type === 'number') {
        exampleValue = '42';
      }
      
      previewContent = previewContent.replace(new RegExp(placeholder, 'g'), exampleValue);
    });

    return previewContent;
  };

  const insertVariable = (variableName) => {
    const textarea = document.getElementById('template-content');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.template_content;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    
    const newText = before + `{{${variableName}}}` + after;
    handleInputChange('template_content', newText);
    
    // Set cursor position after inserted variable
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variableName.length + 4, start + variableName.length + 4);
    }, 0);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 glass rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">
          {isEditing ? 'Edit Prompt Template' : 'Create New Prompt Template'}
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="px-4 py-2 bg-blue-600 text-blue-100 rounded-md hover:bg-blue-700 transition-colors"
          >
            {previewMode ? 'Edit Mode' : 'Preview Mode'}
          </button>
        </div>
      </div>

      {previewMode ? (
        <div className="space-y-6">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">Template Preview</h3>
            <div className="bg-gray-900 p-4 rounded border border-gray-600">
              <pre className="whitespace-pre-wrap text-sm text-gray-200">{renderPreview()}</pre>
            </div>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">Variables ({formData.variables.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.variables.map((variable, index) => (
                <div key={index} className="bg-gray-900 p-3 rounded border border-gray-600">
                  <div className="font-medium text-white">{variable.name}</div>
                  <div className="text-sm text-gray-300">{variable.type}</div>
                  <div className="text-sm text-gray-400">{variable.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Template Details */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Template Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 bg-gray-800 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 ${
                  errors.name ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="e.g., Professional LinkedIn Post"
              />
              {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 bg-gray-800 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 ${
                  errors.description ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Describe what this template is used for..."
              />
              {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={formData.tags.join(', ')}
                onChange={(e) => handleInputChange('tags', e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                placeholder="e.g., marketing, social media, professional"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_public"
                checked={formData.is_public}
                onChange={(e) => handleInputChange('is_public', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-800"
              />
              <label htmlFor="is_public" className="ml-2 block text-sm text-gray-300">
                Make this template public (visible to all users)
              </label>
            </div>
          </div>

          {/* Right Column - Template Content */}
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-300">
                  Template Content *
                </label>
                <div className="text-xs text-gray-400">
                  Use {`{{variable_name}}`} for placeholders
                </div>
              </div>
              <textarea
                id="template-content"
                value={formData.template_content}
                onChange={(e) => handleInputChange('template_content', e.target.value)}
                rows={12}
                className={`w-full px-3 py-2 bg-gray-800 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm text-white placeholder-gray-400 ${
                  errors.template_content ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Write your prompt template here. Use {`{{variable_name}}`} for dynamic content..."
              />
              {errors.template_content && <p className="text-red-400 text-sm mt-1">{errors.template_content}</p>}
            </div>

            {/* Quick Insert Variables */}
            {formData.variables.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Quick Insert Variables
                </label>
                <div className="flex flex-wrap gap-2">
                  {formData.variables.map((variable, index) => (
                    <button
                      key={index}
                      onClick={() => insertVariable(variable.name)}
                      className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600 transition-colors"
                    >
                      {variable.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!previewMode && (
        <>
          {/* Variables Section */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">
                Variables ({formData.variables.length})
              </h3>
              <button
                onClick={() => setShowVariableForm(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Add Variable
              </button>
            </div>

            {/* Variables List */}
            <div className="space-y-2">
              {formData.variables.map((variable, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <span className="font-medium text-white">{variable.name}</span>
                      <span className="px-2 py-1 bg-blue-600 text-blue-100 text-xs rounded">
                        {variable.type}
                      </span>
                      {variable.required && (
                        <span className="px-2 py-1 bg-red-600 text-red-100 text-xs rounded">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-300 mt-1">{variable.description}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => editVariable(index)}
                      className="px-3 py-1 bg-blue-600 text-blue-100 rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => removeVariable(index)}
                      className="px-3 py-1 bg-red-600 text-red-100 rounded text-sm hover:bg-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Variable Form Modal */}
            {showVariableForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 lg:left-[280px]">
                <div className="glass p-6 rounded-lg max-w-md w-full mx-4">
                  <h4 className="text-lg font-semibold text-white mb-4">
                    {editingVariableIndex >= 0 ? 'Edit Variable' : 'Add Variable'}
                  </h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Variable Name *
                      </label>
                      <input
                        type="text"
                        value={currentVariable.name}
                        onChange={(e) => handleVariableChange('name', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                        placeholder="e.g., topic, tone, length"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Type
                      </label>
                      <select
                        value={currentVariable.type}
                        onChange={(e) => handleVariableChange('type', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                      >
                        {variableTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={currentVariable.description}
                        onChange={(e) => handleVariableChange('description', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                        placeholder="Describe this variable..."
                      />
                    </div>

                    {currentVariable.type === 'select' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Options (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={currentVariable.options.join(', ')}
                          onChange={(e) => handleVariableChange('options', e.target.value.split(',').map(opt => opt.trim()).filter(opt => opt))}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                          placeholder="option1, option2, option3"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Default Value
                      </label>
                      <input
                        type="text"
                        value={currentVariable.default_value}
                        onChange={(e) => handleVariableChange('default_value', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                        placeholder="Default value..."
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="variable_required"
                        checked={currentVariable.required}
                        onChange={(e) => handleVariableChange('required', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-800"
                      />
                      <label htmlFor="variable_required" className="ml-2 block text-sm text-gray-300">
                        Required field
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={() => {
                        setShowVariableForm(false);
                        setEditingVariableIndex(-1);
                        setCurrentVariable({
                          name: '',
                          type: 'text',
                          description: '',
                          default_value: '',
                          options: [],
                          required: true,
                          placeholder: '',
                          validation_regex: ''
                        });
                      }}
                      className="px-4 py-2 bg-gray-600 text-gray-200 rounded-md hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addVariable}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      {editingVariableIndex >= 0 ? 'Update' : 'Add'} Variable
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-600">
        <button
          onClick={onCancel}
          className="px-6 py-2 bg-gray-600 text-gray-200 rounded-md hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          {isEditing ? 'Update Template' : 'Create Template'}
        </button>
      </div>
    </div>
  );
};

export default PromptTemplateEditor;