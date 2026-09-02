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

    const formData = new FormData();

    // 1. Prepare image payload based on URI scheme and platform
    if (uriScheme === 'remote_http') {
      // Remote image URL: fetch the image bytes
      try {
        console.log(`[ImageService] Downloading remote image asset for enhancement...`);
        const fetchRes = await fetch(imageUri);
        if (!fetchRes.ok) {
          throw new Error(`Failed to download remote preset image (HTTP ${fetchRes.status})`);
        }
        const blob = await fetchRes.blob();
        console.log(`[ImageService] Downloaded remote image blob: ${blob.size} bytes, type: ${blob.type}`);
        const mimeType = blob.type || 'image/jpeg';
        const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';

        if (Platform.OS === 'web') {
          formData.append('image', blob, `product.${ext}`);
        } else {
          // Native Android/iOS: convert blob to Data URI so React Native FormData serializes the multipart file correctly
          const dataUri = await blobToDataUri(blob);
          formData.append('image', {
            uri: dataUri,
            name: `product.${ext}`,
            type: mimeType,
          } as any);
        }
      } catch (err: any) {
        console.error('[ImageService] Error processing remote image:', err);
        throw new Error(`Unable to fetch source image: ${err.message || err}`);
      }
    } else if (imageUri.startsWith('data:')) {
      // Data URI
      const match = /^data:(image\/\w+);base64,/.exec(imageUri);
      const mimeType = match ? match[1] : 'image/jpeg';
      const ext = mimeType.includes('png') ? 'png' : 'jpg';

      if (Platform.OS === 'web') {
        const fetchRes = await fetch(imageUri);
        const blob = await fetchRes.blob();
        formData.append('image', blob, `product.${ext}`);
      } else {
        formData.append('image', {
          uri: imageUri,
          name: `product.${ext}`,
          type: mimeType,
        } as any);
      }
    } else {
      // Local device file URI (file://, content://, etc.)
      const filename = imageUri.split('/').pop() || 'product.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const mimeType = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';

      if (Platform.OS === 'web') {
        const fetchRes = await fetch(imageUri);
        const blob = await fetchRes.blob();
        formData.append('image', blob, filename);
      } else {
        formData.append('image', {
          uri: imageUri,
          name: filename,
          type: mimeType,
        } as any);
      }
    }

    // 2. Set enhancement parameters matching product studio API
    const category = options?.productCategory || options?.category || 'GENERIC_HANDICRAFT';
    const style = options?.style || 'CLEAN_ECOMMERCE';

    formData.append('productCategory', category);
    formData.append('category', category);
    formData.append('style', style);
    if (options?.productName) {
      formData.append('productName', options.productName);
    }
    if (options?.productDescription) {
      formData.append('productDescription', options.productDescription);
    }

    formData.append('preset', options?.preset || 'warm_neutral');
    formData.append('aspect_ratio', options?.aspect_ratio || 'square_1x1');
    formData.append('add_shadow', String(options?.add_shadow !== undefined ? options.add_shadow : true));
    formData.append('quality_mode', options?.quality_mode || 'auto');
    formData.append('upscale_factor', String(options?.upscale_factor || 2));

    // 3. Send request to FastAPI endpoint (/api/products/image-enhance with fallback to /api/v1/studio/enhance)
    try {
      const response = await api.post<ProductImageEnhanceResponse>('/api/products/image-enhance', formData);
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
      const studioRes = await api.post<StudioEnhanceResponse>('/api/v1/studio/enhance', formData);
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
    }

    throw new Error('AI vision enhancement failed to produce an enhanced asset.');
  }
};

