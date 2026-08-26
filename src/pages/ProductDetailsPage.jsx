import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export const ProductDetailsPage = () => {
  const { id } = useParams();
  const { products, addInquiry, user } = useApp();
  const navigate = useNavigate();

  const product = products.find((p) => p.id === id) || products[0];

  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [quantity, setQuantity] = useState(100);
  const [expectedDelivery, setExpectedDelivery] = useState('2026-09-25');
  const [message, setMessage] = useState(
    `Interested in purchasing ${quantity} units of ${product.title} for retail/wholesale distribution. Please share delivery timeline and custom terms.`
  );
  const [inquirySubmitted, setInquirySubmitted] = useState(false);

  const handleInquirySubmit = (e) => {
    e.preventDefault();
    const newInq = addInquiry({
      productId: product.id,
      productTitle: product.title,
      productPrice: product.price,
      productImage: product.image,
      buyerName: user?.name || "Raj Traders",
      buyerType: "Retail Distributor",
      buyerLocation: "Mumbai, Maharashtra",
      quantity: Number(quantity),
      expectedDelivery,
      message
    });

    setInquirySubmitted(true);
    setTimeout(() => {
      setInquiryModalOpen(false);
      setInquirySubmitted(false);
      navigate(`/artisan/inquiries/${newInq.id}`);
    }, 1500);
  };

  return (
    <div className="bg-background min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Back button */}
      <div className="mb-6">
        <Link
          to="/marketplace"
          className="inline-flex items-center gap-1 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          <span>Back to Marketplace</span>
        </Link>
      </div>

      {/* Main product view grid */}
      <div className="bg-surface-container-lowest rounded-3xl soft-shadow border border-surface-variant p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Left: Product Images & Visual AI Enhancements */}
        <div className="space-y-4">
          <div className="h-80 sm:h-96 w-full rounded-2xl overflow-hidden bg-surface-dim relative border border-outline-variant/30">
            <img
              src={product.image}
              alt={product.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4 bg-tertiary-container text-on-tertiary-container px-3 py-1 rounded-full text-xs font-semibold shadow-md flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">auto_awesome</span> AI Enhanced Photo
            </div>
          </div>

          {/* Vernacular Language Preview Toggle */}
          <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/40 space-y-2">
            <div className="flex items-center justify-between text-xs text-on-surface-variant font-semibold">
              <span>Multilingual Catalog Description</span>
              <span className="text-primary font-bold">Hindi & English Available</span>
            </div>
            {product.descriptionHindi && (
              <p className="text-sm text-on-surface font-medium italic bg-surface-bright p-3 rounded-xl border">
                "{product.descriptionHindi}"
              </p>
            )}
          </div>
        </div>

        {/* Right: Product Details & Purchase/Inquiry actions */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-bold uppercase tracking-wider text-tertiary bg-tertiary-fixed px-3 py-1 rounded-full">
                {product.category}
              </span>
              <span className="text-xs text-green-700 font-bold bg-green-100 px-3 py-1 rounded-full flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-600"></span> In Stock ({product.quantity} units)
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-bold text-on-surface font-display-lg">
              {product.title}
            </h1>

            {/* Price section */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-bold text-primary font-display-lg">
                ₹{product.price}
              </span>
              {product.aiSuggestedPrice && (
                <span className="text-xs text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-full">
                  AI Pricing Recommendation Verified
                </span>
              )}
            </div>

            <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
              {product.descriptionEnglish}
            </p>

            {/* Specifications Card */}
            <div className="grid grid-cols-2 gap-3 bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30 text-xs sm:text-sm">
              <div>
                <span className="text-on-surface-variant block">Material:</span>
                <span className="font-bold text-on-surface">{product.material}</span>
              </div>
              <div>
                <span className="text-on-surface-variant block">Craft Technique:</span>
                <span className="font-bold text-on-surface">{product.craft}</span>
              </div>
              <div>
                <span className="text-on-surface-variant block">Production Time:</span>
                <span className="font-bold text-on-surface">{product.productionTime}</span>
              </div>
              <div>
                <span className="text-on-surface-variant block">Min Wholesale Bulk:</span>
                <span className="font-bold text-on-surface">{product.minBulkOrder || 10} units</span>
              </div>
            </div>

            {/* Artisan Information Profile Card */}
            <div className="bg-surface p-4 rounded-2xl border border-outline-variant/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCy1USh0c8IntFY5avkMXenmevurHwDA1Q4m7vKQnQg7-tsxS3lFEnAJi4vD1f6cxGcUG5FZJ2ns-D3sr92PAMybljwnAn2MxCu5Uaf6YT8S6ka8PxLfy6h-pIAEq24YCUlPrxz2XSsCBMD6s8DL_QogfRv7DwZfiDJkNn0gwsSD3686yq6LYYpopHjuBhLR0kUqwIJXXi5kMSxFKxCs8iAiOolYSlSrjlEiWniaWjilD3i6IJp6Zl3"
                  alt={product.artisanName}
                  className="w-12 h-12 rounded-full object-cover border"
                />
                <div>
                  <h4 className="font-bold text-on-surface text-sm sm:text-base">{product.artisanName}</h4>
                  <p className="text-xs text-on-surface-variant">📍 {product.artisanLocation}</p>
                </div>
              </div>
              <Link
                to="/artisan/store"
                className="px-3.5 py-1.5 bg-surface-container hover:bg-surface-container-high text-primary font-semibold text-xs rounded-xl transition-colors"
              >
                Visit Store
              </Link>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 space-y-3">
            <button
              onClick={() => setInquiryModalOpen(true)}
              className="w-full py-4 bg-primary text-on-primary font-semibold text-base rounded-2xl shadow-md hover:bg-surface-tint active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">handshake</span>
              <span>Request Bulk Wholesale Order</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Inquiry Modal */}
      {inquiryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-bright rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 soft-shadow border border-outline-variant animate-fadeIn">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-on-surface">Send Bulk Inquiry</h3>
                <p className="text-xs text-on-surface-variant">Direct request to {product.artisanName}</p>
              </div>
              <button
                onClick={() => setInquiryModalOpen(false)}
                className="p-1 text-on-surface-variant hover:bg-surface-container rounded-full"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {inquirySubmitted ? (
              <div className="text-center py-8 space-y-3">
                <span className="material-symbols-outlined text-5xl text-green-600">task_alt</span>
                <h4 className="text-xl font-bold text-on-surface">Inquiry Sent Successfully!</h4>
                <p className="text-xs text-on-surface-variant">Redirecting to chat with artisan...</p>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                    Requested Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                    Expected Delivery Date
                  </label>
                  <input
                    type="date"
                    required
                    value={expectedDelivery}
                    onChange={(e) => setExpectedDelivery(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                    Message / Custom Request Details
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm outline-none focus:border-primary resize-none"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setInquiryModalOpen(false)}
                    className="flex-1 py-3 border border-outline-variant text-on-surface font-semibold text-sm rounded-xl hover:bg-surface-container"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-primary text-on-primary font-semibold text-sm rounded-xl hover:bg-surface-tint"
                  >
                    Send Inquiry
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailsPage;
