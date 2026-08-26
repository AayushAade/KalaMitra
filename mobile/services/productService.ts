import { Product } from '../types';
import { mockProducts } from '../data/mockProducts';

// In-memory catalog state for products. Initialize with mockProducts.
let inMemoryProducts: Product[] = [...mockProducts];

export const productService = {
  getProducts: (): Product[] => {
    return inMemoryProducts;
  },

  getProductById: (id: string): Product | undefined => {
    return inMemoryProducts.find(p => p.id === id);
  },

  createProduct: (product: Product): Product => {
    console.log(`[ProductService] Creating product listing:`, product);
    inMemoryProducts = [product, ...inMemoryProducts];
    return product;
  },

  getProductPresets: () => {
    return [
      {
        id: 'preset-1',
        name: 'Silk Dupatta',
        rawImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDTUa1QpA9Wp_sE8hHw8G5m5qW4Jt9Gk7O2LqV0v2s3x4c5v6b7n8m9',
        enhancedImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD9NdqtHHuX-C3fTyPOFZyJHmhxGdmIUVFNHQnBFec-x4sM6nam9v8zGl_A50EYGmZPn11LroWhvKHY5FCPYBHMXB8smCONqVv0H_O5bW-yoFUMcCyNZrnpHOq1c5STMMu_HCBEfCqtgew-DNpDA_CpmKQ8Hqd4TNZ9Ul3u_9AuI_LdlQ_rhb5UzODrcnCCzKSeWTTtYcrI2hIt2BuU6Z06-W5UYr8AKVJJQ3n9_6C3Kg4iBz6f2QhI',
      },
      {
        id: 'preset-2',
        name: 'Bamboo Basket',
        rawImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCXcQG2IuC0hmcLXI_X7NLHkQS6FBTajGjmTZYlqwFRaBAchUoU9qXJYnXU85awVMUWhJLn6H8iREvMMm0LOxSqbKMT3mofJ_m9uovpzG-9Knzfv04Z_EPyVum0R5IpYVXGknClHW3hb2Y-ruGkmYBiyFRQFAP6Eg0B56uJ0abfnjTmc45ApRtHGAQFhn7toeu_imQWT1-rgMhI0iK3mklaTSDTIIQHHUHyKPtXnzS7CEQMqVR4xNud',
        enhancedImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCXcQG2IuC0hmcLXI_X7NLHkQS6FBTajGjmTZYlqwFRaBAchUoU9qXJYnXU85awVMUWhJLn6H8iREvMMm0LOxSqbKMT3mofJ_m9uovpzG-9Knzfv04Z_EPyVum0R5IpYVXGknClHW3hb2Y-ruGkmYBiyFRQFAP6Eg0B56uJ0abfnjTmc45ApRtHGAQFhn7toeu_imQWT1-rgMhI0iK3mklaTSDTIIQHHUHyKPtXnzS7CEQMqVR4xNud',
      },
      {
        id: 'preset-3',
        name: 'Pottery Vase',
        rawImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD9L4t3U8f9O_Pq5f8g7h9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z',
        enhancedImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD7xJz0GjR9O1y2u3v4w5x6y7z8a9b0c1d2e3f4g5h6i7j8k9l0',
      }
    ];
  }
};
