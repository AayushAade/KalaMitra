// Base API Service for DIY-Nest FastAPI Integration
// Standard backend URL prefix: /api/v1
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `API Request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn(`Backend API unavailable at ${url}. Falling back to client-side state. Error:`, error.message);
    throw error;
  }
}

export default {
  API_BASE_URL,
  request,
};
