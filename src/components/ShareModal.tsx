'use client';

import React, { useState } from 'react';
import { X, Copy, Check, MessageCircle, Send, Globe, Share2 } from 'lucide-react';
import { useFeed } from '@/context/FeedContext';

export const ShareModal: React.FC = () => {
  const { activeShareVideo, closeShare, shareVideo, showToast } = useFeed();
  const [copied, setCopied] = useState(false);

  if (!activeShareVideo) return null;

  const currentUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}?v=${activeShareVideo.id}`
      : `https://shortclips.app/v/${activeShareVideo.id}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      showToast('Link copied to clipboard! 📋');
      shareVideo(activeShareVideo.id);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      showToast('Failed to copy link');
    }
  };

  const handleSocialShare = (platform: string) => {
    shareVideo(activeShareVideo.id);
    let shareUrl = '';
    const text = encodeURIComponent(`Watch this awesome short clip by @${activeShareVideo.creator.username}!`);
    const encodedUrl = encodeURIComponent(currentUrl);

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}`;
        break;
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${text}%20${encodedUrl}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${text}`;
        break;
      default:
        handleCopy();
        return;
    }

    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="modal-overlay-backdrop" onClick={closeShare}>
      <div className="glass-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={closeShare} aria-label="Close">
          <X size={18} />
        </button>

        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px', textAlign: 'center' }}>
          Share to Friends
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '20px' }}>
          Spread the love and share this clip with your network
        </p>

        {/* Social Share Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
          <button
            onClick={() => handleSocialShare('whatsapp')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              padding: '12px',
              borderRadius: '16px',
              background: 'rgba(37, 211, 102, 0.12)',
              border: '1px solid rgba(37, 211, 102, 0.3)',
              color: '#25D366',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.78rem',
            }}
          >
            <MessageCircle size={22} />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={() => handleSocialShare('telegram')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              padding: '12px',
              borderRadius: '16px',
              background: 'rgba(0, 136, 204, 0.12)',
              border: '1px solid rgba(0, 136, 204, 0.3)',
              color: '#0088cc',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.78rem',
            }}
          >
            <Send size={22} />
            <span>Telegram</span>
          </button>

          <button
            onClick={() => handleSocialShare('twitter')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              padding: '12px',
              borderRadius: '16px',
              background: 'rgba(29, 161, 242, 0.12)',
              border: '1px solid rgba(29, 161, 242, 0.3)',
              color: '#1da1f2',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.78rem',
            }}
          >
            <Globe size={22} />
            <span>Twitter / X</span>
          </button>
        </div>

        {/* Copy Link Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '14px',
            padding: '6px 6px 6px 14px',
          }}
        >
          <span
            style={{
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: '0.82rem',
              color: 'var(--text-secondary)',
            }}
          >
            {currentUrl}
          </span>
          <button
            onClick={handleCopy}
            style={{
              background: copied ? '#00e676' : 'var(--primary)',
              border: 'none',
              borderRadius: '10px',
              padding: '8px 14px',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background 0.2s ease',
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
};
