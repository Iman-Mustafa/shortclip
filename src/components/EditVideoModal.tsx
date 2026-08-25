'use client';

import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { useFeed } from '@/context/FeedContext';
import { UpdateVideoDto } from '@/types';

export const EditVideoModal: React.FC = () => {
  const { activeEditVideo, closeEditModal, updateVideo } = useFeed();
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [soundTitle, setSoundTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state when modal opens
  useEffect(() => {
    if (activeEditVideo) {
      setDescription(activeEditVideo.description || '');
      setTags(activeEditVideo.tags ? activeEditVideo.tags.join(', ') : '');
      setSoundTitle(activeEditVideo.soundTitle || '');
    }
  }, [activeEditVideo]);

  if (!activeEditVideo) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const dto: UpdateVideoDto = {
      description: description.trim(),
      soundTitle: soundTitle.trim(),
      tags: tags.split(',').map((t) => t.trim()).filter((t) => t.length > 0),
    };

    try {
      await updateVideo(activeEditVideo.id, dto);
      closeEditModal();
    } catch (err) {
      console.error('Failed to update video:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay-backdrop" onClick={closeEditModal}>
      <div className="glass-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={closeEditModal} aria-label="Close">
          <X size={18} />
        </button>

        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px', textAlign: 'center' }}>
          Edit Video Details
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '24px' }}>
          Update the description, tags, and sound title
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this video about?"
              rows={3}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '12px',
                color: '#fff',
                fontSize: '0.9rem',
                resize: 'none',
                outline: 'none',
              }}
            />
          </div>

          {/* Tags */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. funny, dance, viral"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '12px',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Sound Title */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Sound Title
            </label>
            <input
              type="text"
              value={soundTitle}
              onChange={(e) => setSoundTitle(e.target.value)}
              placeholder="Original Sound"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '12px',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              marginTop: '10px',
              background: 'var(--primary)',
              border: 'none',
              borderRadius: '12px',
              padding: '14px',
              color: '#fff',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: isSubmitting ? 0.7 : 1,
              transition: 'all 0.2s ease',
            }}
          >
            <Save size={18} />
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};
