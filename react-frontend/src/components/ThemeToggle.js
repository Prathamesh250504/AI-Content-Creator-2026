import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = ({ className = '' }) => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      className={`relative p-3 rounded-xl glass glass-hover transition-all duration-300 group ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
    >
      {/* Background glow effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
      
      {/* Icon container */}
      <div className="relative z-10 flex items-center justify-center">
        <motion.div
          initial={false}
          animate={{
            rotate: isDarkMode ? 0 : 180,
            scale: isDarkMode ? 1 : 0.8,
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="absolute"
        >
          <Moon 
            className={`w-5 h-5 transition-colors duration-300 ${
              isDarkMode 
                ? 'text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.5)]' 
                : 'text-gray-400'
            }`} 
          />
        </motion.div>
        
        <motion.div
          initial={false}
          animate={{
            rotate: isDarkMode ? 180 : 0,
            scale: isDarkMode ? 0.8 : 1,
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="absolute"
        >
          <Sun 
            className={`w-5 h-5 transition-colors duration-300 ${
              !isDarkMode 
                ? 'text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]' 
                : 'text-gray-400'
            }`} 
          />
        </motion.div>
      </div>
      
      {/* Ripple effect */}
      <motion.div
        className="absolute inset-0 rounded-xl bg-white/10"
        initial={{ scale: 0, opacity: 0.5 }}
        animate={{ scale: 0, opacity: 0 }}
        whileTap={{ scale: 1.2, opacity: 0.3 }}
        transition={{ duration: 0.2 }}
      />
    </motion.button>
  );
};

export default ThemeToggle;