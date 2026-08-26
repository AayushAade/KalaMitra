import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export const MyProductsPage = () => {
  const { products, deleteProduct, updateProduct } = useApp();
  const [filter, setFilter] = useState('All'); // All, Published, Draft

  const [editingProduct, setEditingProduct] = useState(null);
  const [newPrice, setNewPrice] = useState('');

  const filteredProducts = products.filter((p) => {
    if (filter === 'All') return true;
    return p.status === filter;
  });

  const handleUpdatePrice = (e) => {
    e.preventDefault();
    if (editingProduct && newPrice) {
      updateProduct(editingProduct.id, { price: Number(newPrice) });
      setEditingProduct(null);
      setNewPrice('');
    }
  };

  return (
    <div className="bg-background min-h-screen pb-24 pt-6 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-lowest p-6 rounded-3xl soft-shadow border border-outline-variant/30">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display-lg text-on-surface">My Product Inventory</h1>
          <p className="text-sm text-on-surface-variant">Manage, edit prices, and view active marketplace listings.</p>
        </div>

        <Link
          to="/artisan/products/new"
          className="px-5 py-3 bg-primary text-on-primary font-semibold text-sm rounded-2xl hover:bg-surface-tint active:scale-95 transition-all shadow-md flex items-center gap-2"
        >
          <span className="material-symbols-outlined">add_circle</span>
          <span>+ Add Product</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-outline-variant/30 pb-3">
        {['All', 'Published', 'Draft'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              filter === tab
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
            }`}
          >
            {tab} Products ({tab === 'All' ? products.length : products.filter((p) => p.status === tab).length})
          </button>
        ))}
      </div>

      {/* Product List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="bg-surface-container-lowest rounded-2xl soft-shadow border border-outline-variant/30 overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="h-48 bg-surface-dim relative">
                <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3 bg-surface-container-lowest/90 px-3 py-1 rounded-full text-xs font-bold text-primary">
                  {product.category}
                </div>
                <div
                  className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold ${
                    product.status === 'Draft'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {product.status || 'Published'}
                </div>
              </div>

              <div className="p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-on-surface text-base line-clamp-1">{product.title}</h3>
                  <span className="font-bold text-primary text-lg">₹{product.price}</span>
                </div>
                <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                  {product.descriptionEnglish}
                </p>

                <div className="pt-2 text-xs space-y-1 text-on-surface-variant">
                  <p><strong>Stock Quantity:</strong> {product.quantity} units</p>
                  <p><strong>Craft:</strong> {product.craft}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 pt-0 border-t border-outline-variant/20 mt-2 flex gap-2">
              <Link
                to={`/marketplace/product/${product.id}`}
                className="flex-1 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold rounded-xl transition-colors text-center"
              >
                View Live
              </Link>
              <button
                onClick={() => {
                  setEditingProduct(product);
                  setNewPrice(product.price);
                }}
                className="px-3 py-2 bg-tertiary-container text-on-tertiary-container text-xs font-semibold rounded-xl hover:opacity-90 transition-opacity"
              >
                Update Price
              </button>
              <button
                onClick={() => deleteProduct(product.id)}
                className="px-3 py-2 bg-error-container text-on-error-container text-xs font-semibold rounded-xl hover:opacity-90 transition-opacity"
                title="Delete Product"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Price Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-bright rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border">
            <h3 className="text-lg font-bold text-on-surface">Update Price for {editingProduct.title}</h3>
            <form onSubmit={handleUpdatePrice} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">New Price (₹)</label>
                <input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-container-low border rounded-xl font-bold text-lg"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 py-2 border rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-primary text-on-primary rounded-xl text-xs font-semibold"
                >
                  Save New Price
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProductsPage;
