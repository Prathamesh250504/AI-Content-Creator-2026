import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { 
  Rocket, 
  BarChart3, 
  FileText, 
  Brain,
  Zap,
  TrendingUp,
  Clock,
  Target,
  PieChart,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Sparkles
} from 'lucide-react';
import { useContent } from '../contexts/ContentContext';

const Dashboard = () => {
  const { statistics, loadContentHistory } = useContent();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [animatedStats, setAnimatedStats] = useState({
    total_entries: 0,
    total_words: 0,
    success_rate: 0,
    time_saved_hours: 0
  });

  // Animate statistics on load
  useEffect(() => {
    const animateValue = (start, end, duration, key) => {
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = Math.floor(start + (end - start) * progress);
        
        setAnimatedStats(prev => ({ ...prev, [key]: current }));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    };

    if (statistics) {
      animateValue(0, statistics.total_entries || 0, 1500, 'total_entries');
      animateValue(0, statistics.total_words || 0, 2000, 'total_words');
      animateValue(0, statistics.success_rate || 100, 1000, 'success_rate');
      animateValue(0, statistics.time_saved_hours || 0, 1800, 'time_saved_hours');
    }
  }, [statistics]);

  const refreshStats = async () => {
    setIsRefreshing(true);
    try {
      await loadContentHistory();
    } catch (error) {
      console.error('Failed to refresh stats:', error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  // Calculate trends (mock data for demo)
  const getTrendData = (value) => {
    const trend = Math.random() > 0.5 ? 'up' : 'down';
    const percentage = Math.floor(Math.random() * 20) + 1;
    return { trend, percentage };
  };

  const quickActions = [
    {
      title: 'Get Started',
      description: 'Create your first AI-powered content',
      icon: Rocket,
      href: '/generator',
      gradient: 'from-purple-500 to-pink-500',
      color: 'text-purple-300'
    },
    {
      title: 'Analytics',
      description: 'View your content performance',
      icon: BarChart3,
      href: '/analytics',
      gradient: 'from-blue-500 to-cyan-500',
      color: 'text-blue-300'
    },
    {
      title: 'Templates',
      description: 'Browse content templates',
      icon: FileText,
      href: '/templates',
      gradient: 'from-pink-500 to-red-500',
      color: 'text-pink-300'
    }
  ];

  return (
    <div className="min-h-screen p-6 relative z-10">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <div className="glass rounded-3xl p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-500/20 to-cyan-500/20 rounded-full blur-2xl"></div>
          
          <div className="relative z-10 text-center">
            <h1 className="text-5xl font-bold text-white mb-4 text-glow">
              🚀 AI Content Creator
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Transform your ideas into engaging content with artificial intelligence
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="xl:col-span-2 space-y-8">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-8"
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              Welcome to AI Content Creation
            </h2>
            <p className="text-gray-300 text-lg mb-6 leading-relaxed">
              Create compelling, personalized content that resonates with your audience. 
              Our AI-powered platform adapts to your style and preferences for optimal results.
            </p>
            
            {/* Illustration Area */}
            <div className="relative h-64 bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-xl mb-6 overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {/* Central Brain Icon */}
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4 floating-particle">
                    <Brain className="w-10 h-10 text-white" />
                  </div>
                  
                  {/* Surrounding Elements */}
                  <div className="absolute -top-8 -left-16 w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center floating-particle" style={{animationDelay: '1s'}}>
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  
                  <div className="absolute -top-8 -right-16 w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center floating-particle" style={{animationDelay: '2s'}}>
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  
                  <div className="absolute -bottom-8 -left-12 w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center floating-particle" style={{animationDelay: '3s'}}>
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  
                  <div className="absolute -bottom-8 -right-12 w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center floating-particle" style={{animationDelay: '4s'}}>
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
              
              {/* Connecting Lines */}
              <svg className="absolute inset-0 w-full h-full" style={{filter: 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.3))'}}>
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(139, 92, 246, 0.6)" />
                    <stop offset="100%" stopColor="rgba(168, 85, 247, 0.3)" />
                  </linearGradient>
                </defs>
                <path d="M 50 50 L 150 100 M 50 50 L 200 80 M 50 50 L 120 150 M 50 50 L 180 140" 
                      stroke="url(#lineGradient)" 
                      strokeWidth="2" 
                      fill="none"
                      opacity="0.7" />
              </svg>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickActions.map((action, index) => (
                <Link
                  key={action.title}
                  to={action.href}
                  className="group"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="glass rounded-xl p-6 hover:scale-105 transition-all duration-300 group-hover:shadow-2xl"
                  >
                    <div className={`w-12 h-12 bg-gradient-to-br ${action.gradient} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className={`font-bold text-lg ${action.color} mb-2`}>
                      {action.title}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {action.description}
                    </p>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Enhanced Overview Sidebar */}
        <div className="space-y-6">
          {/* Analytics Header */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white flex items-center">
                <BarChart3 className="w-6 h-6 mr-2 text-purple-400" />
                Analytics
              </h3>
              <button
                onClick={refreshStats}
                disabled={isRefreshing}
                className="p-2 glass glass-hover rounded-lg transition-all duration-300 hover:scale-105"
                title="Refresh statistics"
              >
                <RefreshCw className={`w-4 h-4 text-purple-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            {/* Enhanced Content Generated */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-400 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Content Generated
                </span>
                <div className="flex items-center space-x-1">
                  {getTrendData().trend === 'up' ? (
                    <ArrowUp className="w-4 h-4 text-green-400" />
                  ) : (
                    <ArrowDown className="w-4 h-4 text-red-400" />
                  )}
                  <span className={`text-xs ${getTrendData().trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                    {getTrendData().percentage}%
                  </span>
                </div>
              </div>
              <div className="text-4xl font-bold text-white mb-3 font-mono">
                {animatedStats.total_entries.toLocaleString()}
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((animatedStats.total_entries / 100) * 100, 100)}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full"
                ></motion.div>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>{animatedStats.total_words.toLocaleString()} words total</span>
                <span>Goal: 100</span>
              </div>
            </div>

            {/* Enhanced Success Rate */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-400 flex items-center">
                  <Target className="w-4 h-4 mr-2" />
                  Success Rate
                </span>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-green-400">Excellent</span>
                </div>
              </div>
              <div className="flex items-baseline mb-3">
                <span className="text-4xl font-bold text-white font-mono">{animatedStats.success_rate}%</span>
                <span className="text-green-400 text-sm ml-2 flex items-center">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Perfect
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${animatedStats.success_rate}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full"
                ></motion.div>
              </div>
            </div>

            {/* Enhanced Time Saved */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-400 flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Time Saved
                </span>
                <div className="flex items-center space-x-1">
                  <ArrowUp className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-blue-400">+{getTrendData().percentage}%</span>
                </div>
              </div>
              <div className="text-4xl font-bold text-white mb-3 font-mono">
                {animatedStats.time_saved_hours} hrs
              </div>
              <div className="glass rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">This month</span>
                  <span className="text-blue-400 font-medium">
                    {statistics.content_this_month || 0} pieces
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Avg per content</span>
                  <span className="text-purple-400 font-medium">30 min</span>
                </div>
              </div>
            </div>

            {/* Content Types Breakdown */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                <PieChart className="w-5 h-5 mr-2 text-yellow-400" />
                Content Types
              </h4>
              <div className="space-y-3">
                {Object.entries(statistics.content_types || {}).slice(0, 3).map(([type, count], index) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        index === 0 ? 'bg-purple-500' : 
                        index === 1 ? 'bg-blue-500' : 'bg-green-500'
                      }`}></div>
                      <span className="text-gray-300 text-sm capitalize">
                        {type.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-white font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>


        </div>
      </div>
    </div>
  );
};

export default Dashboard;