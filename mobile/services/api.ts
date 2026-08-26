// Shared baseline configurations for backend API endpoints
export const API_BASE_URL = 'https://api.kalamitra.org/v1';

export const api = {
  get: async <T>(endpoint: string): Promise<T> => {
    // Simulated fetch call. In future phase this will do: await fetch(`${API_BASE_URL}${endpoint}`)
    console.log(`[API Mock GET] ${endpoint}`);
    throw new Error('Not implemented: mock mode active');
  },
  post: async <T>(endpoint: string, body: any): Promise<T> => {
    console.log(`[API Mock POST] ${endpoint}`, body);
    throw new Error('Not implemented: mock mode active');
  }
};
