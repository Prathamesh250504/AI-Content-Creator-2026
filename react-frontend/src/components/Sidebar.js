import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Sparkles, 
  History, 
  BarChart3, 
  FileText, 
  Settings, 
  X,
  Target,
  Layers,
  Edit3,
  TestTube
} from 'lucide-react';
import { useContent } from '../contexts/ContentContext';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { statistics } = useContent();
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Content Generator', href: '/generator', icon: Sparkles },
    { name: 'Batch Processing', href: '/batch', icon: Layers },
    { name: 'A/B Test Results', href: '/ab-test-history', icon: TestTube },
    { name: 'Quality Analysis', href: '/quality-analysis', icon: Target },
    { name: 'Content History', href: '/history', icon: History },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Templates', href: '/templates', icon: FileText },
    { name: 'Prompt Templates', href: '/prompt-templates', icon: Edit3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    closed: {
      x: "-100%",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      <AnimatePresence>
        {!isDesktop && isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      {isDesktop ? (
        // Desktop sidebar - always visible and fixed
        <div className="sidebar">
          <div className="flex flex-col h-full p-6">
            {/* Header */}
            <div className="flex items-center justify-center mb-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-purple-300 mb-2">🚀 AI Content Creator</h2>
                <p className="text-sm text-gray-400">Intelligent Content Generation</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-2">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Navigation
              </h3>
              {navigation.map((item, index) => {
                const isActive = location.pathname === item.href || 
                               (item.href === '/dashboard' && location.pathname === '/');
                const isLastItem = index === navigation.length - 1;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`nav-btn flex items-center px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                      isActive ? 'active' : ''
                    } ${isLastItem ? 'mb-8' : ''}`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Quick Stats */}
            <div className="glass rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                📊 Quick Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Content Generated</span>
                  <span className="font-bold text-white">{statistics.total_entries || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Total Words</span>
                  <span className="font-bold text-white">{(statistics.total_words || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Success Rate</span>
                  <span className="font-bold text-green-400">{statistics.success_rate || 100}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Mobile sidebar - animated
        <motion.div
          variants={sidebarVariants}
          initial="closed"
          animate={isOpen ? "open" : "closed"}
          className={`sidebar ${isOpen ? 'mobile-open' : ''}`}
        >
          <div className="flex flex-col h-full p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-purple-300 mb-2">🚀 AI Content Creator</h2>
                <p className="text-sm text-gray-400">Intelligent Content Generation</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg glass glass-hover text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-2">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Navigation
              </h3>
              {navigation.map((item, index) => {
                const isActive = location.pathname === item.href || 
                               (item.href === '/dashboard' && location.pathname === '/');
                const isLastItem = index === navigation.length - 1;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={onClose}
                    className={`nav-btn flex items-center px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                      isActive ? 'active' : ''
                    } ${isLastItem ? 'mb-8' : ''}`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Quick Stats */}
            <div className="glass rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                📊 Quick Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Content Generated</span>
                  <span className="font-bold text-white">{statistics.total_entries || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Total Words</span>
                  <span className="font-bold text-white">{(statistics.total_words || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Success Rate</span>
                  <span className="font-bold text-green-400">{statistics.success_rate || 100}%</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
};

export default Sidebar;