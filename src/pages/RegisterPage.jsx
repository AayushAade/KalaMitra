import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import authService from '../services/authService';

export const RegisterPage = () => {
  const { loginUser, language, setLanguage } = useApp();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: 'Savita Handicrafts',
    ownerName: 'Savita Devi',
    phone: '+91 98765 43210',
    craft: 'Bamboo & Textile Crafts',
    location: 'Pune, Maharashtra',
    language: language || 'Hindi'
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authService.register(formData);
      loginUser(response.user);
      navigate('/artisan/home');
    } catch {
      // fallback
      loginUser({ ...formData, id: `artisan-${Date.now()}`, role: 'artisan' });
      navigate('/artisan/home');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-6 bg-surface-container-lowest p-8 rounded-3xl soft-shadow border border-outline-variant/30">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block text-3xl font-bold text-primary font-display-lg">
            DIY-Nest
          </Link>
          <h2 className="text-2xl font-bold text-on-surface">Start Your Digital Artisan Store</h2>
          <p className="text-sm text-on-surface-variant">Join thousands of Indian artisans digitizing their craft</p>
        </div>

        {/* Language Quick Selection */}
        <div className="bg-surface-container-low p-3 rounded-2xl border border-outline-variant/40 flex items-center justify-between">
          <span className="text-xs font-semibold text-on-surface-variant">Preferred Vernacular Language:</span>
          <div className="flex gap-1">
            {['Hindi', 'Marathi', 'English'].map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => {
                  setLanguage(lang);
                  setFormData((prev) => ({ ...prev, language: lang }));
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  formData.language === lang
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {lang === 'Hindi' ? 'हिंदी' : lang === 'Marathi' ? 'मराठी' : 'English'}
              </button>
            ))}
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
              Store / Business Name
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Savita Handicrafts"
              className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                Artisan Name
              </label>
              <input
                type="text"
                name="ownerName"
                required
                value={formData.ownerName}
                onChange={handleChange}
                placeholder="e.g. Savita Devi"
                className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                Mobile Number
              </label>
              <input
                type="text"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                Primary Craft
              </label>
              <select
                name="craft"
                value={formData.craft}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm outline-none focus:border-primary transition-colors"
              >
                <option value="Bamboo & Textile Crafts">Bamboo & Textile Crafts</option>
                <option value="Handloom Weaving & Silk">Handloom Weaving & Silk</option>
                <option value="Terracotta & Pottery">Terracotta & Pottery</option>
                <option value="Wood Carving & Handicraft">Wood Carving & Handicraft</option>
                <option value="Brass & Metal Craft">Brass & Metal Craft</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                Location / Region
              </label>
              <input
                type="text"
                name="location"
                required
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Pune, Maharashtra"
                className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-primary text-on-primary font-semibold rounded-2xl shadow-sm hover:bg-surface-tint active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <span>Creating Your Digital Store...</span>
            ) : (
              <>
                <span>Launch My Artisan Dashboard</span>
                <span className="material-symbols-outlined text-lg">rocket_launch</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-on-surface-variant">
          Already registered?{' '}
          <Link to="/login" className="text-primary font-bold hover:underline">
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
