import { request } from './api';

export const authService = {
  async login(credentials) {
    try {
      return await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    } catch {
      // Mock login response
      return {
        user: {
          id: 'artisan-1',
          name: credentials.phone || 'Savita Handicrafts',
          role: credentials.role || 'artisan',
          location: 'Pune, Maharashtra',
          craft: 'Bamboo & Textile Crafts',
          token: 'mock-jwt-token-12345'
        }
      };
    }
  },

  async register(artisanData) {
    try {
      return await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(artisanData),
      });
    } catch {
      // Mock register response
      return {
        user: {
          id: `artisan-${Date.now()}`,
          name: artisanData.name || 'Savita Handicrafts',
          phone: artisanData.phone || '+91 98765 43210',
          role: 'artisan',
          location: artisanData.location || 'Pune, Maharashtra',
          craft: artisanData.craft || 'Textile Crafts',
          language: artisanData.language || 'Hindi',
          token: `mock-jwt-token-${Date.now()}`
        }
      };
    }
  }
};

export default authService;
