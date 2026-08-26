import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export const InquiryDetailsPage = () => {
  const { id } = useParams();
  const { inquiries, replyToInquiry, user } = useApp();
  const [replyText, setReplyText] = useState('');

  const inquiry = inquiries.find((inq) => inq.id === id) || inquiries[0];

  const handleSendReply = (e) => {
    e.preventDefault();
    if (replyText.trim()) {
      replyToInquiry(inquiry.id, replyText);
      setReplyText('');
    }
  };

  return (
    <div className="bg-background min-h-screen pb-24 pt-6 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/artisan/inquiries" className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-on-surface">Bulk Order Chat: {inquiry.buyerName}</h1>
          <p className="text-xs text-on-surface-variant">Inquiry for {inquiry.quantity} units of {inquiry.productTitle}</p>
        </div>
      </div>

      {/* Inquiry Summary Box */}
      <div className="bg-surface-container-lowest p-4 sm:p-6 rounded-2xl soft-shadow border border-outline-variant/30 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img src={inquiry.productImage} alt={inquiry.productTitle} className="w-14 h-14 rounded-xl object-cover border" />
          <div className="text-xs sm:text-sm">
            <h4 className="font-bold text-on-surface">{inquiry.productTitle}</h4>
            <p className="text-on-surface-variant">Unit Price: <strong>₹{inquiry.productPrice}</strong></p>
            <p className="text-primary font-bold">Total Estimated Deal: ₹{inquiry.quantity * inquiry.productPrice}</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full">
            {inquiry.status}
          </span>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="bg-surface-container-lowest p-6 rounded-3xl soft-shadow border border-surface-variant space-y-4 min-h-[300px]">
        {inquiry.messages?.map((msg, index) => {
          const isMe = (user?.role === 'buyer' && msg.sender === 'Buyer') || (user?.role !== 'buyer' && msg.sender === 'Artisan');
          return (
            <div
              key={index}
              className={`flex flex-col max-w-[80%] space-y-1 ${
                isMe ? 'ml-auto items-end' : 'mr-auto items-start'
              }`}
            >
              <span className="text-[10px] font-bold text-on-surface-variant px-1">{msg.sender}</span>
              <div
                className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                  isMe
                    ? 'bg-primary text-on-primary rounded-tr-none'
                    : 'bg-surface-container text-on-surface rounded-tl-none border'
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[9px] text-on-surface-variant">{msg.time}</span>
            </div>
          );
        })}
      </div>

      {/* Reply input form */}
      <form onSubmit={handleSendReply} className="flex gap-2">
        <input
          type="text"
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder="Type your response to buyer..."
          className="flex-1 px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-2xl text-sm outline-none focus:border-primary shadow-sm"
        />
        <button
          type="submit"
          className="px-6 py-3 bg-primary text-on-primary font-semibold text-sm rounded-2xl hover:bg-surface-tint active:scale-95 transition-all shadow-md flex items-center gap-1 shrink-0"
        >
          <span>Send</span>
          <span className="material-symbols-outlined text-lg">send</span>
        </button>
      </form>
    </div>
  );
};

export default InquiryDetailsPage;
