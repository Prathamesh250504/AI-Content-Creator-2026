import { useState, useRef } from 'react';
import { useBatch } from '../contexts/BatchContext';

const BatchUploadModal = ({ isOpen, onClose, onSuccess }) => {
  const { createBatchJobFromCsv, downloadCsvTemplate, parseCsvForPreview, templates, createBatchJob } = useBatch();
  const [uploadMethod, setUploadMethod] = useState('csv'); // 'csv' or 'manual'
  const [csvFile, setCsvFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState([]);
  const [manualItems, setManualItems] = useState([{ template_key: 'linkedin_post', user_prompt: '', parameters: {} }]);
  const [jobName, setJobName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('linkedin_post');
  const fileInputRef = useRef(null);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setCsvFile(file);
    
    // Preview CSV content
    try {
      const text = await file.text();
      const items = await parseCsvForPreview(text);
      setCsvPreview(items.slice(0, 5)); // Show first 5 items
    } catch (error) {
      console.error('CSV preview error:', error);
      setCsvPreview([]);
    }
  };

  const handleManualItemChange = (index, field, value) => {
    setManualItems(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const handleManualParameterChange = (index, paramKey, paramValue) => {
    setManualItems(prev => 
      prev.map((item, i) => 
        i === index 
          ? { 
              ...item, 
              parameters: { ...item.parameters, [paramKey]: paramValue }
            }
          : item
      )
    );
  };

  const addManualItem = () => {
    setManualItems(prev => [
      ...prev,
      { template_key: selectedTemplate, user_prompt: '', parameters: {} }
    ]);
  };

  const removeManualItem = (index) => {
    setManualItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!jobName.trim()) {
      alert('Please enter a job name');
      return;
    }

    setIsUploading(true);
    
    try {
      let jobId;
      
      if (uploadMethod === 'csv' && csvFile) {
        jobId = await createBatchJobFromCsv(csvFile, jobName, jobDescription);
      } else if (uploadMethod === 'manual') {
        const validItems = manualItems.filter(item => item.user_prompt.trim());
        if (validItems.length === 0) {
          alert('Please add at least one item with a prompt');
          return;
        }
        
        // createBatchJob is now available from the hook at the top level
        jobId = await createBatchJob(jobName, jobDescription, validItems);
      }
      
      onSuccess(jobId);
      onClose();
      resetForm();
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setCsvFile(null);
    setCsvPreview([]);
    setManualItems([{ template_key: 'linkedin_post', user_prompt: '', parameters: {} }]);
    setJobName('');
    setJobDescription('');
    setUploadMethod('csv');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      {/* Modal positioned to start after sidebar on desktop */}
      <div className="fixed inset-y-0 right-0 left-0 lg:left-[280px] flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Create Batch Job</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Job Details */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Job Name *
                </label>
                <input
                  type="text"
                  value={jobName}
                  onChange={(e) => setJobName(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter job name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional description"
                />
              </div>
            </div>
          </div>

          {/* Upload Method Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Upload Method
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="csv"
                  checked={uploadMethod === 'csv'}
                  onChange={(e) => setUploadMethod(e.target.value)}
                  className="mr-2"
                />
                <span className="text-white">CSV Upload</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="manual"
                  checked={uploadMethod === 'manual'}
                  onChange={(e) => setUploadMethod(e.target.value)}
                  className="mr-2"
                />
                <span className="text-white">Manual Entry</span>
              </label>
            </div>
          </div>

          {/* CSV Upload */}
          {uploadMethod === 'csv' && (
            <div className="mb-6">
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={() => downloadCsvTemplate(selectedTemplate)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Download Template
                </button>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {templates.map(template => (
                    <option key={template.key} value={template.key}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Choose CSV File
                </button>
                <p className="text-gray-400 mt-2">
                  Upload a CSV file with your content prompts
                </p>
                {csvFile && (
                  <p className="text-green-400 mt-2">
                    Selected: {csvFile.name}
                  </p>
                )}
              </div>

              {/* CSV Preview */}
              {csvPreview.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">
                    Preview (first 5 items):
                  </h4>
                  <div className="bg-gray-700 rounded-lg p-4 max-h-40 overflow-y-auto">
                    {csvPreview.map((item, index) => (
                      <div key={index} className="mb-2 pb-2 border-b border-gray-600 last:border-b-0">
                        <div className="text-sm text-white font-medium">{item.template_key}</div>
                        <div className="text-sm text-gray-300 truncate">{item.user_prompt}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Manual Entry */}
          {uploadMethod === 'manual' && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-gray-300">Content Items</h4>
                <button
                  onClick={addManualItem}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                >
                  Add Item
                </button>
              </div>

              <div className="space-y-4 max-h-60 overflow-y-auto">
                {manualItems.map((item, index) => (
                  <div key={index} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-300">Item {index + 1}</span>
                      {manualItems.length > 1 && (
                        <button
                          onClick={() => removeManualItem(index)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Template</label>
                        <select
                          value={item.template_key}
                          onChange={(e) => handleManualItemChange(index, 'template_key', e.target.value)}
                          className="w-full bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {templates.map(template => (
                            <option key={template.key} value={template.key}>
                              {template.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Tone</label>
                        <input
                          type="text"
                          value={item.parameters.tone || ''}
                          onChange={(e) => handleManualParameterChange(index, 'tone', e.target.value)}
                          className="w-full bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Professional"
                        />
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="block text-xs text-gray-400 mb-1">Prompt *</label>
                      <textarea
                        value={item.user_prompt}
                        onChange={(e) => handleManualItemChange(index, 'user_prompt', e.target.value)}
                        className="w-full bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        rows={2}
                        placeholder="Enter your content prompt..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isUploading || !jobName.trim() || (uploadMethod === 'csv' && !csvFile) || (uploadMethod === 'manual' && !manualItems.some(item => item.user_prompt.trim()))}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            {isUploading ? 'Creating...' : 'Create Batch Job'}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default BatchUploadModal;