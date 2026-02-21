import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { userService } from '../services/api';
import authService from '../services/authService';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const initializeAuth = useCallback(async () => {
    try {
      setLoading(true);
      
      // Check if user is authenticated
      if (authService.isAuthenticated()) {
        // Verify token and get current user
        const result = await authService.verifyToken();
        
        if (result.success) {
          setUser(result.user);
          setUserProfile(result.user);
          setIsAuthenticated(true);
          
          // Trigger content reload after authentication is restored
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('auth-state-changed'));
          }, 100);
        } else {
          // Token invalid, clear auth and load default profile
          authService.clearAuth();
          await loadDefaultProfile();
        }
      } else {
        // Not authenticated, load default profile
        await loadDefaultProfile();
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      await loadDefaultProfile();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const loadDefaultProfile = async () => {
    try {
      // Try to load profile from old API for backward compatibility
      const userId = localStorage.getItem('userId') || 'default_user';
      const profile = await userService.getProfile(userId);
      setUserProfile(profile);
      setUser({ id: userId, ...profile });
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Failed to load default profile:', error);
      // Set fallback default user
      const defaultUser = {
        id: 'default_user',
        display_name: 'User',
        role: 'Content Creator',
        preferences: {
          default_tone: 'Professional',
          default_length: 'Medium (200-400 words)',
          default_creativity: 70,
          default_writing_style: 'Standard',
          default_content_format: 'Paragraph',
          default_language_style: 'Moderate',
          default_emotional_appeal: 'Balanced',
          default_target_audience: 'General audience',
          default_include_statistics: false,
          default_include_cta: true,
          default_include_questions: false,
        }
      };
      setUser(defaultUser);
      setUserProfile(defaultUser);
      setIsAuthenticated(false);
    }
  };

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      
      if (authService.isAuthenticated()) {
        // Get current authenticated user
        const result = await authService.getCurrentUser();
        
        if (result.success) {
          setUser(result.user);
          setUserProfile(result.user);
          setIsAuthenticated(true);
        } else {
          // Authentication failed, fallback to default
          authService.clearAuth();
          await loadDefaultProfile();
        }
      } else {
        // Not authenticated, load default profile
        await loadDefaultProfile();
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      await loadDefaultProfile();
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    try {
      if (isAuthenticated) {
        // Update authenticated user profile
        const result = await authService.updatePreferences(updates.preferences || {});
        
        if (result.success) {
          setUser(result.user);
          setUserProfile(result.user);
          return result.user;
        } else {
          throw new Error(result.error || 'Failed to update profile');
        }
      } else {
        // Update local profile for non-authenticated users
        const userId = user?.id || 'default_user';
        const updatedProfile = await userService.updateProfile(userId, updates);
        
        const newUserData = { 
          ...user, 
          ...updatedProfile,
          preferences: { ...user?.preferences, ...updatedProfile.preferences }
        };
        
        setUserProfile(updatedProfile);
        setUser(newUserData);
        return updatedProfile;
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  };

  const updatePreferences = async (preferences) => {
    try {
      if (isAuthenticated) {
        // Update authenticated user preferences
        const result = await authService.updatePreferences(preferences);
        
        if (result.success) {
          setUser(result.user);
          setUserProfile(result.user);
          return { success: true, preferences: result.user.preferences };
        } else {
          throw new Error(result.error || 'Failed to update preferences');
        }
      } else {
        // Update local preferences for non-authenticated users
        const userId = user?.id || 'default_user';
        const response = await userService.updatePreferences(userId, preferences);
        
        if (response.success) {
          const newUserData = { 
            ...user, 
            preferences: response.preferences 
          };
          
          setUser(newUserData);
          setUserProfile({ ...userProfile, preferences: response.preferences });
          return response;
        } else {
          throw new Error(response.error || 'Failed to update preferences');
        }
      }
    } catch (error) {
      console.error('Failed to update preferences:', error);
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      const result = await authService.login(email, password);
      
      if (result.success) {
        setUser(result.user);
        setUserProfile(result.user);
        setIsAuthenticated(true);
        
        // Trigger content reload
        window.dispatchEvent(new CustomEvent('auth-state-changed'));
        
        // Show welcome notification
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('show-login-success', {
            detail: { userName: result.user.display_name || result.user.first_name }
          }));
        }, 500);
        
        return result;
      } else {
        return result;
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  };

  const register = async (userData) => {
    try {
      const result = await authService.register(userData);
      
      if (result.success) {
        setUser(result.user);
        setUserProfile(result.user);
        setIsAuthenticated(true);
        
        // Trigger content reload
        window.dispatchEvent(new CustomEvent('auth-state-changed'));
        
        // Show welcome notification
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('show-registration-success', {
            detail: { userName: result.user.display_name || result.user.first_name }
          }));
        }, 500);
        
        return result;
      } else {
        return result;
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Registration failed' };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setUserProfile(null);
      setIsAuthenticated(false);
      
      // Load default profile after logout
      await loadDefaultProfile();
      
      // Trigger content reload
      window.dispatchEvent(new CustomEvent('auth-state-changed'));
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const checkUsageLimits = async () => {
    if (isAuthenticated) {
      return await authService.checkUsageLimits();
    } else {
      // For non-authenticated users, return unlimited usage
      return {
        success: true,
        usage: {
          allowed: true,
          current_usage: 0,
          limit: 'unlimited'
        }
      };
    }
  };

  return (
    <UserContext.Provider value={{
      user,
      userProfile,
      loading,
      isAuthenticated,
      updateProfile,
      updatePreferences,
      loadUserProfile,
      login,
      register,
      logout,
      checkUsageLimits
    }}>
      {children}
    </UserContext.Provider>
  );
};