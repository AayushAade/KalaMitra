import { Platform } from 'react-native';
import { api } from './api';
import { ImageEnhanceOptions, ImageProcessingResult, StudioEnhanceResponse, ProductImageEnhanceResponse } from '../types';

/**
 * Converts a binary Blob to a Base64 Data URI on native React Native platforms.
 * React Native's native NetworkingModule on Android/iOS natively parses Data URIs
 * in FormData parts and streams the decoded binary payload with multipart headers.
 */
const blobToDataUri = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert image blob to Data URI.'));
      }
    };
    reader.onerror = () => {
      reject(reader.error || new Error('FileReader failed to read image blob.'));
    };
    reader.readAsDataURL(blob);
  });
};

export const imageService = {
  enhanceImage: async (
    imageUri: string,
    options?: ImageEnhanceOptions
  ): Promise<ImageProcessingResult> => {
    if (!imageUri || !imageUri.trim()) {
      throw new Error('No image URI provided for enhancement.');
    }

    const uriScheme = imageUri.startsWith('http://') || imageUri.startsWith('https://')
      ? 'remote_http'
      : imageUri.startsWith('data:')
      ? 'data_uri'
      : imageUri.startsWith('file://')
      ? 'local_file_uri'
      : imageUri.startsWith('content://')
      ? 'android_content_uri'
      : 'local_path';

    console.log(`[ImageService] ========================================`);
    console.log(`[ImageService] Starting Image Enhancement`);
    console.log(`[ImageService] Platform:   ${Platform.OS}`);
    console.log(`[ImageService] URI Scheme: ${uriScheme}`);
    console.log(`[ImageService] Image URI:  ${imageUri.length > 80 ? imageUri.substring(0, 80) + '...' : imageUri}`);
    console.log(`[ImageService] Target API: /api/v1/studio/enhance`);
    console.log(`[ImageService] ========================================`);

    const createFormData = async (): Promise<FormData> => {
      const fd = new FormData();

      if (uriScheme === 'remote_http') {
        const fetchRes = await fetch(imageUri);
        if (!fetchRes.ok) {
          throw new Error(`Failed to download remote preset image (HTTP ${fetchRes.status})`);
        }
        const blob = await fetchRes.blob();
        const mimeType = blob.type || 'image/jpeg';
        const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';

        if (Platform.OS === 'web') {
          fd.append('image', blob, `product.${ext}`);
        } else {
          const dataUri = await blobToDataUri(blob);
          fd.append('image', {
            uri: dataUri,
            name: `product.${ext}`,
            type: mimeType,
          } as any);
        }
      } else if (imageUri.startsWith('data:')) {
        const match = /^data:(image\/\w+);base64,/.exec(imageUri);
        const mimeType = match ? match[1] : 'image/jpeg';
        const ext = mimeType.includes('png') ? 'png' : 'jpg';

        if (Platform.OS === 'web') {
          const fetchRes = await fetch(imageUri);
          const blob = await fetchRes.blob();
          fd.append('image', blob, `product.${ext}`);
        } else {
          fd.append('image', {
            uri: imageUri,
            name: `product.${ext}`,
            type: mimeType,
          } as any);
        }
      } else {
        const filename = imageUri.split('/').pop() || 'product.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const mimeType = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';

        if (Platform.OS === 'web') {
          const fetchRes = await fetch(imageUri);
          const blob = await fetchRes.blob();
          fd.append('image', blob, filename);
        } else {
          fd.append('image', {
            uri: imageUri,
            name: filename,
            type: mimeType,
          } as any);
        }
      }

      const category = options?.productCategory || options?.category || 'GENERIC_HANDICRAFT';
      const style = options?.style || 'CLEAN_ECOMMERCE';

      fd.append('productCategory', category);
      fd.append('category', category);
      fd.append('style', style);
      if (options?.productName) {
        fd.append('productName', options.productName);
      }
      if (options?.productDescription) {
        fd.append('productDescription', options.productDescription);
      }

      fd.append('preset', options?.preset || 'warm_neutral');
      fd.append('aspect_ratio', options?.aspect_ratio || 'square_1x1');
      fd.append('add_shadow', String(options?.add_shadow !== undefined ? options.add_shadow : true));
      fd.append('quality_mode', options?.quality_mode || 'auto');
      fd.append('upscale_factor', String(options?.upscale_factor || 2));

      return fd;
    };

    // 2. Send request to FastAPI endpoint (/api/products/image-enhance with fallback to /api/v1/studio/enhance)
    try {
      const primaryFormData = await createFormData();
      const response = await api.post<ProductImageEnhanceResponse>('/api/products/image-enhance', primaryFormData);
      if (response.success && response.imageUrl) {
        return {
          originalUrl: response.originalImageUrl || imageUri,
          enhancedUrl: response.imageUrl,
          backgroundRemoved: true,
          lightingAdjusted: true,
          provider: response.provider,
          fallbackUsed: response.fallbackUsed,
          category: response.category,
          style: response.style,
          metadata: response.telemetry || {},
        };
      }
    } catch (apiErr: any) {
      console.warn('[ImageService] /api/products/image-enhance returned error, attempting /api/v1/studio/enhance fallback:', apiErr);
      try {
        const fallbackFormData = await createFormData();
        const studioRes = await api.post<StudioEnhanceResponse>('/api/v1/studio/enhance', fallbackFormData);
        if (studioRes.success && studioRes.enhanced?.secure_url) {
          return {
            originalUrl: studioRes.original?.secure_url || imageUri,
            enhancedUrl: studioRes.enhanced.secure_url,
            cutoutUrl: studioRes.cutout?.secure_url,
            backgroundRemoved: true,
            lightingAdjusted: true,
            provider: studioRes.provider,
            metadata: studioRes.metadata || {},
          };
        }
        throw new Error(studioRes.error || apiErr.message || 'AI vision enhancement failed.');
      } catch (fallbackErr: any) {
        console.error('[ImageService] Both enhancement endpoints failed:', fallbackErr);
        throw fallbackErr;
      }
    }

    throw new Error('AI vision enhancement failed to produce an enhanced asset.');
  }
};

