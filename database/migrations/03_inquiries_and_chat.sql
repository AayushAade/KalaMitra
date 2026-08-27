-- Create B2B inquiries table
CREATE TABLE public.inquiries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    buyer_id uuid REFERENCES public.buyer_profiles(id) ON DELETE SET NULL, -- Nullable to keep records if buyer is deleted
    product_id uuid REFERENCES public.products(id) ON DELETE SET NULL, -- Nullable to preserve history if product is deleted
    quantity integer NOT NULL,
    expected_delivery text,
    status varchar(20) DEFAULT 'New' NOT NULL CHECK (status IN ('New', 'Replied', 'Closed')),
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create inquiry messages table
CREATE TABLE public.messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    inquiry_id uuid REFERENCES public.inquiries(id) ON DELETE CASCADE NOT NULL,
    sender_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    sender_role varchar(20) NOT NULL CHECK (sender_role IN ('Buyer', 'Artisan')),
    text text NOT NULL,
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexing for fast inquiry retrieval and chronological messaging logs
CREATE INDEX idx_inquiries_buyer_id ON public.inquiries(buyer_id);
CREATE INDEX idx_inquiries_product_id ON public.inquiries(product_id);
CREATE INDEX idx_inquiries_status ON public.inquiries(status);
CREATE INDEX idx_messages_inquiry_id ON public.messages(inquiry_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
