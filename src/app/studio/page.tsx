'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Clapperboard,
  Upload,
  Camera,
  Film,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Video as VideoIcon,
  LogOut,
  BadgeCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useFeed } from '@/context/FeedContext';

type StudioTab = 'upload' | 'record' | 'my-clips';

export default function StudioPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const { publishVideo, videos, showToast } = useFeed();

  const [activeTab, setActiveTab] = useState<StudioTab>('upload');

  // Form State
  const [description, setDescription] = useState('');
  const [soundTitle, setSoundTitle] = useState('');
  const [tagsInput, setTagsInput] = useState('fyp, trending, shortclip');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Camera Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up camera stream and timers on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const stopCameraStream = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setIsRecording(false);
    setRecordingTime(0);
  };

  const userClips = videos.filter(
    (v) => v.creator.id === user?.id || v.creator.username === user?.username
  );

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        setErrorMsg('Please select a valid video file (MP4, WebM, MOV).');
        return;
      }
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoPreviewUrl(url);
      setErrorMsg(null);
    }
  };

  // Start Live Camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 1280 } },
        audio: true,
      });
      setMediaStream(stream);
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('Unable to access camera or microphone. Please check browser permissions.');
    }
  };

  // Switch tab and manage camera
  const handleTabChange = (tab: StudioTab) => {
    setActiveTab(tab);
    setErrorMsg(null);
    if (tab === 'record') {
      startCamera();
    } else {
      stopCameraStream();
    }
  };

  // Start Camera Recording
  const startRecording = () => {
    if (!mediaStream) return;
    recordedChunksRef.current = [];
    setRecordedBlob(null);

    try {
      const recorder = new MediaRecorder(mediaStream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm',
      });

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);
        const preview = URL.createObjectURL(blob);
        setVideoPreviewUrl(preview);
      };

      recorder.start(200);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingTime(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 60) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      setCameraError('Recording failed to initialize in this browser.');
    }
  };

  // Stop Camera Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      stopCameraStream();
    }
  };

  // Retake Recording
  const handleRetake = () => {
    setRecordedBlob(null);
    setVideoPreviewUrl(null);
    startCamera();
  };

  // Publish Video Submission
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const finalVideoUrl = videoPreviewUrl;
    if (!finalVideoUrl) {
      setErrorMsg('Please upload a video or record a clip before publishing.');
      return;
    }

    if (!description.trim()) {
      setErrorMsg('Please write a caption for your video.');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter((t) => t.length > 0);

    try {
      setIsSubmitting(true);
      await publishVideo({
        videoUrl: finalVideoUrl,
        description: description.trim(),
        soundTitle: soundTitle.trim() || 'Original Sound - ' + (user?.username || 'Creator'),
        tags: tags.length > 0 ? tags : ['shortclip'],
      });
      stopCameraStream();
      router.push('/');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to publish video. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="studio-standalone-page">
        <header className="app-header">
          <Link href="/" className="brand-logo">
            <div className="brand-icon-wrapper">
              <Clapperboard size={24} color="#fff" />
            </div>
            <div>
              <span className="brand-text">ShortClip</span>
              <span className="brand-badge">PRO</span>
            </div>
          </Link>
          <Link href="/" className="back-feed-link">
            <ArrowLeft size={16} />
            <span>Back to Feed</span>
          </Link>
        </header>

        <div className="studio-auth-prompt-card">
          <h2>Creator Studio</h2>
          <p>Please sign in to access your profile, post videos, and record live clips.</p>
          <button onClick={() => openAuthModal()} className="auth-signin-btn" style={{ marginTop: '16px' }}>
            Sign In to Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="studio-standalone-page">
      {/* Background ambient lighting */}
      <div className="ambient-glow-left" />
      <div className="ambient-glow-right" />

      {/* Top Application Header with Navigation Tabs */}
      <header className="app-header studio-page-header">
        <Link href="/" className="brand-logo">
          <div className="brand-icon-wrapper">
            <Clapperboard size={22} color="#fff" />
          </div>
          <div>
            <span className="brand-text">ShortClip</span>
            <span className="brand-badge">STUDIO</span>
          </div>
        </Link>

        {/* Center: Tabs in Header Area */}
        <div className="header-studio-tabs">
          <button
            className={`header-studio-tab ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => handleTabChange('upload')}
          >
            <Upload size={15} />
            <span>Upload Video</span>
          </button>
          <button
            className={`header-studio-tab ${activeTab === 'record' ? 'active' : ''}`}
            onClick={() => handleTabChange('record')}
          >
            <Camera size={15} />
            <span>Record Camera</span>
          </button>
          <button
            className={`header-studio-tab ${activeTab === 'my-clips' ? 'active' : ''}`}
            onClick={() => handleTabChange('my-clips')}
          >
            <Film size={15} />
            <span>My Clips ({userClips.length})</span>
          </button>
        </div>

        {/* Right: Back to Feed & User info */}
        <div className="desktop-auth-nav">
          <Link href="/" className="back-feed-link">
            <ArrowLeft size={16} />
            <span>Back to Feed</span>
          </Link>

          <div className="user-profile-badge">
            <img
              src={user.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
              alt={user.username}
              className="user-badge-avatar"
            />
            <span className="user-badge-name">@{user.username}</span>
            <button
              onClick={() => {
                logout();
                router.push('/');
              }}
              className="user-badge-logout"
              title="Log Out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Studio Workspace Container (Fixed 100vh layout) */}
      <main className="studio-workspace">
        <div className="studio-unified-card">
          {/* Compact User Summary Header Strip */}
          <div className="studio-profile-strip">
            <div className="studio-user-card">
              <img
                src={user.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                alt={user.username}
                className="studio-avatar-img"
              />
              <div className="studio-user-details">
                <div className="studio-username-row">
                  <h3>@{user.username}</h3>
                  <BadgeCheck size={16} className="verified-badge" />
                  <span className="creator-tag">CREATOR</span>
                </div>
                <div className="studio-stats-pills">
                  <span className="stat-pill">
                    <strong>{userClips.length}</strong> Clips
                  </span>
                  <span className="stat-pill">
                    <strong>{user.followerCount || 1}</strong> Followers
                  </span>
                  <span className="stat-pill">
                    <strong>12</strong> Following
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Content 1: Upload Video */}
          {activeTab === 'upload' && (
            <form onSubmit={handlePublish} className="studio-form-content">
              <div className="studio-content-layout">
                {/* Left: Video Dropzone / Preview */}
                <div className="studio-preview-col">
                  {videoPreviewUrl ? (
                    <div className="studio-video-preview-wrapper">
                      <video
                        src={videoPreviewUrl}
                        controls
                        autoPlay
                        loop
                        className="studio-preview-player"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setVideoFile(null);
                          setVideoPreviewUrl(null);
                        }}
                        className="change-video-btn"
                      >
                        <RotateCcw size={14} /> Change Video
                      </button>
                    </div>
                  ) : (
                    <div
                      className="studio-dropzone"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                      />
                      <div className="dropzone-icon-circle">
                        <Upload size={26} color="#ff2d55" />
                      </div>
                      <h4>Select Video to Post</h4>
                      <p>MP4, WebM or MOV (9:16 vertical recommended)</p>
                      <span className="dropzone-btn">Browse Files</span>
                    </div>
                  )}
                </div>

                {/* Right: Metadata Form */}
                <div className="studio-meta-col">
                  <div className="form-group">
                    <label>Caption & Description</label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Tell your viewers what this clip is about..."
                      className="studio-input studio-textarea"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Audio Track Name</label>
                    <input
                      type="text"
                      value={soundTitle}
                      onChange={(e) => setSoundTitle(e.target.value)}
                      placeholder="Original Sound - @username"
                      className="studio-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Hashtags & Tags (comma separated)</label>
                    <input
                      type="text"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      placeholder="fyp, trending, shortclip"
                      className="studio-input"
                    />
                  </div>

                  {errorMsg && (
                    <div className="studio-error-banner">
                      <AlertCircle size={16} />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!videoPreviewUrl || isSubmitting}
                    className="studio-publish-btn"
                  >
                    {isSubmitting ? (
                      <span>Publishing clip...</span>
                    ) : (
                      <>
                        <CheckCircle size={18} />
                        <span>Publish Video to Feed</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Tab Content 2: Live Camera Recording */}
          {activeTab === 'record' && (
            <form onSubmit={handlePublish} className="studio-form-content">
              <div className="studio-content-layout">
                {/* Left: Viewfinder / Review */}
                <div className="studio-preview-col">
                  {videoPreviewUrl ? (
                    <div className="studio-video-preview-wrapper">
                      <video
                        src={videoPreviewUrl}
                        controls
                        autoPlay
                        loop
                        className="studio-preview-player"
                      />
                      <button
                        type="button"
                        onClick={handleRetake}
                        className="change-video-btn"
                      >
                        <RotateCcw size={14} /> Retake Video
                      </button>
                    </div>
                  ) : (
                    <div className="studio-camera-viewfinder">
                      <video
                        ref={liveVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="camera-stream-video"
                      />

                      <div className="camera-overlay-controls">
                        {isRecording && (
                          <div className="recording-badge-pill">
                            <span className="record-red-dot" />
                            <span>00:{recordingTime.toString().padStart(2, '0')} / 01:00</span>
                          </div>
                        )}

                        {!isRecording ? (
                          <button
                            type="button"
                            onClick={startRecording}
                            disabled={!mediaStream}
                            className="start-record-btn"
                            title="Start Recording"
                          >
                            <div className="record-inner-circle" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={stopRecording}
                            className="stop-record-btn"
                            title="Stop Recording"
                          >
                            <div className="stop-inner-square" />
                          </button>
                        )}
                      </div>

                      {cameraError && (
                        <div className="camera-error-overlay">
                          <AlertCircle size={24} color="#ff2d55" />
                          <p>{cameraError}</p>
                          <button
                            type="button"
                            onClick={startCamera}
                            className="dropzone-btn"
                            style={{ marginTop: '8px' }}
                          >
                            Retry Camera
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Metadata Form */}
                <div className="studio-meta-col">
                  <div className="form-group">
                    <label>Caption & Description</label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Recorded live on ShortClip! Add details..."
                      className="studio-input studio-textarea"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Audio Track Name</label>
                    <input
                      type="text"
                      value={soundTitle}
                      onChange={(e) => setSoundTitle(e.target.value)}
                      placeholder="Live Camera Audio"
                      className="studio-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Hashtags & Tags</label>
                    <input
                      type="text"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      placeholder="fyp, camera, real"
                      className="studio-input"
                    />
                  </div>

                  {errorMsg && (
                    <div className="studio-error-banner">
                      <AlertCircle size={16} />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!videoPreviewUrl || isSubmitting}
                    className="studio-publish-btn"
                  >
                    {isSubmitting ? (
                      <span>Publishing clip...</span>
                    ) : (
                      <>
                        <CheckCircle size={18} />
                        <span>Publish Recorded Clip</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Tab Content 3: My Clips Gallery */}
          {activeTab === 'my-clips' && (
            <div className="studio-form-content clips-gallery-view">
              {userClips.length === 0 ? (
                <div className="empty-clips-view">
                  <VideoIcon size={36} color="rgba(255,255,255,0.3)" />
                  <h4>No Clips Published Yet</h4>
                  <p>Use the Upload or Record tabs above to share your first video!</p>
                  <button
                    type="button"
                    onClick={() => handleTabChange('upload')}
                    className="dropzone-btn"
                    style={{ marginTop: '10px' }}
                  >
                    Create First Clip
                  </button>
                </div>
              ) : (
                <div className="user-clips-grid">
                  {userClips.map((clip) => (
                    <div key={clip.id} className="user-clip-card">
                      <video src={clip.videoUrl} className="user-clip-thumb" />
                      <div className="user-clip-overlay">
                        <p className="user-clip-desc">{clip.description}</p>
                        <div className="user-clip-stats">
                          <span>❤️ {clip.likeCount}</span>
                          <span>💬 {clip.commentCount}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
