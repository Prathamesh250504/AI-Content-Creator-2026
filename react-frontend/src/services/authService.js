/**
 * Authentication Service
 * Handles user authentication, token management, and API calls
 */

// Determine API base URL based on environment
const getApiBaseUrl = () => {
  // If REACT_APP_API_URL is explicitly set, use it
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Check if we're accessing from a different host (mobile device)
  const currentHost = window.location.hostname;
  
  // If accessing from network IP (not localhost), use full backend URL
  if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
    const backendHost = process.env.REACT_APP_BACKEND_HOST || currentHost;
    const backendPort = process.env.REACT_APP_BACKEND_PORT || '8000';
    return `http://${backendHost}:${backendPort}/api`;
  }
  
  // Default to relative URL for localhost (uses proxy)
  return '/api';
};

const API_BASE_URL = getApiBaseUrl();

// Debug log to verify the API URL
console.log('AuthService API_BASE_URL:', API_BASE_URL);
console.log('Current hostname:', window.location.hostname);

class AuthService {
  constructor() {
    this.token = localStorage.getItem('auth_token');
    this.user = null;
    
    // Load user from localStorage if token exists
    if (this.token) {
      const savedUser = localStorage.getItem('auth_user');
      if (savedUser) {
        try {
          this.user = JSON.parse(savedUser);
        } catch (error) {
          console.error('Error parsing saved user data:', error);
          this.clearAuth();
        }
      }
    }
  }

  // Authentication API calls
  async register(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (data.success) {
        this.setAuth(data.token, data.user);
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        this.setAuth(data.token, data.user);
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  async logout() {
    try {
      // Call logout endpoint (optional for JWT)
      if (this.token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      this.clearAuth();
    }
  }

  async googleAuth(googleToken) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: googleToken }),
      });

      const data = await response.json();

      if (data.success) {
        this.setAuth(data.token, data.user);
        return { success: true, user: data.user, isNewUser: data.is_new_user };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Google auth error:', error);
      return { success: false, error: 'Google authentication failed. Please try again.' };
    }
  }

  async verifyToken() {
    if (!this.token) {
      return { success: false, error: 'No token found' };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: this.token }),
      });

      const data = await response.json();

      if (data.success && data.valid) {
        this.user = data.user;
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        return { success: true, user: data.user };
      } else {
        this.clearAuth();
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Token verification error:', error);
      this.clearAuth();
      return { success: false, error: 'Token verification failed' };
    }
  }

  async getCurrentUser() {
    if (!this.token) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        this.user = data.user;
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        return { success: true, user: data.user };
      } else {
        if (response.status === 401) {
          this.clearAuth();
        }
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Get current user error:', error);
      return { success: false, error: 'Failed to get user data' };
    }
  }

  async updatePreferences(preferences) {
    if (!this.token) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/update-preferences`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences }),
      });

      const data = await response.json();

      if (data.success) {
        this.user = data.user;
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        return { success: true, user: data.user };
      } else {
        if (response.status === 401) {
          this.clearAuth();
        }
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Update preferences error:', error);
      return { success: false, error: 'Failed to update preferences' };
    }
  }

  async checkUsageLimits() {
    if (!this.token) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/check-usage`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        return { success: true, usage: data.usage };
      } else {
        if (response.status === 401) {
          this.clearAuth();
        }
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Check usage limits error:', error);
      return { success: false, error: 'Failed to check usage limits' };
    }
  }

  // Token and user management
  setAuth(token, user) {
    this.token = token;
    this.user = user;
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
  }

  clearAuth() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }

  // Utility methods
  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  getToken() {
    return this.token;
  }

  getUser() {
    return this.user;
  }

  getUserId() {
    return this.user?.user_id || null;
  }

  // API request helper with authentication
  async authenticatedRequest(url, options = {}) {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.clearAuth();
      throw new Error('Authentication expired');
    }

    return response;
  }

  // Content generation with authentication
  async generateContent(contentData) {
    try {
      const url = `${API_BASE_URL}/generate`;
      const options = {
        method: 'POST',
        body: JSON.stringify(contentData),
      };

      const response = this.token 
        ? await this.authenticatedRequest(url, options)
        : await fetch(url, {
            ...options,
            headers: { 'Content-Type': 'application/json' },
          });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Content generation error:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create and export singleton instance
const authService = new AuthService();
export default authService;