import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export const ArtisanAssistantPage = () => {
  const { assistantTips } = useApp();

  return (
    <div className="bg-background min-h-screen pb-24 pt-6 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
      <div className="bg-surface-container-lowest p-6 rounded-3xl soft-shadow border border-outline-variant/30 text-center sm:text-left">
        <span className="text-xs font-bold text-tertiary uppercase bg-tertiary-fixed px-3 py-1 rounded-full">
          AI Business Co-Pilot
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold font-display-lg text-on-surface mt-2">
          AI Business Assistant Suggestions
        </h1>
        <p className="text-sm text-on-surface-variant">Real-time market recommendations, pricing optimization, and inquiry alerts.</p>
      </div>

      <div className="space-y-4">
        {assistantTips.map((tip) => (
          <div
            key={tip.id}
            className="bg-surface-container-lowest p-6 rounded-2xl soft-shadow border border-surface-variant flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-tertiary-container text-on-tertiary-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">
                  {tip.type === 'inquiry' ? 'mark_email_unread' : tip.type === 'pricing' ? 'payments' : 'photo_camera'}
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-on-surface">{tip.title}</h3>
                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                  {tip.description}
                </p>
              </div>
            </div>

            <Link
              to={tip.actionLink}
              className="w-full sm:w-auto px-5 py-2.5 bg-primary text-on-primary font-semibold text-xs rounded-xl hover:bg-surface-tint active:scale-95 transition-all text-center shrink-0"
            >
              {tip.actionText} →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ArtisanAssistantPage;
