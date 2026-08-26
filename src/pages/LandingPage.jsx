import React from 'react';
import { Link } from 'react-router-dom';

export const LandingPage = () => {
  return (
    <div className="bg-background text-on-background min-h-screen">
      {/* Hero Section */}
      <section className="px- margin-mobile md:px-margin-desktop py-stack-lg md:py-20 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-stack-lg items-center">
          <div className="flex flex-col gap-stack-lg z-10">
            <h1 className="font-display-lg text-4xl sm:text-5xl lg:text-[56px] lg:leading-[64px] font-bold text-on-surface">
              Your craft deserves a{' '}
              <span className="text-primary relative inline-block">
                digital market.
                <svg className="absolute w-full h-3 -bottom-1 left-0 text-outline-variant" preserveAspectRatio="none" viewBox="0 0 100 10">
                  <path d="M0 5 Q 50 10 100 5" fill="transparent" stroke="currentColor" strokeWidth="2"></path>
                </svg>
              </span>
            </h1>
            <p className="font-body-lg text-lg text-on-surface-variant max-w-xl">
              Turn your handmade products into professional online listings with AI. Effortlessly bridge the gap between traditional heritage and modern commerce.
            </p>
            <div className="flex flex-col sm:flex-row gap-stack-md pt-stack-sm">
              <Link
                to="/register"
                className="h-14 px-8 rounded-2xl bg-primary text-on-primary font-label-lg text-label-lg hover:bg-surface-tint active:scale-95 transition-all shadow-[0_4px_20px_rgba(118,45,25,0.2)] flex items-center justify-center gap-2"
              >
                Start Selling <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
              <Link
                to="/marketplace"
                className="h-14 px-8 rounded-2xl bg-surface-container text-on-surface font-label-lg text-label-lg hover:bg-surface-container-high active:scale-95 transition-all flex items-center justify-center gap-2 border border-outline-variant"
              >
                Explore Marketplace
              </Link>
            </div>
          </div>

          {/* Interactive AI Preview Container */}
          <div className="relative h-[420px] sm:h-[480px] w-full rounded-[32px] overflow-hidden soft-shadow bg-surface-container-low group cursor-pointer">
            {/* Raw Workbench Image (Default) */}
            <div
              className="absolute inset-0 transition-opacity duration-700 ease-in-out opacity-100 group-hover:opacity-0 bg-cover bg-center"
              style={{
                backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCXcQG2IuC0hmcLXI_X7NLHkQS6FBTajGjmTZYlqwFRaBAchUoU9qXJYnXU85awVMUWhJLn6H8iREvMMm0LOxSqbKMT3mofJ_m9uovpzG-9Knzfv04Z_EPyVum0R5IpYVXGknClHW3hb2Y-ruGkmYBiyFRQFAP6Eg0B56uJ0abfnjTmc45ApRtHGAQFhn7toeu_imQWT1-rgMhI0iK3mklaTSDTIIQHHUHyKPtXnzS7CEQMqVR4xNud')`
              }}
            ></div>

            {/* AI Cleaned Listing Image (On Hover) */}
            <div
              className="absolute inset-0 transition-opacity duration-700 ease-in-out opacity-0 group-hover:opacity-100 bg-cover bg-center"
              style={{
                backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuD9NdqtHHuX-C3fTyPOFZyJHmhxGdmIUVFNHQnBFec-x4sM6nam9v8zGl_A50EYGmZPn11LroWhvKHY5FCPYBHMXB8smCONqVv0H_O5bW-yoFUMcCyNZrnpHOq1c5STMMu_HCBEfCqtgew-DNpDA_CpmKQ8Hqd4TNZ9Ul3u_9AuI_LdlQ_rhb5UzODrcnCCzKSeWTTtYcrI2hIt2BuU6Z06-W5UYr8AKVJJQ3n9_6C3Kg4iBz6f2QhI')`
              }}
            ></div>

            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>

            <div className="absolute bottom-6 left-6 right-6 glass-panel rounded-2xl p-4 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-tertiary-container flex items-center justify-center text-on-tertiary-container">
                  <span className="material-symbols-outlined">auto_awesome</span>
                </div>
                <div>
                  <p className="font-label-lg text-label-lg text-on-surface font-semibold">AI Image Enhancement</p>
                  <p className="text-xs sm:text-sm text-on-surface-variant">Hover to see professional marketplace listing</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="px-margin-mobile md:px-margin-desktop py-stack-lg md:py-24 bg-surface-container-low relative" id="how-it-works">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 class="font-headline-lg text-3xl md:text-4xl text-on-surface mb-4">From Workshop to World</h2>
            <p className="font-body-lg text-lg text-on-surface-variant max-w-2xl mx-auto">
              We've simplified the digital leap. Our tools respect your time, vernacular language, and craft.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-gutter relative">
            {/* Step 1 */}
            <div className="relative z-10 flex flex-col items-center text-center p-6 bg-surface-bright rounded-2xl soft-shadow transition-transform hover:-translate-y-2">
              <div className="w-16 h-16 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center mb-6 text-2xl font-bold font-display-lg shadow-sm">
                <span className="material-symbols-outlined fill text-3xl">photo_camera</span>
              </div>
              <h3 className="font-title-md text-title-md text-on-surface mb-2">1. Take a Photo</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">Snap a picture of your creation right on your workbench.</p>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 flex flex-col items-center text-center p-6 bg-surface-bright rounded-2xl soft-shadow transition-transform hover:-translate-y-2">
              <div className="w-16 h-16 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center mb-6 shadow-sm relative">
                <span className="material-symbols-outlined fill text-3xl">mic</span>
              </div>
              <h3 className="font-title-md text-title-md text-on-surface mb-2">2. Speak</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">Describe the materials, technique, and story using Hindi, Marathi or English.</p>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 flex flex-col items-center text-center p-6 bg-surface-bright rounded-2xl soft-shadow transition-transform hover:-translate-y-2">
              <div className="w-16 h-16 rounded-full bg-indigo-container text-on-secondary-container flex items-center justify-center mb-6 shadow-sm">
                <span className="material-symbols-outlined fill text-3xl">auto_fix_high</span>
              </div>
              <h3 className="font-title-md text-title-md text-on-surface mb-2">3. AI Listing</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">Our AI cleans the image, suggests fair price, and writes a catalog story.</p>
            </div>

            {/* Step 4 */}
            <div className="relative z-10 flex flex-col items-center text-center p-6 bg-surface-bright rounded-2xl soft-shadow transition-transform hover:-translate-y-2">
              <div className="w-16 h-16 rounded-full bg-terracotta-container text-on-primary flex items-center justify-center mb-6 shadow-sm">
                <span className="material-symbols-outlined fill text-3xl">storefront</span>
              </div>
              <h3 className="font-title-md text-title-md text-on-surface mb-2">4. Reach Buyers</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">Publish instantly to the global marketplace and connect with wholesale buyers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Artisan Highlight */}
      <section className="px-margin-mobile md:px-margin-desktop py-16 max-w-7xl mx-auto">
        <div className="bg-surface-container rounded-3xl p-8 sm:p-12 border border-outline-variant/30 flex flex-col lg:flex-row items-center gap-8">
          <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden shrink-0 border-4 border-surface shadow-md">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCy1USh0c8IntFY5avkMXenmevurHwDA1Q4m7vKQnQg7-tsxS3lFEnAJi4vD1f6cxGcUG5FZJ2ns-D3sr92PAMybljwnAn2MxCu5Uaf6YT8S6ka8PxLfy6h-pIAEq24YCUlPrxz2XSsCBMD6s8DL_QogfRv7DwZfiDJkNn0gwsSD3686yq6LYYpopHjuBhLR0kUqwIJXXi5kMSxFKxCs8iAiOolYSlSrjlEiWniaWjilD3i6IJp6Zl3"
              alt="Savita Handicrafts"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 text-center lg:text-left space-y-3">
            <div className="inline-flex items-center gap-2 bg-primary-fixed text-on-primary-fixed text-xs px-3 py-1 rounded-full font-semibold">
              <span className="material-symbols-outlined text-sm">verified</span> Verified Artisan Partner
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-on-surface font-display-lg">Savita Handicrafts</h3>
            <p className="text-on-surface-variant text-sm sm:text-base max-w-2xl">
              "Before DIY-Nest, creating online listings and pricing my handloom silk scarves was overwhelming. Now, I record my voice in Hindi, and within 30 seconds I have a professional catalog ready for buyers."
            </p>
            <div className="pt-2 flex flex-wrap justify-center lg:justify-start gap-4 text-xs font-semibold text-primary">
              <span>📍 Pune, Maharashtra</span>
              <span>🧵 Bamboo & Textile Crafts</span>
              <span>⭐ 4.9 Rating (38 Reviews)</span>
            </div>
          </div>
          <Link
            to="/artisan/store"
            className="px-6 py-3 bg-primary text-on-primary rounded-xl font-semibold hover:bg-surface-tint transition-all shrink-0 active:scale-95 shadow-sm"
          >
            Visit Artisan Store
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
