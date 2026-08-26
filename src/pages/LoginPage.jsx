import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import authService from '../services/authService';

export const LoginPage = () => {
  const { loginUser } = useApp();
  const navigate = useNavigate();
  const [role, setRole] = useState('artisan'); // 'artisan' or 'buyer'
  const [phone, setPhone] = useState('+91 98765 43210');
  const [password, setPassword] = useState('pass1234');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authService.login({ phone, role });
      loginUser({ ...response.user, role });
      if (role === 'artisan') {
        navigate('/artisan/home');
      } else {
        navigate('/buyer/home');
      }
    } catch {
      setError('Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-surface-container-lowest p-8 rounded-3xl soft-shadow border border-outline-variant/30">
        <div className="text-center">
          <Link to="/" className="inline-block text-3xl font-bold text-primary font-display-lg">
            DIY-Nest
          </Link>
          <h2 className="mt-3 text-2xl font-bold text-on-surface">Welcome Back</h2>
          <p className="mt-1 text-sm text-on-surface-variant">Sign in to manage your digital store</p>
        </div>

        {/* Role Toggle */}
        <div className="flex bg-surface-container p-1 rounded-2xl gap-1">
          <button
            type="button"
            onClick={() => setRole('artisan')}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
              role === 'artisan'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-base">palette</span> Artisan Login
          </button>
          <button
            type="button"
            onClick={() => setRole('buyer')}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
              role === 'buyer'
                ? 'bg-tertiary text-on-tertiary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-base">shopping_bag</span> Buyer Login
          </button>
        </div>

        {error && (
          <div className="bg-error-container text-on-error-container p-3 rounded-xl text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
              Mobile Number / Email
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                phone
              </span>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm outline-none focus:border-primary transition-colors"
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
              Password / OTP
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                lock
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm outline-none focus:border-primary transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-primary text-on-primary font-semibold rounded-2xl shadow-sm hover:bg-surface-tint active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="text-sm">Signing in...</span>
            ) : (
              <>
                <span>Sign In</span>
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-on-surface-variant space-y-2">
          <p>
            Don't have an artisan store yet?{' '}
            <Link to="/register" className="text-primary font-bold hover:underline">
              Register now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
