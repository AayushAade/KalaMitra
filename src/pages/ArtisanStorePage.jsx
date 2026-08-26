import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export const ArtisanStorePage = () => {
  const { user, products } = useApp();

  const artisanName = user?.name || "Savita Handicrafts";
  const ownerName = user?.ownerName || "Savita Devi";
  const location = user?.location || "Pune, Maharashtra";
  const craft = user?.craft || "Traditional Bamboo & Textile Crafts";
  const bio = user?.bio || "Master artisan dedicated to preserving ancestral handloom weaving and eco-friendly bamboo craft traditions.";
  const avatar = user?.avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuCy1USh0c8IntFY5avkMXenmevurHwDA1Q4m7vKQnQg7-tsxS3lFEnAJi4vD1f6cxGcUG5FZJ2ns-D3sr92PAMybljwnAn2MxCu5Uaf6YT8S6ka8PxLfy6h-pIAEq24YCUlPrxz2XSsCBMD6s8DL_QogfRv7DwZfiDJkNn0gwsSD3686yq6LYYpopHjuBhLR0kUqwIJXXi5kMSxFKxCs8iAiOolYSlSrjlEiWniaWjilD3i6IJp6Zl3";

  const publishedProducts = products.filter((p) => p.status === "Published" || !p.status);

  return (
    <div className="bg-background min-h-screen pb-20">
      {/* Store Banner Header */}
      <section className="bg-gradient-to-r from-primary-container via-primary to-surface-tint text-on-primary py-12 px-4 sm:px-6 lg:px-8 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <img
            src={avatar}
            alt={artisanName}
            className="w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover border-4 border-surface shadow-xl"
          />
          <div className="space-y-2 flex-1">
            <div className="inline-flex items-center gap-1.5 bg-surface-container-lowest/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-on-primary">
              <span className="material-symbols-outlined text-sm text-yellow-300">verified</span> Certified Digital Artisan Store
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold font-display-lg">{artisanName}</h1>
            <p className="text-sm sm:text-base font-medium opacity-90">
              by {ownerName} • 📍 {location}
            </p>
            <p className="text-xs sm:text-sm max-w-2xl opacity-80 leading-relaxed">
              {bio}
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2 text-xs font-bold">
              <span className="bg-white/20 px-3 py-1 rounded-full">🧵 {craft}</span>
              <span className="bg-white/20 px-3 py-1 rounded-full">⭐ 4.9 Rating (38 Reviews)</span>
              <span className="bg-white/20 px-3 py-1 rounded-full">📦 {publishedProducts.length} Active Products</span>
            </div>
          </div>
          <Link
            to="/artisan/products/new"
            className="px-5 py-3 bg-surface text-primary font-semibold text-sm rounded-2xl hover:bg-surface-bright active:scale-95 transition-all shadow-md shrink-0 flex items-center gap-2"
          >
            <span className="material-symbols-outlined">add_circle</span>
            <span>+ Add New Product</span>
          </Link>
        </div>
      </section>

      {/* Product Catalog Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-on-surface font-title-md">Store Catalog</h2>
          <span className="text-xs font-semibold text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
            Showing {publishedProducts.length} Artisan Creations
          </span>
        </div>

        {publishedProducts.length === 0 ? (
          <div className="text-center py-16 space-y-4 bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/30">
            <span className="material-symbols-outlined text-5xl text-outline-variant">storefront</span>
            <h3 className="text-xl font-bold text-on-surface">No published products yet</h3>
            <p className="text-sm text-on-surface-variant">Click below to take a photo and use AI to create your first listing!</p>
            <Link
              to="/artisan/products/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary font-semibold rounded-xl text-sm"
            >
              <span className="material-symbols-outlined">photo_camera</span>
              <span>Add First Product</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {publishedProducts.map((product) => (
              <div
                key={product.id}
                className="bg-surface-container-lowest rounded-2xl soft-shadow border border-surface-variant overflow-hidden group flex flex-col justify-between"
              >
                <div>
                  <div className="h-52 bg-surface-dim relative overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-surface-container-lowest/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-primary">
                      {product.category}
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-on-surface text-base line-clamp-1">{product.title}</h3>
                      <span className="font-bold text-primary text-base">₹{product.price}</span>
                    </div>

                    <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                      {product.descriptionEnglish}
                    </p>

                    <div className="pt-2 flex flex-wrap gap-1 text-[10px] font-semibold text-secondary">
                      <span className="bg-secondary-container/50 px-2 py-0.5 rounded">🧵 {product.craft}</span>
                      <span className="bg-secondary-container/50 px-2 py-0.5 rounded">⏳ {product.productionTime}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0 border-t border-outline-variant/20 mt-3">
                  <Link
                    to={`/marketplace/product/${product.id}`}
                    className="w-full py-2 bg-surface-container hover:bg-primary hover:text-on-primary text-on-surface text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1"
                  >
                    <span>View Product Details</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ArtisanStorePage;
