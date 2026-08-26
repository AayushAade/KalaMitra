import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export const Navbar = () => {
  const { user, logoutUser, language, setLanguage } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/marketplace?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const isArtisanView = location.pathname.startsWith('/artisan');

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-surface dark:bg-inverse-surface shadow-[0_4px_20px_rgba(118,45,25,0.08)] border-b border-surface-variant/40 transition-colors">
      <div className="flex justify-between items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20">
        
        {/* Brand Identity */}
        <div className="flex items-center gap-3">
          <button
            className="md:hidden p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
          
          <Link to="/" className="flex items-center gap-2">
            <span className="font-display-lg text-2xl sm:text-3xl font-bold text-primary dark:text-inverse-primary tracking-tight">
              DIY-Nest
            </span>
          </Link>

          {isArtisanView && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-on-surface-variant bg-surface-container px-3 py-1.5 rounded-full border border-outline-variant/30">
              <span className="material-symbols-outlined text-[16px] text-green-600">cloud_done</span>
              <span className="font-medium">Synced</span>
            </div>
          )}
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            to="/marketplace"
            className={`font-body-md text-sm sm:text-base font-medium transition-colors hover:text-primary ${
              location.pathname === '/marketplace' ? 'text-primary font-semibold' : 'text-on-surface-variant'
            }`}
          >
            Marketplace
          </Link>
          <Link
            to="/how-it-works"
            className={`font-body-md text-sm sm:text-base font-medium transition-colors hover:text-primary ${
              location.pathname === '/how-it-works' ? 'text-primary font-semibold' : 'text-on-surface-variant'
            }`}
          >
            How It Works
          </Link>

          {user ? (
            <>
              <Link
                to="/artisan/home"
                className={`font-body-md text-sm sm:text-base font-medium transition-colors hover:text-primary ${
                  location.pathname === '/artisan/home' ? 'text-primary font-semibold' : 'text-on-surface-variant'
                }`}
              >
                Artisan Dashboard
              </Link>
              <Link
                to="/artisan/store"
                className={`font-body-md text-sm sm:text-base font-medium transition-colors hover:text-primary ${
                  location.pathname === '/artisan/store' ? 'text-primary font-semibold' : 'text-on-surface-variant'
                }`}
              >
                My Store
              </Link>
            </>
          ) : (
            <Link
              to="/register"
              className="font-body-md text-sm sm:text-base font-medium text-on-surface-variant hover:text-primary transition-colors"
            >
              Become an Artisan
            </Link>
          )}
        </nav>

        {/* Search Bar & Actions */}
        <div className="flex items-center gap-3">
          <form onSubmit={handleSearch} className="relative hidden lg:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search crafts..."
              className="pl-9 pr-4 py-1.5 bg-surface-container rounded-full border border-transparent focus:border-secondary focus:ring-1 focus:ring-secondary outline-none text-xs sm:text-sm w-44 lg:w-56 transition-all"
            />
          </form>

          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="hidden sm:block text-xs bg-surface-container border border-outline-variant/40 rounded-lg px-2 py-1.5 text-on-surface font-medium outline-none cursor-pointer"
          >
            <option value="English">English</option>
            <option value="Hindi">हिंदी (Hindi)</option>
            <option value="Marathi">मराठी (Marathi)</option>
          </select>

          {user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/artisan/profile"
                className="flex items-center gap-2 p-1 hover:bg-surface-container rounded-full transition-colors"
                title="Artisan Profile"
              >
                <img
                  src={user.avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuCy1USh0c8IntFY5avkMXenmevurHwDA1Q4m7vKQnQg7-tsxS3lFEnAJi4vD1f6cxGcUG5FZJ2ns-D3sr92PAMybljwnAn2MxCu5Uaf6YT8S6ka8PxLfy6h-pIAEq24YCUlPrxz2XSsCBMD6s8DL_QogfRv7DwZfiDJkNn0gwsSD3686yq6LYYpopHjuBhLR0kUqwIJXXi5kMSxFKxCs8iAiOolYSlSrjlEiWniaWjilD3i6IJp6Zl3"}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover border border-outline-variant shadow-sm"
                />
              </Link>
              <button
                onClick={() => {
                  logoutUser();
                  navigate('/');
                }}
                className="hidden md:flex items-center justify-center p-2 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-full transition-colors"
                title="Logout"
              >
                <span className="material-symbols-outlined text-lg">logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3 sm:px-4 py-2 rounded-xl text-primary hover:bg-surface-container-low transition-colors font-label-lg text-xs sm:text-sm font-semibold active:scale-95"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-4 sm:px-5 py-2 rounded-xl bg-primary text-on-primary font-label-lg text-xs sm:text-sm font-semibold hover:bg-surface-tint active:scale-95 transition-all shadow-sm flex items-center gap-1"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Slide-out Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-surface-bright border-b border-surface-variant px-4 py-4 space-y-3 animate-fadeIn">
          <form onSubmit={handleSearch} className="relative mb-3">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search crafts..."
              className="w-full pl-9 pr-4 py-2 bg-surface-container rounded-full border border-transparent focus:border-secondary outline-none text-sm"
            />
          </form>

          <Link
            to="/marketplace"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-on-surface hover:bg-surface-container font-medium"
          >
            Marketplace
          </Link>
          <Link
            to="/how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-on-surface hover:bg-surface-container font-medium"
          >
            How It Works
          </Link>
          
          {user ? (
            <>
              <Link
                to="/artisan/home"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-on-surface hover:bg-surface-container font-medium"
              >
                Artisan Dashboard
              </Link>
              <Link
                to="/artisan/products"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-on-surface hover:bg-surface-container font-medium"
              >
                My Products
              </Link>
              <Link
                to="/artisan/products/new"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-primary hover:bg-surface-container font-semibold"
              >
                + Add Product
              </Link>
              <Link
                to="/artisan/inquiries"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-on-surface hover:bg-surface-container font-medium"
              >
                Buyer Inquiries
              </Link>
              <Link
                to="/artisan/store"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-on-surface hover:bg-surface-container font-medium"
              >
                My Digital Store
              </Link>
              <button
                onClick={() => {
                  logoutUser();
                  setMobileMenuOpen(false);
                  navigate('/');
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-error hover:bg-error-container/20 font-medium"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="pt-2 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center py-2 rounded-xl border border-outline-variant text-primary font-semibold"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center py-2 rounded-xl bg-primary text-on-primary font-semibold"
              >
                Register as Artisan
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
