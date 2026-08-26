import React from 'react';
import { Link } from 'react-router-dom';

export const HowItWorksPage = () => {
  return (
    <div className="bg-background text-on-background min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <h1 className="text-3xl sm:text-5xl font-bold font-display-lg text-primary">
          How DIY-Nest Works
        </h1>
        <p className="text-lg text-on-surface-variant leading-relaxed">
          Designed specifically for India’s rural and micro-artisans. No complex tech skills needed — just your voice, your phone camera, and your authentic craftsmanship.
        </p>
      </div>

      {/* 4 Detailed Flow Steps */}
      <div className="space-y-12">
        {/* Step 1 */}
        <div className="bg-surface-container-lowest p-6 sm:p-10 rounded-3xl soft-shadow border border-surface-variant grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-primary text-on-primary font-bold flex items-center justify-center text-xl">
              1
            </div>
            <h2 className="text-2xl font-bold text-on-surface font-title-md">1. Photo Capture & AI Enhancement</h2>
            <p className="text-on-surface-variant leading-relaxed">
              Take a raw photo of your crafted product right on your workbench. Our computer vision pipeline automatically isolates the craft, removes background clutter, fixes lighting gradients, and renders studio-quality product photos.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-tertiary bg-tertiary-fixed px-3 py-1.5 rounded-full w-fit">
              <span className="material-symbols-outlined text-sm">auto_awesome</span> Cloudinary & Vision AI Integration
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-md bg-surface-dim h-64 sm:h-80 relative">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD9NdqtHHuX-C3fTyPOFZyJHmhxGdmIUVFNHQnBFec-x4sM6nam9v8zGl_A50EYGmZPn11LroWhvKHY5FCPYBHMXB8smCONqVv0H_O5bW-yoFUMcCyNZrnpHOq1c5STMMu_HCBEfCqtgew-DNpDA_CpmKQ8Hqd4TNZ9Ul3u_9AuI_LdlQ_rhb5UzODrcnCCzKSeWTTtYcrI2hIt2BuU6Z06-W5UYr8AKVJJQ3n9_6C3Kg4iBz6f2QhI"
              alt="AI Enhanced Product"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-surface-container-lowest p-6 sm:p-10 rounded-3xl soft-shadow border border-surface-variant grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="order-2 md:order-1 rounded-2xl overflow-hidden shadow-md bg-surface-dim h-64 sm:h-80 relative flex items-center justify-center bg-gradient-to-br from-tertiary-container to-secondary">
            <div className="text-center text-on-tertiary-container p-6 space-y-3">
              <span className="material-symbols-outlined text-6xl pulse-animation">mic</span>
              <p className="font-semibold text-lg">"यह रेशम की हाथ से बुनी लाल और सुनहरी दुपट्टा है..."</p>
              <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-mono">Hindi / Marathi / English Voice Input</span>
            </div>
          </div>
          <div className="order-1 md:order-2 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-tertiary text-on-tertiary font-bold flex items-center justify-center text-xl">
              2
            </div>
            <h2 className="text-2xl font-bold text-on-surface font-title-md">2. Voice Description & Multilingual Understanding</h2>
            <p className="text-on-surface-variant leading-relaxed">
              Speak naturally in your mother tongue (Hindi, Marathi, or English). Voice processing extracts key details such as raw materials used, technique, craft tradition, colorways, and estimated labor hours.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-primary bg-primary-fixed px-3 py-1.5 rounded-full w-fit">
              <span className="material-symbols-outlined text-sm">translate</span> Google Gemini NLP Pipeline
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-surface-container-lowest p-6 sm:p-10 rounded-3xl soft-shadow border border-surface-variant grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-secondary text-on-secondary font-bold flex items-center justify-center text-xl">
              3
            </div>
            <h2 className="text-2xl font-bold text-on-surface font-title-md">3. AI Pricing Intelligence</h2>
            <p className="text-on-surface-variant leading-relaxed">
              Artisans often underprice their craftsmanship. Our pricing model evaluates material cost, labor hours spent, regional market benchmarks, and recommended profit margins to present fair price recommendations.
            </p>
            <blockquote className="italic text-sm text-on-surface-variant bg-surface-container-low p-4 rounded-xl border-l-4 border-primary">
              "AI suggests. You decide." You retain full authority over your selling price.
            </blockquote>
          </div>
          <div className="rounded-2xl p-6 bg-surface-bright border border-outline-variant shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-on-surface-variant font-medium">Material Cost:</span>
              <span className="font-bold">₹700</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-on-surface-variant font-medium">Labor Effort (5 days):</span>
              <span className="font-bold">₹500</span>
            </div>
            <div className="pt-2 border-t flex justify-between items-center text-primary font-bold text-lg">
              <span>Suggested Price:</span>
              <span>₹1,850</span>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="bg-surface-container-lowest p-6 sm:p-10 rounded-3xl soft-shadow border border-surface-variant grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="order-2 md:order-1 rounded-2xl overflow-hidden shadow-md bg-surface-dim h-64 sm:h-80 relative">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCXcQG2IuC0hmcLXI_X7NLHkQS6FBTajGjmTZYlqwFRaBAchUoU9qXJYnXU85awVMUWhJLn6H8iREvMMm0LOxSqbKMT3mofJ_m9uovpzG-9Knzfv04Z_EPyVum0R5IpYVXGknClHW3hb2Y-ruGkmYBiyFRQFAP6Eg0B56uJ0abfnjTmc45ApRtHGAQFhn7toeu_imQWT1-rgMhI0iK3mklaTSDTIIQHHUHyKPtXnzS7CEQMqVR4xNud"
              alt="Digital Marketplace"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="order-1 md:order-2 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-terracotta-container text-on-primary font-bold flex items-center justify-center text-xl">
              4
            </div>
            <h2 className="text-2xl font-bold text-on-surface font-title-md">4. Digital Listing & Bulk Buyer Inquiries</h2>
            <p className="text-on-surface-variant leading-relaxed">
              Instantly publish to your personalized digital storefront and the global buyer marketplace. Retailers, boutiques, and bulk buyers send direct inquiries for custom orders.
            </p>
            <div className="pt-2">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary font-semibold rounded-xl hover:bg-surface-tint transition-all"
              >
                Start Listing Products <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksPage;
