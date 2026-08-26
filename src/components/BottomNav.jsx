import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export const BottomNav = () => {
  const { user } = useApp();
  const location = useLocation();

  // Only show bottom navigation on mobile/tablet for artisan routes or logged in users
  if (!user && !location.pathname.startsWith('/artisan')) {
    return null;
  }

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 w-full z-40 flex justify-around items-center px-4 py-2 bg-surface-container-low dark:bg-inverse-surface shadow-[0_-4px_20px_rgba(0,0,0,0.08)] rounded-t-2xl md:hidden border-t border-outline-variant/30">
      {/* Home */}
      <Link
        to="/artisan/home"
        className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl transition-all min-w-[56px] ${
          isActive('/artisan/home')
            ? 'bg-primary-fixed dark:bg-primary-container text-primary font-bold scale-95 shadow-sm'
            : 'text-on-surface-variant hover:bg-surface-container-high'
        }`}
      >
        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: isActive('/artisan/home') ? "'FILL' 1" : "'FILL' 0" }}>
          home
        </span>
        <span className="text-[11px] font-medium mt-0.5">Home</span>
      </Link>

      {/* Add Product */}
      <Link
        to="/artisan/products/new"
        className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl transition-all min-w-[56px] ${
          isActive('/artisan/products/new')
            ? 'bg-primary-fixed dark:bg-primary-container text-primary font-bold scale-95 shadow-sm'
            : 'text-on-surface-variant hover:bg-surface-container-high'
        }`}
      >
        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: isActive('/artisan/products/new') ? "'FILL' 1" : "'FILL' 0" }}>
          add_circle
        </span>
        <span className="text-[11px] font-medium mt-0.5">Add</span>
      </Link>

      {/* Products */}
      <Link
        to="/artisan/products"
        className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl transition-all min-w-[56px] ${
          isActive('/artisan/products')
            ? 'bg-primary-fixed dark:bg-primary-container text-primary font-bold scale-95 shadow-sm'
            : 'text-on-surface-variant hover:bg-surface-container-high'
        }`}
      >
        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: isActive('/artisan/products') ? "'FILL' 1" : "'FILL' 0" }}>
          inventory_2
        </span>
        <span className="text-[11px] font-medium mt-0.5">Products</span>
      </Link>

      {/* Inquiries */}
      <Link
        to="/artisan/inquiries"
        className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl transition-all min-w-[56px] ${
          isActive('/artisan/inquiries')
            ? 'bg-primary-fixed dark:bg-primary-container text-primary font-bold scale-95 shadow-sm'
            : 'text-on-surface-variant hover:bg-surface-container-high'
        }`}
      >
        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: isActive('/artisan/inquiries') ? "'FILL' 1" : "'FILL' 0" }}>
          chat
        </span>
        <span className="text-[11px] font-medium mt-0.5">Inquiries</span>
      </Link>

      {/* Store */}
      <Link
        to="/artisan/store"
        className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl transition-all min-w-[56px] ${
          isActive('/artisan/store')
            ? 'bg-primary-fixed dark:bg-primary-container text-primary font-bold scale-95 shadow-sm'
            : 'text-on-surface-variant hover:bg-surface-container-high'
        }`}
      >
        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: isActive('/artisan/store') ? "'FILL' 1" : "'FILL' 0" }}>
          storefront
        </span>
        <span className="text-[11px] font-medium mt-0.5">Store</span>
      </Link>
    </nav>
  );
};

export default BottomNav;
