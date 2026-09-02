import { Product } from '../types';
import { mockProducts } from '../data/mockProducts';
import { supabase } from '../lib/supabase';

// In-memory catalog state for products initialized with mockProducts (for marketplace demo fallback)
let inMemoryProducts: Product[] = [...mockProducts];

const PRODUCT_SELECT_QUERY = `
  id,
  artisan_id,
  price,
  material,
  production_time,
  craft,
  stock,
  min_order_quantity,
  is_published,
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
`;

const mapProductRowToProduct = (row: any): Product => {
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
    artisanId: row.artisan_id,
    isPublished: row.is_published !== undefined ? row.is_published : true,
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
    voiceTranscript: enTrans?.voice_transcript || hiTrans?.voice_transcript || undefined,
    tags: row.product_tags?.map((t: any) => t.tag_name) || [],
    createdAt: row.created_at,
  };
};

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
   * Demo product presets for image selection / testing.
   */
  getProductPresets: () => {
    return [
      {
        name: 'Silk Dupatta',
        rawImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80',
        enhancedImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80',
      },
      {
        name: 'Bamboo Basket',
        rawImage: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&auto=format&fit=crop&q=80',
        enhancedImage: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&auto=format&fit=crop&q=80',
      },
      {
        name: 'Clay Pot',
        rawImage: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&auto=format&fit=crop&q=80',
        enhancedImage: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&auto=format&fit=crop&q=80',
      },
    ];
  },

  /**
   * Asynchronously fetches all published marketplace products from Supabase, joining images,
   * translations, and artisan profiles, and merges them with mock seed items for marketplace demo fallback.
   */
  fetchProducts: async (): Promise<Product[]> => {
    console.log('[ProductService] Fetching published marketplace products from Supabase...');
    try {
      const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_SELECT_QUERY)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[ProductService] Failed to fetch products from Supabase:', error.message);
        return inMemoryProducts;
      }

      if (data && data.length > 0) {
        const liveProducts: Product[] = data.map(mapProductRowToProduct);

        // Deduplicate against mock products for marketplace
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
   * Direct database query: fetches only products owned by the specified artisan ID.
   * Never injects mock products into an artisan's private inventory.
   */
  fetchMyProducts: async (artisanId: string): Promise<Product[]> => {
    if (!artisanId) return [];
    console.log(`[ProductService] Fetching private catalog for artisan: ${artisanId}`);
    try {
      const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_SELECT_QUERY)
        .eq('artisan_id', artisanId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error(`[ProductService] Failed to fetch private products for ${artisanId}:`, error.message);
        return [];
      }

      if (data && data.length > 0) {
        const myProducts = data.map(mapProductRowToProduct);
        console.log(`[ProductService] Fetched ${myProducts.length} private products for artisan: ${artisanId}`);
        return myProducts;
      }

      return [];
    } catch (err: any) {
      console.error('[ProductService] Exception in fetchMyProducts:', err);
      return [];
    }
  },

  /**
   * Resets in-memory product cache on logout.
   */
  reset: () => {
    inMemoryProducts = [...mockProducts];
  },

  /**
   * Persists a newly created product listing to Supabase (products, product_images,
   * product_translations, product_tags) using the authenticated artisan session.
   * Explicitly marks is_published = true.
   */
  createProduct: async (productInput: Partial<Product> & { name: string; price: number }): Promise<Product> => {
    console.log('[ProductService] Creating product listing in Supabase:', productInput.name);

    // 1. Get authenticated user
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData.user) {
      throw new Error('Authentication required to publish products to the marketplace. Please log in.');
    }

    const artisanId = authData.user.id;

    // 2. Insert into public.products with explicit is_published = true
    const { data: productRow, error: prodErr } = await supabase
      .from('products')
      .insert({
        artisan_id: artisanId,
        price: productInput.price,
        material: productInput.material || null,
        production_time: productInput.productionTime || null,
        craft: productInput.craft || null,
        stock: productInput.stock || 1,
        min_order_quantity: productInput.minOrderQuantity || 1,
        is_published: true,
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
          is_primary: true,
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
        voice_transcript: productInput.voiceTranscript || null,
      });
    }
    if (productInput.descriptionHindi) {
      translationsToInsert.push({
        product_id: productId,
        language: 'hi',
        name: productInput.name,
        description: productInput.descriptionHindi,
        voice_transcript: productInput.voiceTranscript || null,
      });
    }
    if (translationsToInsert.length === 0) {
      translationsToInsert.push({
        product_id: productId,
        language: 'en',
        name: productInput.name,
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
        tag_name: tag.slice(0, 50),
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
      artisanId: artisanId,
      isPublished: true,
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
      voiceTranscript: productInput.voiceTranscript,
      tags: productInput.tags,
      createdAt: productRow.created_at,
    };

    // Update in-memory cache
    inMemoryProducts = [createdProduct, ...inMemoryProducts.filter(p => p.id !== createdProduct.id)];
    return createdProduct;
  },
};
