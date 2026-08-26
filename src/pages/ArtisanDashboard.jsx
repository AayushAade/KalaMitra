import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export const ArtisanDashboard = () => {
  const { user, products, inquiries } = useApp();

  const artisanName = user?.name || "Savita Handicrafts";
  const avatar = user?.avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuCy1USh0c8IntFY5avkMXenmevurHwDA1Q4m7vKQnQg7-tsxS3lFEnAJi4vD1f6cxGcUG5FZJ2ns-D3sr92PAMybljwnAn2MxCu5Uaf6YT8S6ka8PxLfy6h-pIAEq24YCUlPrxz2XSsCBMD6s8DL_QogfRv7DwZfiDJkNn0gwsSD3686yq6LYYpopHjuBhLR0kUqwIJXXi5kMSxFKxCs8iAiOolYSlSrjlEiWniaWjilD3i6IJp6Zl3";

  const newInquiriesCount = inquiries.filter((inq) => inq.status === "New").length;

  return (
    <div className="bg-background min-h-screen pb-24 px-margin-mobile md:px-8 max-w-4xl mx-auto space-y-stack-lg mt-stack-md pt-4">
      {/* Top Welcome Header */}
      <div className="flex items-center justify-between bg-surface-container-lowest p-4 sm:p-6 rounded-2xl border border-outline-variant/30 soft-shadow">
        <div className="flex items-center gap-4">
          <img src={avatar} alt={artisanName} className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-primary" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-on-surface font-title-md">{artisanName}</h1>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Active</span>
            </div>
            <p className="text-xs sm:text-sm text-on-surface-variant">Welcome back! Manage your crafts and buyer requests.</p>
          </div>
        </div>

        <Link
          to="/artisan/profile"
          className="hidden sm:flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          <span>Store Settings</span>
          <span className="material-symbols-outlined text-sm">settings</span>
        </Link>
      </div>

      {/* Main Action: Add New Product Tile */}
      <section>
        <Link
          to="/artisan/products/new"
          className="w-full bg-surface-container-lowest rounded-2xl soft-shadow p-stack-md flex flex-col items-center justify-center text-center gap-stack-sm min-h-[200px] border-2 border-dashed border-primary/40 hover:bg-surface-bright transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.98] group"
        >
          <div className="flex items-center gap-4 text-tertiary">
            <span className="material-symbols-outlined text-[48px] group-hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>
              photo_camera
            </span>
            <span className="text-2xl font-bold text-surface-dim">+</span>
            <span className="material-symbols-outlined text-[48px] tertiary-glow rounded-full p-2 group-hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>
              mic
            </span>
          </div>
          <h2 className="text-title-md font-title-md font-bold text-primary mt-2">Add New Product</h2>
          <p className="text-body-md font-body-md text-on-surface-variant">Click a photo and speak in your language to list your product.</p>
        </Link>
      </section>

      {/* AI Business Assistant Banner */}
      <section>
        <div className="bg-secondary-container rounded-2xl p-stack-md flex flex-col gap-4 border border-secondary-fixed-dim">
          <div className="flex items-center justify-between text-on-secondary-container">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary">auto_awesome</span>
              <h3 className="text-title-md font-title-md font-semibold">AI Business Assistant Suggestions</h3>
            </div>
            <Link to="/artisan/assistant" className="text-xs font-bold text-tertiary hover:underline">
              View All Tips
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-surface-container-lowest p-4 rounded-xl flex items-start gap-4 soft-shadow">
              <span className="material-symbols-outlined text-primary mt-0.5 text-3xl">mark_email_unread</span>
              <div>
                <p className="text-label-lg font-label-lg font-bold text-on-surface text-base">
                  {newInquiriesCount > 0 ? `${newInquiriesCount} new bulk buyer inquiry` : "1 new bulk inquiry"}
                </p>
                <p className="text-xs text-on-surface-variant mt-1">Raj Traders requested 100 Bamboo Baskets.</p>
                <Link to="/artisan/inquiries" className="mt-2 inline-block text-primary font-semibold text-xs hover:underline">
                  View Inquiries →
                </Link>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-xl flex items-start gap-4 soft-shadow">
              <span className="material-symbols-outlined text-tertiary mt-0.5 text-3xl">tips_and_updates</span>
              <div>
                <p className="text-label-lg font-label-lg font-bold text-on-surface text-base">Pricing Recommendation</p>
                <p className="text-xs text-on-surface-variant mt-1">Your Bamboo basket price (₹899) is highly competitive.</p>
                <Link to="/artisan/pricing" className="mt-2 inline-block text-tertiary font-semibold text-xs hover:underline">
                  Check Pricing Intelligence →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Artisan Tools Navigation Strip */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          to="/artisan/products"
          className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 text-center hover:bg-surface-container transition-colors space-y-1"
        >
          <span className="material-symbols-outlined text-3xl text-primary">inventory_2</span>
          <p className="text-xs font-bold text-on-surface">My Products</p>
        </Link>
        <Link
          to="/artisan/catalog"
          className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 text-center hover:bg-surface-container transition-colors space-y-1"
        >
          <span className="material-symbols-outlined text-3xl text-tertiary">auto_stories</span>
          <p className="text-xs font-bold text-on-surface">AI Catalog</p>
        </Link>
        <Link
          to="/artisan/pricing"
          className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 text-center hover:bg-surface-container transition-colors space-y-1"
        >
          <span className="material-symbols-outlined text-3xl text-secondary">payments</span>
          <p className="text-xs font-bold text-on-surface">Pricing Assistant</p>
        </Link>
        <Link
          to="/artisan/store"
          className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 text-center hover:bg-surface-container transition-colors space-y-1"
        >
          <span className="material-symbols-outlined text-3xl text-primary">storefront</span>
          <p className="text-xs font-bold text-on-surface">Digital Store</p>
        </Link>
      </section>

      {/* Active Products Section */}
      <section className="space-y-stack-sm">
        <div className="flex justify-between items-end">
          <h3 className="text-title-md font-title-md font-bold text-on-surface">My Products</h3>
          <Link className="text-label-lg font-label-lg text-primary hover:underline text-xs" to="/artisan/products">
            View All ({products.length})
          </Link>
        </div>

        <div className="flex gap-gutter overflow-x-auto pb-4 snap-x snap-mandatory hide-scrollbar -mx-margin-mobile px-margin-mobile md:mx-0 md:px-0">
          {products.slice(0, 4).map((product) => (
            <div
              key={product.id}
              className="flex-none w-64 bg-surface-container-lowest rounded-xl soft-shadow overflow-hidden snap-start flex flex-col border border-outline-variant/30"
            >
              <div className="h-40 bg-surface-variant relative">
                <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 bg-surface-container-lowest/80 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-xs font-semibold text-on-surface">Active</span>
                </div>
              </div>
              <div className="p-stack-sm flex-grow flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-body-md font-semibold text-on-surface line-clamp-1">{product.title}</h4>
                    <span className="text-label-lg font-bold text-primary">₹{product.price}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant">{product.craft}</p>
                </div>
                <div className="mt-4 flex gap-2">
                  <Link
                    to={`/marketplace/product/${product.id}`}
                    className="flex-1 bg-surface-container hover:bg-surface-container-highest text-on-surface-variant text-xs font-semibold py-2 rounded-lg transition-colors flex items-center justify-center min-h-[40px]"
                  >
                    Details
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {/* Add More Card */}
          <Link
            to="/artisan/products/new"
            className="flex-none w-32 bg-surface-container-low rounded-xl border-2 border-dashed border-outline-variant flex flex-col items-center justify-center snap-start cursor-pointer hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-primary mb-2 text-3xl">add</span>
            <span className="text-xs font-bold text-primary text-center">Add<br />More</span>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default ArtisanDashboard;
