import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API URL configuration
// For local development: Use your computer's local IP address
// Find it by running: ipconfig (Windows) or ifconfig (Mac/Linux)
// Make sure your phone and computer are on the same WiFi network
const API_URL = __DEV__ 
  ? 'http://192.168.1.152:3000/api'  // Your local IP - update if needed
  : 'https://your-production-url.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  username: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  elo_rating: number;
  debates_won: number;
  debates_lost: number;
  debates_tied: number;
  total_debates: number;
}

export const authAPI = {
  login: async (credentials: LoginCredentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
      await AsyncStorage.setItem('auth_token', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  signup: async (data: SignupData) => {
    const response = await api.post('/auth/signup', data);
    if (response.data.token) {
      await AsyncStorage.setItem('auth_token', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: async () => {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user');
    return api.post('/auth/logout');
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    // API returns { user: ... } or just the user object
    return response.data.user || response.data;
  },
};

export default api;

