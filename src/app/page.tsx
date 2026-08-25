'use client';

import React from 'react';
import Link from 'next/link';
import { Clapperboard, Flame, LogIn, LogOut, Plus } from 'lucide-react';
import { FeedContainer } from '@/components/FeedContainer';
import { AuthModal } from '@/components/AuthModal';
import { CommentsDrawer } from '@/components/CommentsDrawer';
import { ShareModal } from '@/components/ShareModal';
import { ZoomModal } from '@/components/ZoomModal';
import { EditVideoModal } from '@/components/EditVideoModal';
import { useAuth } from '@/context/AuthContext';
import { useFeed } from '@/context/FeedContext';

export default function HomePage() {
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const { toastMessage } = useFeed();

  return (
    <main className="app-container">
      {/* Ambient background glow for desktop aesthetic */}
      <div className="ambient-glow-left" />
      <div className="ambient-glow-right" />

      {/* Top Application Header / Brand Navigation */}
      <header className="app-header">
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
            <div className="user-nav-group">
              {/* Quick Post / Studio Link */}
              <Link
                href="/studio"
                className="header-create-btn"
                title="Post or Record Video"
              >
                <Plus size={16} />
                <span>Create</span>
              </Link>

              {/* User Profile Avatar Link to Studio */}
              <Link
                href="/studio"
                className="user-profile-badge interactive"
                title="Open Profile & Creator Studio"
                style={{ textDecoration: 'none' }}
              >
                <img
                  src={user.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                  alt={user.username}
                  className="user-badge-avatar"
                />
                <span className="user-badge-name">@{user.username}</span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    logout();
                  }}
                  className="user-badge-logout"
                  title="Log Out"
                >
                  <LogOut size={15} />
                </button>
              </Link>
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

      {/* Centered 50% Short-Clip Video Feed */}
      <FeedContainer />

      {/* Overlays & Drawers */}
      <AuthModal />
      <CommentsDrawer />
      <ShareModal />
      <ZoomModal />
      <EditVideoModal />

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
