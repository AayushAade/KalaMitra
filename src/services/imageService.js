const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const imageService = {
  async enhanceImage(imageInput, options = {}) {
    try {
      const formData = new FormData();

      if (imageInput instanceof Blob || imageInput instanceof File) {
        formData.append('image', imageInput, imageInput.name || 'product.jpg');
      } else if (typeof imageInput === 'string') {
        if (imageInput.startsWith('data:') || imageInput.startsWith('http')) {
          const res = await fetch(imageInput);
          const blob = await res.blob();
          formData.append('image', blob, 'product.jpg');
        }
      }

      const category = options.productCategory || options.category || 'GENERIC_HANDICRAFT';
      const style = options.style || 'CLEAN_ECOMMERCE';

      formData.append('productCategory', category);
      formData.append('style', style);
      if (options.productName) formData.append('productName', options.productName);
      if (options.productDescription) formData.append('productDescription', options.productDescription);

      const response = await fetch(`${API_BASE_URL}/api/products/image-enhance`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server returned status ${response.status}`);
      }

      const data = await response.json();
      return {
        original: data.originalImageUrl || imageInput,
        enhanced: data.imageUrl,
        provider: data.provider,
        fallbackUsed: data.fallbackUsed,
        category: data.category,
        style: data.style,
        status: data.success ? 'success' : 'error',
      };
    } catch (err) {
      console.warn('[WebImageService] Error invoking /api/products/image-enhance:', err);
      throw err;
    }
  },
};

export default imageService;

