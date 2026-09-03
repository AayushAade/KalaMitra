import { supabase } from '../lib/supabase';
import { Review } from '../types';

export const reviewService = {
  /**
   * Fetches all real customer reviews for a given artisan from Supabase.
   */
  fetchArtisanReviews: async (artisanId: string): Promise<Review[]> => {
    if (!artisanId) return [];

    try {
      const { data, error } = await supabase
        .from('artisan_reviews')
        .select(`
          id,
          artisan_id,
          buyer_id,
          inquiry_id,
          rating,
          review_text,
          created_at,
          buyer_profiles (
            company_name,
            location
          )
        `)
        .eq('artisan_id', artisanId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn(`[ReviewService] Error fetching reviews for artisan ${artisanId}:`, error.message);
        return [];
      }

      if (data) {
        return data.map((row: any) => ({
          id: row.id,
          artisanId: row.artisan_id,
          buyerId: row.buyer_id,
          inquiryId: row.inquiry_id || undefined,
          rating: Number(row.rating),
          reviewText: row.review_text || undefined,
          buyerName: row.buyer_profiles?.company_name || 'Verified Buyer',
          buyerLocation: row.buyer_profiles?.location || 'India',
          createdAt: row.created_at,
        }));
      }
    } catch (err) {
      console.error('[ReviewService] Exception fetching artisan reviews:', err);
    }

    return [];
  },

  /**
   * Checks whether a review has already been submitted for a specific inquiry.
   */
  getReviewForInquiry: async (inquiryId: string): Promise<Review | null> => {
    if (!inquiryId) return null;

    try {
      const { data, error } = await supabase
        .from('artisan_reviews')
        .select(`
          id,
          artisan_id,
          buyer_id,
          inquiry_id,
          rating,
          review_text,
          created_at
        `)
        .eq('inquiry_id', inquiryId)
        .maybeSingle();

      if (error) {
        console.warn(`[ReviewService] Error checking existing review for inquiry ${inquiryId}:`, error.message);
        return null;
      }

      if (data) {
        return {
          id: data.id,
          artisanId: data.artisan_id,
          buyerId: data.buyer_id,
          inquiryId: data.inquiry_id,
          rating: Number(data.rating),
          reviewText: data.review_text || undefined,
          createdAt: data.created_at,
        };
      }
    } catch (err) {
      console.error('[ReviewService] Exception fetching review for inquiry:', err);
    }

    return null;
  },

  /**
   * Determines if the currently authenticated user is eligible to rate the artisan for an inquiry.
   */
  canRateInquiry: async (
    inquiryId: string
  ): Promise<{
    eligible: boolean;
    reason?: string;
    artisanId?: string;
    artisanName?: string;
    existingReview?: Review | null;
  }> => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData?.user?.id;
      if (!currentUserId) {
        return { eligible: false, reason: 'Authentication required' };
      }

      // 1. Fetch inquiry with product and artisan details
      const { data: inq, error: inqErr } = await supabase
        .from('inquiries')
        .select(`
          id,
          buyer_id,
          status,
          products (
            id,
            artisan_id,
            artisan_profiles:artisan_id (
              id,
              shop_name,
              owner_name
            )
          )
        `)
        .eq('id', inquiryId)
        .single();

      if (inqErr || !inq) {
        return { eligible: false, reason: 'Inquiry not found' };
      }

      const product = inq.products as any;
      const artisanId = product?.artisan_id;
      const artisanProfiles = product?.artisan_profiles;
      const artisanName = artisanProfiles?.shop_name || artisanProfiles?.owner_name || 'Artisan';

      // 2. Buyer must be the inquiry author
      if (inq.buyer_id !== currentUserId) {
        return { eligible: false, reason: 'Only the inquiry buyer can rate this artisan.' };
      }

      // 3. Prevent self-rating
      if (artisanId === currentUserId) {
        return { eligible: false, reason: 'Artisans cannot rate their own store.' };
      }

      // 4. Check if already reviewed
      const existing = await reviewService.getReviewForInquiry(inquiryId);
      if (existing) {
        return {
          eligible: false,
          reason: 'Already reviewed',
          artisanId,
          artisanName,
          existingReview: existing,
        };
      }

      return {
        eligible: true,
        artisanId,
        artisanName,
      };
    } catch (err) {
      console.error('[ReviewService] Exception checking rating eligibility:', err);
      return { eligible: false, reason: 'Error checking eligibility' };
    }
  },

  /**
   * Submits a persistent rating & review to Supabase.
   */
  submitReview: async (params: {
    artisanId: string;
    inquiryId: string;
    rating: number;
    reviewText?: string;
  }): Promise<Review> => {
    const { artisanId, inquiryId, rating, reviewText } = params;

    if (!rating || rating < 1 || rating > 5) {
      throw new Error('Please select a rating between 1 and 5 stars.');
    }

    if (!artisanId) {
      throw new Error('Artisan identifier is required.');
    }

    if (!inquiryId) {
      throw new Error('Inquiry identifier is required. Reviews must be tied to a valid inquiry.');
    }

    const { data: authData, error: authErr } = await supabase.auth.getUser();
    const currentUserId = authData?.user?.id;
    if (!currentUserId || authErr) {
      throw new Error('You must be logged in to submit a review.');
    }

    if (currentUserId === artisanId) {
      throw new Error('You cannot rate your own artisan profile.');
    }

    // 1. Ensure buyer profile exists
    await supabase.from('buyer_profiles').upsert(
      {
        id: currentUserId,
        company_name: authData.user.email?.split('@')[0] || 'Verified Buyer',
        location: 'India',
      },
      { onConflict: 'id' }
    );

    // 2. Insert into public.artisan_reviews
    const { data: newRow, error } = await supabase
      .from('artisan_reviews')
      .insert({
        artisan_id: artisanId,
        buyer_id: currentUserId,
        inquiry_id: inquiryId,
        rating: Math.round(rating),
        review_text: reviewText?.trim() || null,
      })
      .select(`
        id,
        artisan_id,
        buyer_id,
        inquiry_id,
        rating,
        review_text,
        created_at
      `)
      .single();

    if (error) {
      if (
        error.message.includes('uq_artisan_reviews_buyer_inquiry') ||
        error.message.includes('uq_artisan_reviews_inquiry') ||
        error.code === '23505'
      ) {
        throw new Error('You have already submitted a review for this inquiry.');
      }
      if (error.message.includes('chk_no_self_rating')) {
        throw new Error('You cannot review your own store.');
      }
      throw new Error(`Failed to submit review: ${error.message}`);
    }

    console.log(`[ReviewService] Successfully submitted review for artisan ${artisanId}. Rating: ${rating}`);

    return {
      id: newRow.id,
      artisanId: newRow.artisan_id,
      buyerId: newRow.buyer_id,
      inquiryId: newRow.inquiry_id,
      rating: Number(newRow.rating),
      reviewText: newRow.review_text || undefined,
      createdAt: newRow.created_at,
    };
  },

  /**
   * Deletes a review from Supabase (triggers automatic rating recalculation).
   */
  deleteReview: async (reviewId: string): Promise<void> => {
    if (!reviewId) return;

    const { error } = await supabase
      .from('artisan_reviews')
      .delete()
      .eq('id', reviewId);

    if (error) {
      throw new Error(`Failed to delete review: ${error.message}`);
    }
  },
};
