import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export const MarketplacePage = () => {
  const { products } = useApp();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  const categories = ['All', 'Textiles', 'Bamboo Craft', 'Pottery', 'Handicraft'];

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const matchesSearch =
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.craft.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.material.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.artisanName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-background min-h-screen pb-20">
      {/* Marketplace Header Banner */}
      <section className="bg-surface-container-low border-b border-outline-variant/30 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <span className="text-xs font-bold text-tertiary uppercase tracking-wider bg-tertiary-fixed px-3 py-1 rounded-full">
              Direct Heritage Linkage
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold font-display-lg text-on-surface mt-2">
              Authentic Indian Artisan Marketplace
            </h1>
            <p className="text-sm sm:text-base text-on-surface-variant max-w-xl mt-1">
              Discover unique handcrafted creations direct from rural master weavers, potters, and eco-craft creators.
            </p>
          </div>

          {/* Search bar */}
          <div className="w-full md:w-80 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search silk, pottery, bamboo..."
              className="w-full pl-10 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-2xl outline-none focus:border-primary shadow-sm text-sm"
            />
          </div>
        </div>
      </section>

      {/* Category Filter Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                selectedCategory === cat
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Product Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 space-y-4 bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/30">
            <span className="material-symbols-outlined text-5xl text-outline-variant">search_off</span>
            <h3 className="text-xl font-bold text-on-surface">No products found</h3>
            <p className="text-sm text-on-surface-variant">Try searching for a different craft or clear search filters.</p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-primary text-on-primary rounded-xl font-semibold text-sm"
            >
              Reset Search Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-surface-container-lowest rounded-2xl soft-shadow border border-surface-variant overflow-hidden group hover:-translate-y-1 transition-all duration-300 flex flex-col"
              >
                <div className="h-56 bg-surface-dim relative overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-surface-container-lowest/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-primary shadow-sm">
                    {product.category}
                  </div>
                  <div className="absolute top-3 right-3 bg-tertiary-container text-on-tertiary-container px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">verified</span> Certified Handcrafted
                  </div>
                </div>

                <div className="p-4 flex-grow flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-bold text-on-surface text-base group-hover:text-primary transition-colors line-clamp-1">
                        {product.title}
                      </h3>
                      <span className="text-lg font-bold text-primary font-display-lg">₹{product.price}</span>
                    </div>

                    <p className="text-xs text-on-surface-variant font-medium mt-1">
                      by <span className="font-semibold text-on-surface">{product.artisanName}</span> • {product.artisanLocation}
                    </p>

                    <p className="text-xs text-on-surface-variant line-clamp-2 mt-2 leading-relaxed">
                      {product.descriptionEnglish}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-outline-variant/30 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg">
                      <span>★</span> {product.rating || 4.9}
                    </div>

                    <Link
                      to={`/marketplace/product/${product.id}`}
                      className="px-3.5 py-1.5 bg-surface-container hover:bg-primary hover:text-on-primary text-on-surface font-semibold text-xs rounded-xl transition-colors flex items-center gap-1"
                    >
                      <span>View Details</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default MarketplacePage;
