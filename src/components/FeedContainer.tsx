'use client';

import React, { useRef, useEffect } from 'react';
import { useFeed } from '@/context/FeedContext';
import { VideoCard } from './VideoCard';
import { ChevronUp, ChevronDown } from 'lucide-react';

export const FeedContainer: React.FC = () => {
  const { videos, activeVideoIndex, setActiveVideoIndex, isLoading } = useFeed();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoElementsRef = useRef<(HTMLDivElement | null)[]>([]);

  // IntersectionObserver to detect which card is centered in the 50% container
  useEffect(() => {
    if (!containerRef.current || videos.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));
            if (!isNaN(index)) {
              setActiveVideoIndex(index);
            }
          }
        });
      },
      {
        root: containerRef.current,
        threshold: 0.6, // When 60% of the video card is visible
      }
    );

    videoElementsRef.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [videos, setActiveVideoIndex]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        const nextIdx = Math.min(activeVideoIndex + 1, videos.length - 1);
        videoElementsRef.current[nextIdx]?.scrollIntoView({ behavior: 'smooth' });
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        const prevIdx = Math.max(activeVideoIndex - 1, 0);
        videoElementsRef.current[prevIdx]?.scrollIntoView({ behavior: 'smooth' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeVideoIndex, videos.length]);

  const scrollToNext = () => {
    const nextIdx = Math.min(activeVideoIndex + 1, videos.length - 1);
    videoElementsRef.current[nextIdx]?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToPrev = () => {
    const prevIdx = Math.max(activeVideoIndex - 1, 0);
    videoElementsRef.current[prevIdx]?.scrollIntoView({ behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div
        className="feed-viewport"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(255, 45, 85, 0.2)',
              borderTopColor: '#ff2d55',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <p style={{ fontWeight: 600 }}>Loading short clips...</p>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div
        className="feed-viewport"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px',
          textAlign: 'center',
          color: '#fff',
        }}
      >
        <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '8px' }}>No Videos Yet</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
          Connected to backend API. Publish your first video to see it in the stream!
        </p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* 50% Centered Snap Feed Viewport */}
      <div className="feed-viewport" ref={containerRef}>
        {videos.map((video, idx) => (
          <div
            key={video.id}
            data-index={idx}
            ref={(el) => {
              videoElementsRef.current[idx] = el;
            }}
            style={{ width: '100%', height: '100%' }}
          >
            <VideoCard video={video} isActive={idx === activeVideoIndex} />
          </div>
        ))}
      </div>

      {/* Desktop Quick Nav Arrows */}
      {activeVideoIndex > 0 && (
        <button
          onClick={scrollToPrev}
          style={{
            position: 'absolute',
            top: '50%',
            left: '-60px',
            transform: 'translateY(-60px)',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#fff',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Previous Clip (Up)"
        >
          <ChevronUp size={24} />
        </button>
      )}

      {activeVideoIndex < videos.length - 1 && (
        <button
          onClick={scrollToNext}
          style={{
            position: 'absolute',
            top: '50%',
            right: '-60px',
            transform: 'translateY(10px)',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#fff',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Next Clip (Down)"
        >
          <ChevronDown size={24} />
        </button>
      )}
    </div>
  );
};
