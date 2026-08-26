import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export const BuyerHome = () => {
  const { products, inquiries } = useApp();

  return (
    <div className="bg-background min-h-screen pb-24 pt-6 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
      {/* Buyer Welcome Banner */}
      <div className="bg-gradient-to-r from-tertiary-container via-tertiary to-secondary text-on-tertiary-container p-8 rounded-3xl soft-shadow space-y-3">
        <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full">
          Wholesale & Retail Buyer Portal
        </span>
        <h1 className="text-3xl font-bold font-display-lg">Welcome to DIY-Nest Marketplace</h1>
        <p className="text-sm opacity-90 max-w-xl">
          Source authentic handcrafted textiles, bamboo decor, and terracotta crafts directly from rural Indian artisan clusters with guaranteed fair prices.
        </p>
        <div className="pt-2 flex gap-3">
          <Link
            to="/marketplace"
            className="px-5 py-2.5 bg-white text-tertiary font-bold text-xs rounded-xl shadow-sm hover:bg-slate-50 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </div>

      {/* Active Inquiries */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-on-surface font-title-md">My Inquiries to Artisans</h2>
          <span className="text-xs text-on-surface-variant">{inquiries.length} Active Requests</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {inquiries.map((inq) => (
            <div key={inq.id} className="bg-surface-container-lowest p-4 rounded-2xl border soft-shadow flex items-center gap-3">
              <img src={inq.productImage} alt={inq.productTitle} className="w-14 h-14 rounded-xl object-cover" />
              <div className="flex-1 space-y-1">
                <h4 className="font-bold text-sm text-on-surface line-clamp-1">{inq.productTitle}</h4>
                <p className="text-xs text-on-surface-variant">Qty: {inq.quantity} units</p>
                <Link to={`/artisan/inquiries/${inq.id}`} className="text-xs text-tertiary font-bold hover:underline block">
                  View Chat →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Products */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-on-surface font-title-md">Trending Artisan Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {products.slice(0, 3).map((product) => (
            <div key={product.id} className="bg-surface-container-lowest rounded-2xl border overflow-hidden soft-shadow">
              <img src={product.image} alt={product.title} className="w-full h-44 object-cover" />
              <div className="p-4 space-y-2">
                <h3 className="font-bold text-on-surface text-base">{product.title}</h3>
                <p className="text-xs text-on-surface-variant">by {product.artisanName}</p>
                <div className="flex justify-between items-center pt-2">
                  <span className="font-bold text-primary">₹{product.price}</span>
                  <Link
                    to={`/marketplace/product/${product.id}`}
                    className="px-3 py-1.5 bg-primary text-on-primary text-xs font-semibold rounded-xl"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BuyerHome;
