import { ImageProcessingResult } from '../types';

export const imageService = {
  processMockImage: async (originalUrl: string): Promise<ImageProcessingResult> => {
    console.log(`[ImageService] Processing raw photo for enhancement: ${originalUrl}`);
    // Simulate background removal processing lag
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      originalUrl,
      enhancedUrl: originalUrl, // Mock keeps preset URL
      backgroundRemoved: true,
      lightingAdjusted: true
    };
  }
};
