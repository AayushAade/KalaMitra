import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export const ArtisanCatalogPage = () => {
  const { currentProduct, products } = useApp();

  const activeCatalog = currentProduct.title ? currentProduct : products[0];

  return (
    <div className="bg-background min-h-screen pb-24 pt-6 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-surface-container-lowest p-6 rounded-3xl soft-shadow border border-outline-variant/30 flex justify-between items-center">
        <div>
          <span className="text-xs font-bold text-tertiary uppercase bg-tertiary-fixed px-3 py-1 rounded-full">
            Vernacular AI Engine
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-display-lg text-on-surface mt-2">
            Multilingual AI Catalog
          </h1>
          <p className="text-sm text-on-surface-variant">Auto-translated catalog copy in English, Hindi & Marathi.</p>
        </div>
        <Link
          to="/artisan/products/new"
          className="px-4 py-2 bg-primary text-on-primary font-semibold text-xs rounded-xl"
        >
          + Add Product
        </Link>
      </div>

      {/* Catalog Display Card */}
      <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl soft-shadow border border-surface-variant space-y-6">
        <div className="flex flex-col sm:flex-row gap-6 items-center">
          <img
            src={activeCatalog.image}
            alt={activeCatalog.title}
            className="w-40 h-40 rounded-2xl object-cover border"
          />
          <div className="space-y-2 text-center sm:text-left flex-1">
            <h2 className="text-2xl font-bold text-on-surface">{activeCatalog.title}</h2>
            <p className="text-base text-primary font-bold">{activeCatalog.titleHindi || activeCatalog.title}</p>
            <p className="text-xs text-on-surface-variant">
              Category: <strong>{activeCatalog.category}</strong> • Craft: <strong>{activeCatalog.craft}</strong>
            </p>
          </div>
        </div>

        {/* Multilingual Blocks */}
        <div className="space-y-4 pt-4 border-t">
          <div className="bg-surface-container-low p-4 rounded-2xl border space-y-1">
            <span className="text-xs font-bold text-tertiary uppercase">English Global Catalog</span>
            <p className="text-sm text-on-surface leading-relaxed">
              {activeCatalog.descriptionEnglish}
            </p>
          </div>

          <div className="bg-surface-container-low p-4 rounded-2xl border space-y-1">
            <span className="text-xs font-bold text-primary uppercase">Hindi Vernacular Catalog (हिंदी विवरण)</span>
            <p className="text-sm text-on-surface font-medium leading-relaxed">
              {activeCatalog.descriptionHindi || "महाराष्ट्र के कुशल कारीगरों द्वारा हस्तनिर्मित यह वस्त्र आपकी कलात्मक पसंद को दर्शाता है।"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtisanCatalogPage;
