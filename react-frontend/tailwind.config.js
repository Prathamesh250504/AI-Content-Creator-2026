/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cosmic: {
          bg: '#0a0118',
          purple: '#6b46c1',
          pink: '#d946ef',
          blue: '#3b82f6',
          cyan: '#06b6d4',
        },
        glass: {
          bg: 'rgba(139, 92, 246, 0.1)',
          border: 'rgba(168, 85, 247, 0.3)',
        }
      },
      backgroundImage: {
        'cosmic-gradient': 'linear-gradient(135deg, #0a0118 0%, #1a0b3d 25%, #2d1b69 50%, #4c1d95 75%, #6b46c1 100%)',
        'hero-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(168, 85, 247, 0.1) 100%)',
        'sidebar-gradient': 'linear-gradient(180deg, rgba(30, 27, 75, 0.95) 0%, rgba(10, 1, 24, 0.95) 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'twinkle': 'twinkle 20s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%': { transform: 'translateY(-10px) rotate(120deg)' },
          '66%': { transform: 'translateY(5px) rotate(240deg)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)' },
          '100%': { boxShadow: '0 0 30px rgba(139, 92, 246, 0.8)' },
        },
        twinkle: {
          '0%, 100%': { 
            backgroundPosition: '0% 0%, 60% 70%, 50% 50%, 80% 10%, 90% 60%, 33% 80%, 15% 85%, 75% 25%',
            opacity: '0.6'
          },
          '50%': { 
            backgroundPosition: '100% 100%, 40% 30%, 70% 80%, 20% 90%, 10% 40%, 67% 20%, 85% 15%, 25% 75%',
            opacity: '0.8'
          },
        }
      }
    },
  },
  plugins: [
    // Custom plugin to handle focus styles
    function({ addUtilities }) {
      const newUtilities = {
        '.focus-ring': {
          '&:focus': {
            outline: 'none',
            boxShadow: '0 0 0 2px rgba(139, 92, 246, 0.5)',
          }
        }
      }
      addUtilities(newUtilities)
    }
  ],
}