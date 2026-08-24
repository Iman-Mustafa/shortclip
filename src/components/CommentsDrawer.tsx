'use client';

import React, { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { useFeed } from '@/context/FeedContext';
import { useAuth } from '@/context/AuthContext';
import { Comment } from '@/types';
import { videosApi } from '@/lib/api/videos';

export const CommentsDrawer: React.FC = () => {
  const { activeCommentVideo, closeComments } = useFeed();
  const { isAuthenticated, openAuthModal } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!activeCommentVideo) return;

    const fetchComments = async () => {
      setIsLoading(true);
      try {
        const data = await videosApi.getComments(activeCommentVideo.id);
        setComments(data);
      } catch (err) {
        console.error('Failed to load comments:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComments();
  }, [activeCommentVideo]);

  if (!activeCommentVideo) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    if (!isAuthenticated) {
      openAuthModal(() => {
        handleSubmit(e);
      });
      return;
    }

    const text = newCommentText.trim();
    setNewCommentText('');

    try {
      const addedComment = await videosApi.postComment(activeCommentVideo.id, text);
      setComments((prev) => [addedComment, ...prev]);
    } catch (err) {
      console.error('Error posting comment:', err);
    }
  };

  return (
    <div className="modal-overlay-backdrop" onClick={closeComments}>
      <div
        className="comments-drawer-panel"
        style={{
          width: '50vw',
          minWidth: '360px',
          maxWidth: '480px',
          left: '50%',
          transform: 'translateX(-50%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="drawer-header">
          <span className="drawer-title">
            Comments ({comments.length})
          </span>
          <button className="modal-close-btn" onClick={closeComments} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* Comments Scrollable List */}
        <div className="comments-list-scroll">
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
              Loading comments...
            </div>
          ) : comments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
              No comments yet. Be the first to comment!
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="comment-item">
                <img
                  src={comment.user.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                  alt={comment.user.username}
                  className="comment-avatar"
                />
                <div className="comment-body">
                  <span className="comment-author">@{comment.user.username}</span>
                  <p className="comment-text">{comment.text}</p>
                  <span className="comment-meta">{comment.createdAt}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Bar */}
        <form className="comment-input-bar" onSubmit={handleSubmit}>
          <input
            type="text"
            className="comment-input"
            placeholder={
              isAuthenticated
                ? 'Add a comment...'
                : 'Log in with username & password to comment'
            }
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
          />
          <button
            type="submit"
            className="comment-send-btn"
            disabled={!newCommentText.trim()}
            aria-label="Send comment"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
