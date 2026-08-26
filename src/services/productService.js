import { request } from './api';

export const productService = {
  async getProducts() {
    try {
      return await request('/products', { method: 'GET' });
    } catch {
      return null; // fallback to React Context state
    }
  },

  async getProductById(id) {
    try {
      return await request(`/products/${id}`, { method: 'GET' });
    } catch {
      return null; // fallback to React Context state
    }
  },

  async createProduct(productData) {
    try {
      return await request('/products', {
        method: 'POST',
        body: JSON.stringify(productData),
      });
    } catch {
      return { ...productData, id: `prod-${Date.now()}`, createdAt: new Date().toISOString() };
    }
  },

  async updateProduct(id, productData) {
    try {
      return await request(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(productData),
      });
    } catch {
      return { ...productData, id };
    }
  },

  async deleteProduct(id) {
    try {
      return await request(`/products/${id}`, { method: 'DELETE' });
    } catch {
      return { success: true, id };
    }
  }
};

export default productService;
