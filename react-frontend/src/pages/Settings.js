import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Palette,
  Bell,
  Shield,
  Save,
  Moon,
  Sun,
  Settings as SettingsIcon,
  Trash2,
  Download,
  Upload,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../contexts/NotificationContext';
import CustomSelect from '../components/CustomSelect';
import { apiService } from '../services/api';

const Settings = () => {
  const { user, updatePreferences } = useUser();
  const { theme, toggleTheme } = useTheme();
  const { showSuccess, showError, showProfileUpdate } = useNotifications();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Enhanced form data with all preferences
  const [formData, setFormData] = useState({
    // Personal Information
    name: '',
    email: '',
    company: '',
    role: '',
    
    // Content Preferences
    default_tone: 'professional',
    default_writing_style: 'formal',
    default_industry: 'technology',
    default_audience: 'professionals',
    default_content_length: 'medium',
    content_generation_language: 'english',
    
    // Advanced Preferences
    preferred_cta_style: 'strong',
    default_urgency_level: 'medium',
    personalization_level: 'medium',
    include_keywords_by_default: false,
    default_geographic_region: 'global',
    
    // UI Preferences
    theme: 'dark',
    language: 'en',
    timezone: 'UTC',
    notifications_enabled: true,
    
    // Content Generation Settings
    auto_save_content: true,
    show_generation_tips: true,
    enable_advanced_parameters: true,
    default_template: 'linkedin_post',
    
    // Privacy Settings
    data_retention_days: 365,
    analytics_enabled: true,
    share_usage_data: false
  });

  useEffect(() => {
    loadUserProfile();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      
      // Use user data from context if available
      if (user?.preferences) {
        setFormData(prev => ({
          ...prev,
          ...user.preferences
        }));
      } else {
        // Fallback to API call
        const response = await apiService.getUserProfile('default_user');
        
        if (response.success && response.profile) {
          const preferences = response.profile.preferences || {};
          setFormData(prev => ({
            ...prev,
            ...preferences
          }));
        }
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      showMessage('error', 'Failed to load profile settings');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Update preferences using the UserContext
      await updatePreferences(formData);
      
      // Show success message and notification
      showMessage('success', 'Settings saved successfully!');
      
      // Show profile update notification if name was changed
      if (formData.name && formData.name.trim()) {
        showProfileUpdate(formData.name);
      } else {
        showSuccess('Settings Updated', 'Your preferences have been saved successfully!');
      }
      
    } catch (error) {
      console.error('Failed to save settings:', error);
      showMessage('error', error.message || 'Failed to save settings');
      showError('Save Failed', error.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleExportProfile = async () => {
    try {
      const response = await fetch('/api/profile/default_user/preferences');
      const data = await response.json();
      
      if (data.success) {
        const blob = new Blob([JSON.stringify(data.preferences, null, 2)], {
          type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'profile-settings.json';
        a.click();
        URL.revokeObjectURL(url);
        
        showMessage('success', 'Profile exported successfully!');
      }
    } catch (error) {
      console.error('Failed to export profile:', error);
      showMessage('error', 'Failed to export profile');
    }
  };

  const handleImportProfile = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        setFormData(prev => ({
          ...prev,
          ...importedData
        }));
        showMessage('success', 'Profile imported successfully! Remember to save changes.');
      } catch (error) {
        showMessage('error', 'Invalid profile file format');
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = async () => {
    if (window.confirm('Are you sure you want to clear all your data? This action cannot be undone.')) {
      try {
        await fetch('/api/history/clear', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: 'default_user' })
        });
        
        showMessage('success', 'All data cleared successfully!');
      } catch (error) {
        showMessage('error', 'Failed to clear data');
      }
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'content', label: 'Content Preferences', icon: SettingsIcon },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security & Privacy', icon: Shield }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white mb-4">Profile Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter your company name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Role
                </label>
                <CustomSelect
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  placeholder="Select your role"
                  options={[
                    { value: '', label: 'Select role' },
                    { value: 'Content Creator', label: 'Content Creator' },
                    { value: 'Marketing Manager', label: 'Marketing Manager' },
                    { value: 'Social Media Manager', label: 'Social Media Manager' },
                    { value: 'Blogger', label: 'Blogger' },
                    { value: 'Business Owner', label: 'Business Owner' },
                    { value: 'Freelancer', label: 'Freelancer' },
                    { value: 'Other', label: 'Other' }
                  ]}
                />
              </div>
            </div>
          </div>
        );

      case 'content':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white mb-4">Content Generation Preferences</h3>
            
            {/* Style & Format Section */}
            <div className="glass rounded-lg p-6 relative z-[40] mb-8">
              <h4 className="text-lg font-medium text-white mb-4">Style & Format Defaults</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative z-[50]">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Default Tone</label>
                  <CustomSelect
                    name="default_tone"
                    value={formData.default_tone}
                    onChange={handleInputChange}
                    options={[
                      { value: 'professional', label: 'Professional' },
                      { value: 'casual', label: 'Casual' },
                      { value: 'persuasive', label: 'Persuasive' },
                      { value: 'friendly', label: 'Friendly' },
                      { value: 'authoritative', label: 'Authoritative' }
                    ]}
                  />
                </div>
                <div className="relative z-[50]">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Writing Style</label>
                  <CustomSelect
                    name="default_writing_style"
                    value={formData.default_writing_style}
                    onChange={handleInputChange}
                    options={[
                      { value: 'formal', label: 'Formal' },
                      { value: 'conversational', label: 'Conversational' },
                      { value: 'creative', label: 'Creative' },
                      { value: 'technical', label: 'Technical' },
                      { value: 'storytelling', label: 'Storytelling' }
                    ]}
                  />
                </div>
                <div className="relative z-[50]">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Content Length</label>
                  <CustomSelect
                    name="default_content_length"
                    value={formData.default_content_length}
                    onChange={handleInputChange}
                    options={[
                      { value: 'short', label: 'Short (50-150 words)' },
                      { value: 'medium', label: 'Medium (150-300 words)' },
                      { value: 'long', label: 'Long (300-500 words)' },
                      { value: 'very_long', label: 'Very Long (500+ words)' }
                    ]}
                  />
                </div>
                <div className="relative z-[50]">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Default Template</label>
                  <CustomSelect
                    name="default_template"
                    value={formData.default_template}
                    onChange={handleInputChange}
                    options={[
                      { value: 'linkedin_post', label: 'LinkedIn Post' },
                      { value: 'email_marketing', label: 'Email Marketing' },
                      { value: 'ad_copy', label: 'Ad Copy' },
                      { value: 'blog_intro', label: 'Blog Introduction' },
                      { value: 'product_description', label: 'Product Description' },
                      { value: 'press_release', label: 'Press Release' },
                      { value: 'social_media_caption', label: 'Social Media Caption' }
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* Audience & Context Section */}
            <div className="glass rounded-lg p-6 relative z-[30] mb-8">
              <h4 className="text-lg font-medium text-white mb-4">Audience & Context Defaults</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative z-[50]">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Target Audience</label>
                  <CustomSelect
                    name="default_audience"
                    value={formData.default_audience}
                    onChange={handleInputChange}
                    options={[
                      { value: 'professionals', label: 'Professionals' },
                      { value: 'consumers', label: 'Consumers' },
                      { value: 'students', label: 'Students' },
                      { value: 'executives', label: 'Executives' },
                      { value: 'entrepreneurs', label: 'Entrepreneurs' }
                    ]}
                  />
                </div>
                <div className="relative z-[50]">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Industry Focus</label>
                  <CustomSelect
                    name="default_industry"
                    value={formData.default_industry}
                    onChange={handleInputChange}
                    options={[
                      { value: 'technology', label: 'Technology' },
                      { value: 'healthcare', label: 'Healthcare' },
                      { value: 'finance', label: 'Finance' },
                      { value: 'education', label: 'Education' },
                      { value: 'retail', label: 'Retail' },
                      { value: 'manufacturing', label: 'Manufacturing' },
                      { value: 'consulting', label: 'Consulting' }
                    ]}
                  />
                </div>
                <div className="relative z-[50]">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Geographic Region</label>
                  <CustomSelect
                    name="default_geographic_region"
                    value={formData.default_geographic_region}
                    onChange={handleInputChange}
                    options={[
                      { value: 'global', label: 'Global' },
                      { value: 'north_america', label: 'North America' },
                      { value: 'europe', label: 'Europe' },
                      { value: 'asia_pacific', label: 'Asia Pacific' },
                      { value: 'latin_america', label: 'Latin America' }
                    ]}
                  />
                </div>
                <div className="relative z-[50]">
                  <label className="block text-sm font-medium text-gray-300 mb-2">CTA Style</label>
                  <CustomSelect
                    name="preferred_cta_style"
                    value={formData.preferred_cta_style}
                    onChange={handleInputChange}
                    options={[
                      { value: 'strong', label: 'Strong & Direct' },
                      { value: 'subtle', label: 'Subtle & Soft' },
                      { value: 'informational', label: 'Informational' },
                      { value: 'urgent', label: 'Urgent' }
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* Language Preference Section */}
            <div className="glass rounded-lg p-6 relative z-[20] mb-8">
              <h4 className="text-lg font-medium text-white mb-4">Content Generation Language</h4>
              <div className="grid grid-cols-1 gap-4">
                <div className="relative z-[50]">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Preferred Language for Content Generation
                  </label>
                  <CustomSelect
                    name="content_generation_language"
                    value={formData.content_generation_language || 'english'}
                    onChange={handleInputChange}
                    options={[
                      { value: 'english', label: '🇬🇧 English (Default)' },
                      { value: 'marathi', label: '🇮🇳 Marathi (मराठी)' },
                      { value: 'hindi', label: '🇮🇳 Hindi (हिंदी)' }
                    ]}
                  />
                  <p className="text-sm text-gray-400 mt-2">
                    All generated content will be created in your preferred language
                  </p>
                </div>
              </div>
            </div>

            {/* Advanced Options */}
            <div className="glass rounded-lg p-6 relative z-[10]">
              <h4 className="text-lg font-medium text-white mb-4">Advanced Options</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium text-white">Include Keywords by Default</h5>
                    <p className="text-sm text-gray-400">Automatically prompt for keywords in content generation</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="include_keywords_by_default"
                      checked={formData.include_keywords_by_default}
                      onChange={handleInputChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium text-white">Show Generation Tips</h5>
                    <p className="text-sm text-gray-400">Display helpful tips during content generation</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="show_generation_tips"
                      checked={formData.show_generation_tips}
                      onChange={handleInputChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium text-white">Enable Advanced Parameters</h5>
                    <p className="text-sm text-gray-400">Show advanced parameter options in content generator</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="enable_advanced_parameters"
                      checked={formData.enable_advanced_parameters}
                      onChange={handleInputChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white mb-4">Appearance Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 glass rounded-lg">
                <div className="flex items-center space-x-3">
                  {theme === 'dark' ? <Moon className="w-5 h-5 text-purple-400" /> : <Sun className="w-5 h-5 text-yellow-400" />}
                  <div>
                    <h4 className="font-medium text-white">Theme</h4>
                    <p className="text-sm text-gray-400">Choose your preferred theme</p>
                  </div>
                </div>
                <button
                  onClick={toggleTheme}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
                >
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </button>
              </div>
              <div className="p-4 glass rounded-lg">
                <h4 className="font-medium text-white mb-2">Language & Region</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
                    <CustomSelect
                      name="language"
                      value={formData.language}
                      onChange={handleInputChange}
                      options={[
                        { value: 'en', label: 'English' },
                        { value: 'es', label: 'Spanish' },
                        { value: 'fr', label: 'French' },
                        { value: 'de', label: 'German' },
                        { value: 'it', label: 'Italian' }
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Timezone</label>
                    <CustomSelect
                      name="timezone"
                      value={formData.timezone}
                      onChange={handleInputChange}
                      options={[
                        { value: 'UTC', label: 'UTC' },
                        { value: 'America/New_York', label: 'Eastern Time' },
                        { value: 'America/Chicago', label: 'Central Time' },
                        { value: 'America/Denver', label: 'Mountain Time' },
                        { value: 'America/Los_Angeles', label: 'Pacific Time' },
                        { value: 'Europe/London', label: 'London' },
                        { value: 'Europe/Paris', label: 'Paris' },
                        { value: 'Asia/Tokyo', label: 'Tokyo' }
                      ]}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white mb-4">Notification Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 glass rounded-lg">
                <div>
                  <h4 className="font-medium text-white">Email Notifications</h4>
                  <p className="text-sm text-gray-400">Receive updates about your content generation</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="notifications_enabled"
                    checked={formData.notifications_enabled}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-4 glass rounded-lg">
                <div>
                  <h4 className="font-medium text-white">Auto-save Content</h4>
                  <p className="text-sm text-gray-400">Automatically save generated content to history</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="auto_save_content"
                    checked={formData.auto_save_content}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white mb-4">Security & Privacy</h3>
            <div className="space-y-4">
              <div className="p-4 glass rounded-lg">
                <h4 className="font-medium text-white mb-2">API Security</h4>
                <p className="text-sm text-gray-400 mb-4">
                  Your API keys are securely managed server-side and never exposed to the client. 
                  All content generation requests are processed through our secure backend.
                </p>
              </div>
              
              <div className="p-4 glass rounded-lg">
                <h4 className="font-medium text-white mb-4">Privacy Settings</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium text-white">Analytics Enabled</h5>
                      <p className="text-sm text-gray-400">Allow collection of usage analytics</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="analytics_enabled"
                        checked={formData.analytics_enabled}
                        onChange={handleInputChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium text-white">Share Usage Data</h5>
                      <p className="text-sm text-gray-400">Help improve the service by sharing anonymous usage data</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="share_usage_data"
                        checked={formData.share_usage_data}
                        onChange={handleInputChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-4 glass rounded-lg">
                <h4 className="font-medium text-white mb-2">Data Management</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium text-white">Data Retention</h5>
                      <p className="text-sm text-gray-400">How long to keep your content history</p>
                    </div>
                    <CustomSelect
                      name="data_retention_days"
                      value={formData.data_retention_days}
                      onChange={handleInputChange}
                      options={[
                        { value: 30, label: '30 days' },
                        { value: 90, label: '90 days' },
                        { value: 180, label: '6 months' },
                        { value: 365, label: '1 year' },
                        { value: -1, label: 'Forever' }
                      ]}
                    />
                  </div>
                  <div className="flex space-x-4">
                    <button
                      onClick={handleExportProfile}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-all duration-300"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export Profile</span>
                    </button>
                    <label className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 text-green-300 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-all duration-300 cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <span>Import Profile</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportProfile}
                        className="hidden"
                      />
                    </label>
                    <button
                      onClick={handleClearData}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all duration-300"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Clear All Data</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="bg-hero-gradient rounded-3xl p-8 mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">⚙️ Settings</h1>
          <p className="text-xl text-white/90">Customize your AI Content Creator experience</p>
        </div>
      </motion.div>

      {/* Message Display */}
      {message.text && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg border ${
            message.type === 'success' 
              ? 'bg-green-500/10 border-green-500/20 text-green-300' 
              : 'bg-red-500/10 border-red-500/20 text-red-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1"
        >
          <div className="glass rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Settings</h3>
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-500/50 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-3"
        >
          <div className="glass rounded-2xl p-8">
            {renderTabContent()}
            
            {/* Save Button */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                <span>{loading ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;