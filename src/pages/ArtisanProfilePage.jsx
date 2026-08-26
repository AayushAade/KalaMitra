import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const ArtisanProfilePage = () => {
  const { user, loginUser, language, setLanguage } = useApp();

  const [formData, setFormData] = useState({
    name: user?.name || "Savita Handicrafts",
    ownerName: user?.ownerName || "Savita Devi",
    phone: user?.phone || "+91 98765 43210",
    email: user?.email || "savita@diynest.org",
    location: user?.location || "Pune, Maharashtra",
    craft: user?.craft || "Traditional Bamboo & Textile Crafts",
    bio: user?.bio || "Master artisan dedicated to preserving ancestral handloom weaving and eco-friendly bamboo craft traditions."
  });

  const [saved, setSaved] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    loginUser({ ...user, ...formData });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="bg-background min-h-screen pb-24 pt-6 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto space-y-6">
      <div className="bg-surface-container-lowest p-6 rounded-3xl soft-shadow border border-outline-variant/30 text-center">
        <img
          src={user?.avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuCy1USh0c8IntFY5avkMXenmevurHwDA1Q4m7vKQnQg7-tsxS3lFEnAJi4vD1f6cxGcUG5FZJ2ns-D3sr92PAMybljwnAn2MxCu5Uaf6YT8S6ka8PxLfy6h-pIAEq24YCUlPrxz2XSsCBMD6s8DL_QogfRv7DwZfiDJkNn0gwsSD3686yq6LYYpopHjuBhLR0kUqwIJXXi5kMSxFKxCs8iAiOolYSlSrjlEiWniaWjilD3i6IJp6Zl3"}
          alt={formData.name}
          className="w-24 h-24 rounded-full object-cover border-4 border-primary mx-auto mb-3 shadow-md"
        />
        <h1 className="text-2xl font-bold text-on-surface font-display-lg">{formData.name}</h1>
        <p className="text-xs text-on-surface-variant">Store Settings & Artisan Profile</p>
      </div>

      {saved && (
        <div className="bg-green-100 text-green-800 p-3 rounded-xl text-xs font-semibold text-center">
          ✓ Profile settings updated successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-surface-container-lowest p-6 rounded-3xl soft-shadow border border-surface-variant space-y-4">
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1">
            Store Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2.5 bg-surface-container-low border rounded-xl text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1">
              Artisan Name
            </label>
            <input
              type="text"
              value={formData.ownerName}
              onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
              className="w-full px-4 py-2.5 bg-surface-container-low border rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1">
              Mobile Number
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2.5 bg-surface-container-low border rounded-xl text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2.5 bg-surface-container-low border rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1">
              Primary Craft
            </label>
            <input
              type="text"
              value={formData.craft}
              onChange={(e) => setFormData({ ...formData, craft: e.target.value })}
              className="w-full px-4 py-2.5 bg-surface-container-low border rounded-xl text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1">
            Artisan Biography
          </label>
          <textarea
            rows={3}
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            className="w-full px-4 py-2.5 bg-surface-container-low border rounded-xl text-sm resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1">
            App Language
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-4 py-2.5 bg-surface-container-low border rounded-xl text-sm"
          >
            <option value="English">English</option>
            <option value="Hindi">हिंदी (Hindi)</option>
            <option value="Marathi">मराठी (Marathi)</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-primary text-on-primary font-semibold text-sm rounded-xl hover:bg-surface-tint active:scale-95 transition-all shadow-md mt-2"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default ArtisanProfilePage;
