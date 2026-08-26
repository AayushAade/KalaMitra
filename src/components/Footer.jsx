import React from 'react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="bg-inverse-surface text-inverse-on-surface pt-12 pb-24 md:pb-12 border-t border-outline-variant/20 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-2xl font-bold font-display-lg text-inverse-primary mb-3">DIY-Nest</h3>
            <p className="text-sm text-surface-variant max-w-xs leading-relaxed">
              AI-driven market linkage and smart cataloging platform for India's marginalized artisans. Bridging heritage craft with digital global markets.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider text-surface-bright mb-3">Quick Navigation</h4>
            <ul className="space-y-2 text-sm text-surface-variant">
              <li><Link to="/" className="hover:text-inverse-primary transition-colors">Landing Page</Link></li>
              <li><Link to="/marketplace" className="hover:text-inverse-primary transition-colors">Artisan Marketplace</Link></li>
              <li><Link to="/how-it-works" className="hover:text-inverse-primary transition-colors">How It Works</Link></li>
              <li><Link to="/register" className="hover:text-inverse-primary transition-colors">Become an Artisan</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider text-surface-bright mb-3">Artisan Features</h4>
            <ul className="space-y-2 text-sm text-surface-variant">
              <li><Link to="/artisan/home" className="hover:text-inverse-primary transition-colors">Artisan Dashboard</Link></li>
              <li><Link to="/artisan/products/new" className="hover:text-inverse-primary transition-colors">AI Photo & Voice Listing</Link></li>
              <li><Link to="/artisan/catalog" className="hover:text-inverse-primary transition-colors">Vernacular AI Catalog</Link></li>
              <li><Link to="/artisan/pricing" className="hover:text-inverse-primary transition-colors">AI Pricing Recommendation</Link></li>
              <li><Link to="/artisan/assistant" className="hover:text-inverse-primary transition-colors">AI Business Assistant</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider text-surface-bright mb-3">SIH 2026 Innovation</h4>
            <p className="text-xs text-surface-variant leading-relaxed mb-3">
              Designed for Smart India Hackathon 2026. Empowering rural micro-entrepreneurs with offline-first voice cataloging and fair price intelligence.
            </p>
            <div className="flex items-center gap-2 text-xs text-inverse-primary font-medium">
              <span className="material-symbols-outlined text-base">verified</span>
              <span>Certified SIH Prototype</span>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-surface-variant/20 flex flex-col sm:flex-row justify-between items-center text-xs text-surface-variant gap-4">
          <p>© 2026 DIY-Nest. Handcrafted Heritage Digitalized for Marginalized Artisans.</p>
          <div className="flex gap-4">
            <span>Hindi • Marathi • English Supported</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
