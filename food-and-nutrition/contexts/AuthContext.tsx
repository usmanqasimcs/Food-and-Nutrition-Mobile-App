import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import Toast from 'react-native-toast-message';
import { API_CONFIG } from '../config/api';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Use the API configuration
  const API_BASE = API_CONFIG.BASE_URL;

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userData = await AsyncStorage.getItem('userData');
      
      if (token && userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Check for demo account first
      if (email === 'demo@foodnutrition.app' && password === 'demo123') {
        const demoUser: User = {
          id: 'demo-user-123',
          email: 'demo@foodnutrition.app',
          name: 'Demo User',
          avatar: undefined,
          createdAt: new Date().toISOString(),
        };
        
        // Store demo auth data
        await AsyncStorage.setItem('authToken', 'demo-token-123');
        await AsyncStorage.setItem('userData', JSON.stringify(demoUser));
        
        setUser(demoUser);
        Toast.show({
          type: 'success',
          text1: 'Welcome back!',
          text2: `Logged in as ${demoUser.name}`,
        });
        return true;
      }
      
      // Try to connect to the FastAPI server
      try {
        const response = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: API_CONFIG.HEADERS,
          body: JSON.stringify({ email, password }),
        });

        if (response.ok) {
          const data = await response.json();
          
          // Store auth data
          await AsyncStorage.setItem('authToken', data.token);
          await AsyncStorage.setItem('userData', JSON.stringify(data.user));
          
          setUser(data.user);
          Toast.show({
            type: 'success',
            text1: 'Welcome back!',
            text2: `Logged in as ${data.user.name}`,
          });
          return true;
        } else {
          const error = await response.json();
          Toast.show({
            type: 'error',
            text1: 'Login Failed',
            text2: error.message || 'Invalid credentials',
          });
          return false;
        }
      } catch (networkError) {
        // Network error - show helpful message about demo account
        console.error('Network error:', networkError);
        Toast.show({
          type: 'error',
          text1: 'Server Unavailable',
          text2: 'Try the demo account: demo@foodnutrition.app / demo123',
        });
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: 'An unexpected error occurred. Please try again.',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Mock registration - replace with actual API call
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Store auth data
        await AsyncStorage.setItem('authToken', data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));
        
        setUser(data.user);
        Toast.show({
          type: 'success',
          text1: 'Account Created!',
          text2: `Welcome ${data.user.name}!`,
        });
        return true;
      } else {
        const error = await response.json();
        Toast.show({
          type: 'error',
          text1: 'Registration Failed',
          text2: error.message || 'Unable to create account',
        });
        return false;
      }
    } catch (error) {
      console.error('Registration error:', error);
      Toast.show({
        type: 'error',
        text1: 'Registration Failed',
        text2: 'Network error. Please try again.',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(['authToken', 'userData']);
      setUser(null);
      Toast.show({
        type: 'success',
        text1: 'Logged out',
        text2: 'Come back soon!',
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      
      const response = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        Toast.show({
          type: 'success',
          text1: 'Profile Updated',
          text2: 'Your changes have been saved',
        });
        return true;
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'Unable to update profile',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      const response = await fetch(`${API_BASE}/auth/delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await AsyncStorage.multiRemove(['authToken', 'userData']);
        setUser(null);
        Toast.show({
          type: 'success',
          text1: 'Account Deleted',
          text2: 'Your account has been permanently deleted',
        });
      } else {
        throw new Error('Failed to delete account');
      }
    } catch (error) {
      console.error('Delete account error:', error);
      Toast.show({
        type: 'error',
        text1: 'Delete Failed',
        text2: 'Unable to delete account',
      });
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    deleteAccount,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
