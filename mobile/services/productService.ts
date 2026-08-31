import { Product } from '../types';
import { mockProducts } from '../data/mockProducts';
import { supabase } from '../lib/supabase';

// In-memory catalog state for products initialized with mockProducts
let inMemoryProducts: Product[] = [...mockProducts];

export const productService = {
  /**
   * Synchronous getter for in-memory catalog state.
   */
  getProducts: (): Product[] => {
    return inMemoryProducts;
  },

  /**
   * Synchronous getter for product by ID.
   */
  getProductById: (id: string): Product | undefined => {
    return inMemoryProducts.find(p => p.id === id);
  },

  /**
   * Asynchronously fetches all products from Supabase, joining images,
   * translations, and artisan profiles, and merges them with mock seed items.
   */
  fetchProducts: async (): Promise<Product[]> => {
    console.log('[ProductService] Fetching products from Supabase...');
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          artisan_id,
          price,
          material,
          production_time,
          craft,
          stock,
          min_order_quantity,
          created_at,
          artisan_profiles:artisan_id (
            shop_name,
            owner_name
          ),
          product_images (
            original_url,
            enhanced_url,
            is_primary
          ),
          product_translations (
            language,
            name,
            description,
            voice_transcript
          ),
          product_tags (
            tag_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[ProductService] Failed to fetch products from Supabase:', error.message);
        return inMemoryProducts;
      }

      if (data && data.length > 0) {
        const liveProducts: Product[] = data.map((row: any) => {
          const primaryImage =
            row.product_images?.find((img: any) => img.is_primary) ||
            row.product_images?.[0];
          const enTrans =
            row.product_translations?.find((t: any) => t.language === 'en') ||
            row.product_translations?.[0];
          const hiTrans =
            row.product_translations?.find((t: any) => t.language === 'hi');

          const artisanInfo = Array.isArray(row.artisan_profiles)
            ? row.artisan_profiles[0]
            : row.artisan_profiles;

          return {
            id: row.id,
            name: enTrans?.name || hiTrans?.name || 'Handcrafted Product',
            imageUrl: primaryImage?.enhanced_url || primaryImage?.original_url || '',
            originalImageUrl: primaryImage?.original_url,
            material: row.material || undefined,
            price: Number(row.price),
            artisanName: artisanInfo?.shop_name || artisanInfo?.owner_name || 'Artisan Store',
            craft: row.craft || undefined,
            productionTime: row.production_time || undefined,
            stock: row.stock,
            minOrderQuantity: row.min_order_quantity,
            descriptionEnglish: enTrans?.description || undefined,
            descriptionHindi: hiTrans?.description || undefined,
            tags: row.product_tags?.map((t: any) => t.tag_name) || [],
            createdAt: row.created_at
          };
        });

        // Deduplicate against mock products
        const liveIds = new Set(liveProducts.map(p => p.id));
        const liveNames = new Set(liveProducts.map(p => p.name.toLowerCase()));
        const seedRemaining = mockProducts.filter(
          m => !liveIds.has(m.id) && !liveNames.has(m.name.toLowerCase())
        );

        inMemoryProducts = [...liveProducts, ...seedRemaining];
        console.log(`[ProductService] Loaded ${liveProducts.length} live products, ${seedRemaining.length} demo seed products.`);
        return inMemoryProducts;
      }

      return inMemoryProducts;
    } catch (err: any) {
      console.error('[ProductService] Error in fetchProducts:', err);
      return inMemoryProducts;
    }
  },

  /**
   * Persists a newly created product listing to Supabase (products, product_images,
   * product_translations, product_tags) using the authenticated artisan session.
   */
  createProduct: async (productInput: Partial<Product> & { name: string; price: number }): Promise<Product> => {
    console.log('[ProductService] Creating product listing in Supabase:', productInput.name);

    // 1. Get authenticated user
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData.user) {
      throw new Error('Authentication required to publish products to the marketplace. Please log in.');
    }

    const artisanId = authData.user.id;

    // 2. Insert into public.products
    const { data: productRow, error: prodErr } = await supabase
      .from('products')
      .insert({
        artisan_id: artisanId,
        price: productInput.price,
        material: productInput.material || null,
        production_time: productInput.productionTime || null,
        craft: productInput.craft || null,
        stock: productInput.stock || 1,
        min_order_quantity: productInput.minOrderQuantity || 1
      })
      .select()
      .single();

    if (prodErr || !productRow) {
      console.error('[ProductService] Failed to insert product row:', prodErr);
      throw new Error(`Failed to publish product: ${prodErr?.message || 'Database insert error'}`);
    }

    const productId = productRow.id;

    // 3. Insert into public.product_images
    const originalUrl = productInput.originalImageUrl || productInput.imageUrl || '';
    const enhancedUrl = productInput.imageUrl || null;

    if (originalUrl || enhancedUrl) {
      const { error: imgErr } = await supabase
        .from('product_images')
        .insert({
          product_id: productId,
          original_url: originalUrl || enhancedUrl,
          enhanced_url: enhancedUrl,
          is_primary: true
        });

      if (imgErr) {
        console.error('[ProductService] Failed to insert product images:', imgErr);
        // Rollback core product row
        await supabase.from('products').delete().eq('id', productId);
        throw new Error(`Failed to save product images: ${imgErr.message}`);
      }
    }

    // 4. Insert into public.product_translations
    const translationsToInsert = [];
    if (productInput.name || productInput.descriptionEnglish) {
      translationsToInsert.push({
        product_id: productId,
        language: 'en',
        name: productInput.name,
        description: productInput.descriptionEnglish || null,
        voice_transcript: productInput.voiceTranscript || null
      });
    }
    if (productInput.descriptionHindi) {
      translationsToInsert.push({
        product_id: productId,
        language: 'hi',
        name: productInput.name,
        description: productInput.descriptionHindi,
        voice_transcript: productInput.voiceTranscript || null
      });
    }
    if (translationsToInsert.length === 0) {
      translationsToInsert.push({
        product_id: productId,
        language: 'en',
        name: productInput.name
      });
    }

    const { error: transErr } = await supabase
      .from('product_translations')
      .insert(translationsToInsert);

    if (transErr) {
      console.error('[ProductService] Failed to insert product translations:', transErr);
      // Rollback
      await supabase.from('products').delete().eq('id', productId);
      throw new Error(`Failed to save product translations: ${transErr.message}`);
    }

    // 5. Insert into public.product_tags (optional)
    if (productInput.tags && productInput.tags.length > 0) {
      const tagsToInsert = productInput.tags.map(tag => ({
        product_id: productId,
        tag_name: tag.slice(0, 50)
      }));
      const { error: tagErr } = await supabase
        .from('product_tags')
        .insert(tagsToInsert);

      if (tagErr) {
        console.warn('[ProductService] Failed to insert product tags (non-fatal):', tagErr.message);
      }
    }

    // 6. Construct normalized Product
    const createdProduct: Product = {
      id: productId,
      name: productInput.name,
      imageUrl: enhancedUrl || originalUrl,
      originalImageUrl: originalUrl,
      material: productInput.material,
      price: Number(productRow.price),
      artisanName: productInput.artisanName || 'My Store',
      craft: productInput.craft,
      productionTime: productInput.productionTime,
      stock: productRow.stock,
      minOrderQuantity: productRow.min_order_quantity,
      descriptionEnglish: productInput.descriptionEnglish,
      descriptionHindi: productInput.descriptionHindi,
      tags: productInput.tags,
      createdAt: productRow.created_at
    };

    // Update in-memory cache
    inMemoryProducts = [createdProduct, ...inMemoryProducts.filter(p => p.id !== createdProduct.id)];

    return createdProduct;
  },

  getProductPresets: () => {
    return [
      {
        id: 'preset-1',
        name: 'Silk Dupatta',
        rawImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD9NdqtHHuX-C3fTyPOFZyJHmhxGdmIUVFNHQnBFec-x4sM6nam9v8zGl_A50EYGmZPn11LroWhvKHY5FCPYBHMXB8smCONqVv0H_O5bW-yoFUMcCyNZrnpHOq1c5STMMu_HCBEfCqtgew-DNpDA_CpmKQ8Hqd4TNZ9Ul3u_9AuI_LdlQ_rhb5UzODrcnCCzKSeWTTtYcrI2hIt2BuU6Z06-W5UYr8AKVJJQ3n9_6C3Kg4iBz6f2QhI',
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
        rawImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYDVxXiG1dMVQO05bifmAAM_MlqVdxlRfbr0Q7nWUR4dc93terX2jKdxbmNSe-axfInjZH-ReiV2UeHBUJY_eszFGNG3U-0th9I9hWDsxr6D3jNeV-Nfq-gk1-QO0WAQ56z8r8tqZWnx1oBcGYB2gOWuqMCg2SRtl5PGzHznvmQH7hUw9pLkHoIhfPEojBMtrlOoHPOncYYLAjMmewJxDfEOtITbyH3dOIFNFE0X20UVfMrJ-Cqz9E',
        enhancedImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYDVxXiG1dMVQO05bifmAAM_MlqVdxlRfbr0Q7nWUR4dc93terX2jKdxbmNSe-axfInjZH-ReiV2UeHBUJY_eszFGNG3U-0th9I9hWDsxr6D3jNeV-Nfq-gk1-QO0WAQ56z8r8tqZWnx1oBcGYB2gOWuqMCg2SRtl5PGzHznvmQH7hUw9pLkHoIhfPEojBMtrlOoHPOncYYLAjMmewJxDfEOtITbyH3dOIFNFE0X20UVfMrJ-Cqz9E',
      }
    ];
  }
};
