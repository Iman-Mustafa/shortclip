'use client';

import React from 'react';
import { Clapperboard, Flame, LogIn, LogOut, User as UserIcon, Server } from 'lucide-react';
import { FeedContainer } from '@/components/FeedContainer';
import { AuthModal } from '@/components/AuthModal';
import { CommentsDrawer } from '@/components/CommentsDrawer';
import { ShareModal } from '@/components/ShareModal';
import { ZoomModal } from '@/components/ZoomModal';
import { useAuth } from '@/context/AuthContext';
import { useFeed } from '@/context/FeedContext';

export default function HomePage() {
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const { toastMessage } = useFeed();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  return (
    <main className="app-container">
      {/* Ambient background glow for desktop aesthetic */}
      <div className="ambient-glow-left" />
      <div className="ambient-glow-right" />

      {/* Desktop Brand Navigation Bar */}
      <header className="desktop-side-nav">
        <a href="#" className="brand-logo">
          <div className="brand-icon-wrapper">
            <Clapperboard size={24} color="#fff" />
          </div>
          <div>
            <span className="brand-text">ShortClip</span>
            <span className="brand-badge">PRO</span>
          </div>
        </a>

        {/* User Account / Auth Trigger placed on the right */}
        <div className="desktop-auth-nav">
          {isAuthenticated && user ? (
            <div className="user-profile-badge">
              <img
                src={user.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                alt={user.username}
                style={{ width: '28px', height: '28px', borderRadius: '50%' }}
              />
              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>@{user.username}</span>
              <button
                onClick={() => logout()}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Log Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => openAuthModal()}
              className="auth-signin-btn"
            >
              <LogIn size={16} />
              <span>Sign In / Sign Up</span>
            </button>
          )}
        </div>
      </header>

      {/* Backend Integration Status Indicator */}
      <div className="backend-status-indicator" title={`Backend API Endpoint: ${apiUrl}`}>
        <span className="status-dot" />
        <Server size={14} />
        <span>API: {apiUrl.replace(/https?:\/\//, '')}</span>
      </div>

      {/* Centered 50% Short-Clip Video Feed */}
      <FeedContainer />

      {/* Overlays & Drawers */}
      <AuthModal />
      <CommentsDrawer />
      <ShareModal />
      <ZoomModal />

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="toast-banner">
          <Flame size={16} color="#ff2d55" />
          <span>{toastMessage}</span>
        </div>
      )}
    </main>
  );
}
