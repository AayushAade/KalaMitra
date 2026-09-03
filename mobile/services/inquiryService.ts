import { supabase } from '../lib/supabase';
import { Inquiry } from '../types';
import { mockInquiries } from '../data/mockInquiries';

let inMemoryInquiries: Inquiry[] = [...mockInquiries];

export const inquiryService = {
  getInquiries: (): Inquiry[] => {
    return inMemoryInquiries;
  },

  getInquiryById: (id: string): Inquiry | undefined => {
    return inMemoryInquiries.find(i => i.id === id);
  },

  /**
   * Fetches real inquiries for the authenticated participant from Supabase.
   */
  fetchInquiries: async (): Promise<Inquiry[]> => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        return inMemoryInquiries;
      }

      const { data, error } = await supabase
        .from('inquiries')
        .select(`
          id,
          buyer_id,
          product_id,
          quantity,
          expected_delivery,
          status,
          created_at,
          products (
            id,
            price,
            artisan_id,
            product_translations ( name ),
            product_images ( enhanced_url, original_url, is_primary )
          ),
          buyer_profiles (
            id,
            company_name,
            location
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[InquiryService] Failed to fetch inquiries from Supabase:', error.message);
        return inMemoryInquiries;
      }

      if (data) {
        const mapped: Inquiry[] = data.map((row: any) => {
          const product = row.products;
          const translation = product?.product_translations?.[0];
          const image = product?.product_images?.find((img: any) => img.is_primary) || product?.product_images?.[0];
          const buyer = row.buyer_profiles;

          return {
            id: row.id,
            productId: row.product_id,
            productTitle: translation?.name || 'Handcrafted Product',
            productPrice: product?.price || 0,
            productImage: image?.enhanced_url || image?.original_url || '',
            buyerName: buyer?.company_name || 'Verified Buyer',
            buyerType: 'Wholesale Buyer',
            buyerLocation: buyer?.location || 'India',
            quantity: row.quantity,
            expectedDelivery: row.expected_delivery || undefined,
            message: '',
            status: row.status,
            date: new Date(row.created_at).toLocaleDateString('en-IN', {
              month: 'short',
              day: 'numeric'
            }),
          };
        });

        inMemoryInquiries = mapped;
        return mapped;
      }
    } catch (err) {
      console.error('[InquiryService] Exception fetching inquiries:', err);
    }
    return inMemoryInquiries;
  },

  /**
   * Persists a new wholesale inquiry to Supabase and records the initial message.
   */
  createInquiry: async (inquiryData: {
    productId: string;
    productTitle: string;
    productPrice: number;
    productImage?: string;
    buyerName: string;
    buyerType?: string;
    buyerLocation?: string;
    quantity?: number;
    expectedDelivery?: string;
    message: string;
  }): Promise<Inquiry> => {
    let savedId = '';
    try {
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      const userId = authData?.user?.id;

      if (!userId || authErr) {
        throw new Error('Authentication required to submit a bulk inquiry. Please sign in.');
      }

      // 1. Ensure buyer profile exists for this authenticated user ID
      const { error: bpErr } = await supabase
        .from('buyer_profiles')
        .upsert(
          {
            id: userId,
            company_name: inquiryData.buyerName || 'Verified Buyer',
            business_type: inquiryData.buyerType || 'Wholesale Buyer',
            location: inquiryData.buyerLocation || 'India',
          },
          { onConflict: 'id' }
        );

      if (bpErr) {
        console.warn('[InquiryService] Note on buyer_profiles upsert:', bpErr.message);
      }

      // 2. Insert core inquiry record into public.inquiries
      const { data: newRow, error: inqErr } = await supabase
        .from('inquiries')
        .insert({
          buyer_id: userId,
          product_id: inquiryData.productId,
          quantity: inquiryData.quantity || 1,
          expected_delivery: inquiryData.expectedDelivery || null,
          status: 'New',
        })
        .select()
        .single();

      if (inqErr || !newRow) {
        console.error('[InquiryService] Error inserting inquiry:', inqErr);
        throw new Error(`Failed to submit inquiry: ${inqErr?.message || 'Database insert error'}`);
      }

      savedId = newRow.id;

      // 3. Insert initial message into public.messages
      if (inquiryData.message && inquiryData.message.trim()) {
        const { error: msgErr } = await supabase
          .from('messages')
          .insert({
            inquiry_id: newRow.id,
            sender_id: userId,
            sender_role: 'Buyer',
            text: inquiryData.message.trim(),
          });

        if (msgErr) {
          console.warn('[InquiryService] Non-fatal error inserting initial chat message:', msgErr.message);
        }
      }
    } catch (err: any) {
      console.error('[InquiryService] Exception during inquiry creation:', err);
      throw err;
    }

    const newInquiry: Inquiry = {
      id: savedId,
      productId: inquiryData.productId,
      productTitle: inquiryData.productTitle,
      productPrice: inquiryData.productPrice,
      productImage: inquiryData.productImage,
      buyerName: inquiryData.buyerName,
      buyerType: inquiryData.buyerType || 'Wholesale Buyer',
      buyerLocation: inquiryData.buyerLocation || 'India',
      quantity: inquiryData.quantity,
      expectedDelivery: inquiryData.expectedDelivery,
      message: inquiryData.message,
      status: 'New',
      date: 'Just Now',
    };

    inMemoryInquiries = [newInquiry, ...inMemoryInquiries.filter(i => i.id !== newInquiry.id)];
    return newInquiry;
  },

  updateInquiryStatus: async (id: string, status: 'New' | 'Replied' | 'Closed'): Promise<void> => {
    console.log(`[InquiryService] Updating status of inquiry ${id} to ${status}`);
    const inquiry = inMemoryInquiries.find(i => i.id === id);
    if (inquiry) {
      inquiry.status = status;
    }

    try {
      await supabase
        .from('inquiries')
        .update({ status })
        .eq('id', id);
    } catch (err) {
      console.warn('[InquiryService] Failed to update inquiry status in Supabase:', err);
    }
  }
};
