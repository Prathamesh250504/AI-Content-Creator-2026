import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Menu, X, Bell, Search, Check, Trash2, FileText, Calendar, Eye, ExternalLink, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useContent } from '../contexts/ContentContext';
import NotificationItem from './NotificationItem';

const TopNavbar = ({ onMenuClick, sidebarOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useUser();
  const { notifications, getUnreadCount, markAsRead, markAllAsRead, clearAll, removeNotification, showSuccess, showPersistent, showError } = useNotifications();
  const { contentHistory } = useContent();
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchPreview, setShowSearchPreview] = useState(false);
  const [searchPreviewEntry, setSearchPreviewEntry] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const [searchDropdownPosition, setSearchDropdownPosition] = useState({ top: 0, left: 0 });
  const notificationRef = useRef(null);
  const buttonRef = useRef(null);
  const searchRef = useRef(null);
  const searchButtonRef = useRef(null);

  const calculateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8, // 8px gap below the button
        right: window.innerWidth - rect.right // Align right edge with button
      });
    }
  };

  const calculateSearchDropdownPosition = () => {
    if (searchButtonRef.current) {
      const rect = searchButtonRef.current.getBoundingClientRect();
      setSearchDropdownPosition({
        top: rect.bottom + 8, // 8px gap below the button
        left: rect.left // Align left edge with button
      });
    }
  };

  // Search functionality
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const filtered = contentHistory.filter(entry => 
      (entry.content && entry.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (entry.content_type && entry.content_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (entry.template_used && entry.template_used.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (entry.parameters?.topic && entry.parameters.topic.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (entry.parameters?.user_prompt && entry.parameters.user_prompt.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Sort by newest first and limit to 5 results
    const sortedResults = filtered
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5);

    setSearchResults(sortedResults);
  }, [searchTerm, contentHistory]);

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target) && 
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target) && 
          searchButtonRef.current && !searchButtonRef.current.contains(event.target)) {
        setShowSearch(false);
        setSearchTerm('');
        setSearchResults([]);
      }
    };

    if (showNotifications || showSearch) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications, showSearch]);

  // Handle window resize to recalculate position
  useEffect(() => {
    const handleResize = () => {
      if (showNotifications) {
        calculateDropdownPosition();
      }
      if (showSearch) {
        calculateSearchDropdownPosition();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showNotifications, showSearch]);

  // Add a welcome notification on component mount
  useEffect(() => {
    // Add a welcome notification after 2 seconds if no notifications exist
    const timer = setTimeout(() => {
      if (notifications.length === 0) {
        showPersistent(
          '👋 Welcome to AI Content Creator!', 
          'Discover the power of AI-driven content creation! Check your notifications here for updates, tips, and important information about your content generation journey.'
        );
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for authentication success events
  useEffect(() => {
    const handleLoginSuccess = (event) => {
      const userName = event.detail?.userName || 'User';
      showSuccess(
        '🎉 Welcome to AI Content Creator!',
        `Hello ${userName}! You've successfully logged in. Ready to create amazing content with the power of AI? Let's get started on your content journey!`
      );
    };

    const handleRegistrationSuccess = (event) => {
      const userName = event.detail?.userName || 'User';
      showPersistent(
        '🚀 Welcome to AI Content Creator!',
        `Hi ${userName}! Your account has been created successfully. You now have access to powerful AI tools for content generation, quality analysis, and much more. Start creating amazing content today!`,
        'success'
      );
    };

    const handleContentGenerated = (event) => {
      const { contentType, wordCount } = event.detail;
      showSuccess(
        '✨ Content Generated Successfully!',
        `Your ${contentType} with ${wordCount} words has been created! You can now review, edit, or analyze the quality of your content. Great work!`
      );
    };

    const handleContentError = (event) => {
      const { error } = event.detail;
      showError(
        '❌ Content Generation Failed',
        `We encountered an issue while generating your content: ${error}. Please try again or contact support if the problem persists.`
      );
    };

    window.addEventListener('show-login-success', handleLoginSuccess);
    window.addEventListener('show-registration-success', handleRegistrationSuccess);
    window.addEventListener('show-content-generated', handleContentGenerated);
    window.addEventListener('show-content-error', handleContentError);

    return () => {
      window.removeEventListener('show-login-success', handleLoginSuccess);
      window.removeEventListener('show-registration-success', handleRegistrationSuccess);
      window.removeEventListener('show-content-generated', handleContentGenerated);
      window.removeEventListener('show-content-error', handleContentError);
    };
  }, [showSuccess, showPersistent, showError]);

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      case 'profile': return '👤';
      default: return '🔔';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success': return 'border-green-500/30 bg-green-500/10';
      case 'error': return 'border-red-500/30 bg-red-500/10';
      case 'warning': return 'border-yellow-500/30 bg-yellow-500/10';
      case 'info': return 'border-blue-500/30 bg-blue-500/10';
      case 'profile': return 'border-purple-500/30 bg-purple-500/10';
      default: return 'border-gray-500/30 bg-gray-500/10';
    }
  };

  const truncateContent = (content, maxLength = 100) => {
    if (!content || typeof content !== 'string') return 'No content available';
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const handleSearchResultClick = (entry) => {
    // Navigate to content history with the search term
    navigate('/history', { state: { searchTerm: searchTerm, highlightId: entry.content_id } });
    setShowSearch(false);
    setSearchTerm('');
    setSearchResults([]);
  };

  const handleViewAllResults = () => {
    // Navigate to content history with the search term
    navigate('/history', { state: { searchTerm: searchTerm } });
    setShowSearch(false);
    setSearchTerm('');
    setSearchResults([]);
  };

  const openSearchPreview = (entry) => {
    setSearchPreviewEntry(entry);
    setShowSearchPreview(true);
  };

  const closeSearchPreview = () => {
    setShowSearchPreview(false);
    setSearchPreviewEntry(null);
  };

  const copyToClipboard = (content) => {
    if (!content || typeof content !== 'string') {
      return;
    }
    navigator.clipboard.writeText(content);
  };

  const formatContentForDisplay = (content) => {
    if (!content || typeof content !== 'string') return 'No content available';
    
    // Split content into paragraphs and format
    return content.split('\n').map((paragraph, index) => {
      if (paragraph.trim() === '') return null;
      
      // Check if it's a header (starts with numbers like "1.", "2.", etc.)
      if (/^\d+\./.test(paragraph.trim())) {
        return (
          <h3 key={index} className="text-lg font-semibold text-purple-300 mt-4 mb-2">
            {paragraph.trim()}
          </h3>
        );
      }
      
      // Check if it's a bullet point
      if (paragraph.trim().startsWith('•') || paragraph.trim().startsWith('-')) {
        return (
          <li key={index} className="text-gray-200 mb-1 ml-4">
            {paragraph.trim().substring(1).trim()}
          </li>
        );
      }
      
      // Regular paragraph
      return (
        <p key={index} className="text-gray-200 mb-3 leading-relaxed">
          {paragraph.trim()}
        </p>
      );
    }).filter(Boolean);
  };

  const getPageTitle = () => {
    const path = location.pathname;
    switch (path) {
      case '/':
      case '/dashboard':
        return 'Dashboard';
      case '/generator':
        return 'Content Generator';
      case '/history':
        return 'Content History';
      case '/analytics':
        return 'Analytics';
      case '/templates':
        return 'Templates';
      case '/settings':
        return 'Settings';
      default:
        return 'AI Content Creator';
    }
  };

  return (
    <nav className="navbar glass border-b px-6 py-4 sticky top-0 z-50 w-full">
      <div className="flex items-center justify-between h-full">
        {/* Left side */}
        <div className="flex items-center space-x-6">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-3 rounded-xl glass glass-hover transition-all duration-300 mr-2"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Page title with cosmic styling */}
          <div className="flex items-center space-x-4">
            <div className="brand-icon w-10 h-10 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">🚀</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold nav-title">{getPageTitle()}</h1>
              <p className="text-sm nav-subtitle hidden sm:block">
                Welcome back, {user?.preferences?.name || user?.display_name || 'User'}
              </p>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Mobile Search */}
          <div className="md:hidden">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!showSearch) {
                  calculateSearchDropdownPosition();
                }
                setShowSearch(true);
              }}
              className="p-3 rounded-xl glass glass-hover transition-all duration-300"
              title="Search content"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* Desktop Search */}
          <div className="relative hidden md:block">
            {showSearch ? (
              <div className="flex items-center">
                <input
                  type="text"
                  placeholder="Search content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-72 px-4 py-3 input-cosmic rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-base"
                  autoFocus
                  onBlur={(e) => {
                    // Don't close if clicking on search results
                    if (!e.relatedTarget || !e.relatedTarget.closest('[data-search-dropdown]')) {
                      setTimeout(() => {
                        setShowSearch(false);
                        setSearchTerm('');
                        setSearchResults([]);
                      }, 150);
                    }
                  }}
                />
              </div>
            ) : (
              <button
                ref={searchButtonRef}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!showSearch) {
                    calculateSearchDropdownPosition();
                  }
                  setShowSearch(true);
                }}
                className="p-3 rounded-xl glass glass-hover transition-all duration-300"
                title="Search content"
              >
                <Search className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Search Results Dropdown Portal */}
          {showSearch && searchTerm && createPortal(
            <div 
              className="fixed inset-0 z-[99998]"
              onClick={() => {
                setShowSearch(false);
                setSearchTerm('');
                setSearchResults([]);
              }}
            >
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="fixed w-96 max-w-[90vw] glass rounded-2xl border border-white/20 shadow-2xl max-h-96 overflow-hidden"
                  style={{
                    top: `${searchDropdownPosition.top}px`,
                    left: `${Math.max(16, Math.min(searchDropdownPosition.left, window.innerWidth - 400))}px`,
                    zIndex: 99998
                  }}
                  onClick={(e) => e.stopPropagation()}
                  ref={searchRef}
                  data-search-dropdown
                >
                  {/* Header */}
                  <div className="p-4 border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">Search Results</h3>
                      <span className="text-sm text-gray-400">
                        {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
                      </span>
                    </div>
                  </div>

                  {/* Search Results List */}
                  <div className="max-h-80 overflow-y-auto">
                    {searchResults.length === 0 ? (
                      <div className="p-6 text-center">
                        <div className="text-4xl mb-2">🔍</div>
                        <p className="text-gray-400">No content found</p>
                        <p className="text-sm text-gray-500 mt-1">Try different keywords</p>
                      </div>
                    ) : (
                      <div className="p-2">
                        {searchResults.map((entry) => (
                          <motion.div
                            key={entry.content_id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-3 rounded-lg border border-white/10 mb-2 transition-all duration-300 hover:bg-white/5 hover:border-purple-500/30"
                          >
                            <div className="flex items-start space-x-3">
                              <div className="text-lg flex-shrink-0">
                                <FileText className="w-5 h-5 text-purple-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="text-sm font-medium text-white truncate">
                                    {(entry.content_type || entry.template_used || 'Content')
                                      .replace('_', ' ')
                                      .replace(/\b\w/g, l => l.toUpperCase())
                                    }
                                  </h4>
                                  <div className="flex items-center space-x-1">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openSearchPreview(entry);
                                      }}
                                      className="p-1 rounded text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 transition-colors"
                                      title="Preview content"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSearchResultClick(entry);
                                      }}
                                      className="p-1 rounded text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 transition-colors"
                                      title="Go to content"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-300 line-clamp-2 mb-1">
                                  {truncateContent(entry.content)}
                                </p>
                                <div className="flex items-center space-x-2 text-xs text-gray-400">
                                  <Calendar className="w-3 h-3" />
                                  <span>{new Date(entry.timestamp).toLocaleDateString()}</span>
                                  <span>•</span>
                                  <span>{entry.word_count || 0} words</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  {searchResults.length > 0 && (
                    <div className="p-3 border-t border-white/10 text-center">
                      <button
                        onClick={handleViewAllResults}
                        className="text-sm text-purple-300 hover:text-purple-200 transition-colors"
                      >
                        View all results in Content History
                      </button>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>,
            document.body
          )}

          {/* Notifications */}
          <div className="relative">
            <button 
              ref={buttonRef}
              onClick={(e) => {
                e.stopPropagation();
                if (!showNotifications) {
                  calculateDropdownPosition();
                }
                setShowNotifications(!showNotifications);
              }}
              className="p-3 rounded-xl glass glass-hover transition-all duration-300 relative"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {getUnreadCount() > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
                  {getUnreadCount() > 9 ? '9+' : getUnreadCount()}
                </span>
              )}
            </button>
          </div>

          {/* Notification Dropdown Portal */}
          {showNotifications && createPortal(
            <div 
              className="fixed inset-0 z-[99999]"
              onClick={() => setShowNotifications(false)}
            >
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="fixed w-96 glass rounded-2xl border border-white/20 shadow-2xl max-h-96 overflow-hidden"
                  style={{
                    top: `${dropdownPosition.top}px`,
                    right: `${dropdownPosition.right}px`,
                    zIndex: 99999
                  }}
                  onClick={(e) => e.stopPropagation()}
                  ref={notificationRef}
                >
                  {/* Header */}
                  <div className="p-4 border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">Notifications</h3>
                      <div className="flex items-center space-x-2">
                        {getUnreadCount() > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-purple-300 hover:text-purple-200 transition-colors px-2 py-1 rounded bg-purple-500/20 hover:bg-purple-500/30"
                            title="Mark all as read"
                          >
                            <Check className="w-3 h-3 inline mr-1" />
                            Mark all read
                          </button>
                        )}
                        <button
                          onClick={clearAll}
                          className="text-xs text-gray-400 hover:text-gray-300 transition-colors px-2 py-1 rounded bg-gray-500/20 hover:bg-gray-500/30"
                          title="Clear all notifications"
                        >
                          <Trash2 className="w-3 h-3 inline mr-1" />
                          Clear all
                        </button>
                      </div>
                    </div>
                    {notifications.length > 0 && (
                      <div className="text-xs text-gray-400 mt-1">
                        {getUnreadCount()} unread • {notifications.length} total
                      </div>
                    )}
                  </div>

                  {/* Notifications List */}
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center">
                        <div className="text-4xl mb-2">🔔</div>
                        <p className="text-gray-400">No notifications yet</p>
                      </div>
                    ) : (
                      <div className="p-2">
                        <AnimatePresence>
                          {notifications.map((notification) => (
                            <NotificationItem
                              key={notification.id}
                              notification={notification}
                              onRemove={removeNotification}
                              onMarkAsRead={markAsRead}
                              formatTimeAgo={formatTimeAgo}
                              getNotificationIcon={getNotificationIcon}
                              getNotificationColor={getNotificationColor}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="p-3 border-t border-white/10 text-center">
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="text-sm text-purple-300 hover:text-purple-200 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>,
            document.body
          )}

          {/* Search Preview Modal */}
          {showSearchPreview && searchPreviewEntry && createPortal(
            <div className="fixed inset-0 z-[99999] flex items-center justify-center">
              <div 
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={closeSearchPreview}
              />
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="relative w-full max-w-4xl max-h-[90vh] mx-4 glass rounded-2xl border border-white/20 shadow-2xl overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">
                          {(searchPreviewEntry.content_type || searchPreviewEntry.template_used || 'Generated Content')
                            .replace('_', ' ')
                            .replace(/\b\w/g, l => l.toUpperCase())
                          }
                        </h2>
                        <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(searchPreviewEntry.timestamp).toLocaleDateString()}</span>
                          </div>
                          <span>•</span>
                          <span>{searchPreviewEntry.word_count || 0} words</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => copyToClipboard(searchPreviewEntry.content || 'No content available')}
                        className="p-2 glass glass-hover rounded-lg text-white"
                        title="Copy content"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                      <button
                        onClick={closeSearchPreview}
                        className="p-2 glass glass-hover rounded-lg text-gray-400 hover:text-white"
                        title="Close preview"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    <div className="bg-black/20 rounded-xl p-6 border border-white/10">
                      <div className="prose prose-invert max-w-none">
                        {formatContentForDisplay(searchPreviewEntry.content || 'No content available')}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-end p-6 border-t border-white/10 bg-black/20 space-x-2">
                    <button
                      onClick={() => {
                        handleSearchResultClick(searchPreviewEntry);
                        closeSearchPreview();
                      }}
                      className="px-4 py-2 glass glass-hover rounded-lg text-white font-medium"
                    >
                      Go to Content History
                    </button>
                    <button
                      onClick={closeSearchPreview}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
                    >
                      Close
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>,
            document.body
          )}

          {/* Mobile Search Modal */}
          {showSearch && !searchTerm && createPortal(
            <div className="fixed inset-0 z-[99997] md:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setShowSearch(false)} />
              <div className="absolute top-0 left-0 right-0 bg-gray-900/95 backdrop-blur-lg p-4">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setShowSearch(false)}
                    className="p-2 text-gray-400 hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  <input
                    type="text"
                    placeholder="Search content..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-4 py-3 input-cosmic rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    autoFocus
                  />
                </div>
              </div>
            </div>,
            document.body
          )}

          {/* Theme toggle with enhanced styling */}
          <button
            onClick={toggleTheme}
            className="p-3 rounded-xl glass glass-hover transition-all duration-300 text-xl"
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? '🌙' : '☀️'}
          </button>

          {/* User profile with enhanced design */}
          <div className="user-profile flex items-center space-x-3 p-2 rounded-xl transition-all duration-300">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-lg ring-2 ring-purple-400/30">
              {(user?.preferences?.name || user?.display_name || 'User').charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <span className="nav-user-name font-semibold block">
                {user?.preferences?.name || user?.display_name || 'User'}
              </span>
              <span className="text-xs text-purple-300 block">
                {user?.preferences?.role || user?.role || 'Content Creator'}
              </span>
            </div>
          </div>

          {/* Logout button for authenticated users */}
          {isAuthenticated && (
            <button
              onClick={async () => {
                try {
                  await logout();
                  navigate('/');
                } catch (error) {
                  console.error('Logout error:', error);
                }
              }}
              className="p-3 rounded-xl glass glass-hover transition-all duration-300 text-red-400 hover:text-red-300"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default TopNavbar;