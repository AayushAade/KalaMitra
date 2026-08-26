import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export const ArtisanInquiriesPage = () => {
  const { inquiries } = useApp();

  return (
    <div className="bg-background min-h-screen pb-24 pt-6 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-surface-container-lowest p-6 rounded-3xl soft-shadow border border-outline-variant/30 flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display-lg text-on-surface">
            Buyer Wholesale Inquiries
          </h1>
          <p className="text-sm text-on-surface-variant">Direct bulk purchasing requests from retailers and distributors.</p>
        </div>
        <span className="text-xs font-bold text-primary bg-primary-fixed px-3 py-1.5 rounded-full">
          {inquiries.length} Inquiries Received
        </span>
      </div>

      {/* Inquiry List */}
      <div className="space-y-4">
        {inquiries.map((inq) => (
          <div
            key={inq.id}
            className="bg-surface-container-lowest p-6 rounded-2xl soft-shadow border border-surface-variant hover:border-primary/50 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
          >
            <div className="flex items-center gap-4">
              <img src={inq.productImage} alt={inq.productTitle} className="w-16 h-16 rounded-xl object-cover border" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-on-surface text-base">{inq.buyerName}</h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      inq.status === 'New' ? 'bg-error-container text-on-error-container' : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {inq.status}
                  </span>
                </div>

                <p className="text-xs text-on-surface-variant">
                  Requested <strong>{inq.quantity} units</strong> of {inq.productTitle}
                </p>

                <p className="text-xs text-on-surface-variant italic line-clamp-1">
                  "{inq.message}"
                </p>
              </div>
            </div>

            <Link
              to={`/artisan/inquiries/${inq.id}`}
              className="w-full sm:w-auto px-5 py-2.5 bg-primary text-on-primary font-semibold text-xs rounded-xl hover:bg-surface-tint active:scale-95 transition-all text-center flex items-center justify-center gap-1 shrink-0"
            >
              <span>Respond & Chat</span>
              <span className="material-symbols-outlined text-sm">chat</span>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ArtisanInquiriesPage;
