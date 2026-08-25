'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Camera,
  Film,
  Sparkles,
  Music,
  Hash,
  Play,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Video as VideoIcon,
  LogOut,
  Sliders,
  BadgeCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useFeed } from '@/context/FeedContext';

type StudioTab = 'upload' | 'record' | 'my-clips';

export const ProfileStudioModal: React.FC = () => {
  const { user, logout } = useAuth();
  const { isProfileStudioOpen, closeProfileStudio, publishVideo, videos } = useFeed();

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

  // Filter clips published by this user
  const userClips = videos.filter(
    (v) => v.creator.id === user?.id || v.creator.username === user?.username
  );

  // Clean up camera stream and timers when modal closes
  useEffect(() => {
    if (!isProfileStudioOpen) {
      stopCameraStream();
      resetForm();
    }
  }, [isProfileStudioOpen]);

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

  const resetForm = () => {
    setDescription('');
    setSoundTitle('');
    setTagsInput('fyp, trending, shortclip');
    setVideoFile(null);
    setVideoPreviewUrl(null);
    setRecordedBlob(null);
    setErrorMsg(null);
    setCameraError(null);
    setIsSubmitting(false);
  };

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
      setErrorMsg('Please write a brief caption for your video.');
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
      resetForm();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to publish video. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isProfileStudioOpen || !user) return null;

  return (
    <div className="modal-backdrop" onClick={closeProfileStudio}>
      <div
        className="profile-studio-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header & User Summary */}
        <div className="studio-header">
          <div className="studio-user-card">
            <img
              src={user.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
              alt={user.username}
              className="studio-avatar-img"
            />
            <div className="studio-user-details">
              <div className="studio-username-row">
                <h3>@{user.username}</h3>
                <BadgeCheck size={18} className="verified-badge" />
                <span className="creator-tag">CREATOR</span>
              </div>
              <p className="studio-user-bio">{user.bio || 'ShortClip Creator Studio'}</p>
              
              {/* Creator Stats */}
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

          <div className="studio-header-actions">
            <button
              onClick={() => {
                logout();
                closeProfileStudio();
              }}
              className="studio-logout-btn"
              title="Sign Out"
            >
              <LogOut size={16} />
              <span>Log Out</span>
            </button>
            <button
              onClick={closeProfileStudio}
              className="modal-close-btn"
              aria-label="Close Studio"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Studio Navigation Switcher */}
        <div className="studio-tab-bar">
          <button
            className={`studio-tab ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => handleTabChange('upload')}
          >
            <Upload size={16} />
            <span>Upload Video</span>
          </button>
          <button
            className={`studio-tab ${activeTab === 'record' ? 'active' : ''}`}
            onClick={() => handleTabChange('record')}
          >
            <Camera size={16} />
            <span>Record Camera</span>
          </button>
          <button
            className={`studio-tab ${activeTab === 'my-clips' ? 'active' : ''}`}
            onClick={() => handleTabChange('my-clips')}
          >
            <Film size={16} />
            <span>My Clips ({userClips.length})</span>
          </button>
        </div>

        {/* Tab Content 1: Upload Video */}
        {activeTab === 'upload' && (
          <form onSubmit={handlePublish} className="studio-body">
            <div className="studio-content-layout">
              {/* Left Column: Dropzone / Preview */}
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
                      <Upload size={28} color="#ff2d55" />
                    </div>
                    <h4>Select Video to Post</h4>
                    <p>MP4, WebM or MOV (9:16 vertical recommended)</p>
                    <span className="dropzone-btn">Browse Files</span>
                  </div>
                )}
              </div>

              {/* Right Column: Metadata Form */}
              <div className="studio-meta-col">
                <div className="form-group">
                  <label>
                    <Sparkles size={14} style={{ color: '#ff2d55' }} /> Caption & Description
                  </label>
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
                  <label>
                    <Music size={14} style={{ color: '#00f2fe' }} /> Sound / Track Title
                  </label>
                  <input
                    type="text"
                    value={soundTitle}
                    onChange={(e) => setSoundTitle(e.target.value)}
                    placeholder="Original Audio - @username"
                    className="studio-input"
                  />
                </div>

                <div className="form-group">
                  <label>
                    <Hash size={14} style={{ color: '#9b51e0' }} /> Hashtags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="fyp, trending, creative"
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
          <form onSubmit={handlePublish} className="studio-body">
            <div className="studio-content-layout">
              {/* Left Column: Live Viewfinder or Recorded Preview */}
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

                    {/* Camera Recording Overlay Bar */}
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

              {/* Right Column: Metadata Form */}
              <div className="studio-meta-col">
                <div className="form-group">
                  <label>
                    <Sparkles size={14} style={{ color: '#ff2d55' }} /> Caption & Description
                  </label>
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
                  <label>
                    <Music size={14} style={{ color: '#00f2fe' }} /> Sound / Track Title
                  </label>
                  <input
                    type="text"
                    value={soundTitle}
                    onChange={(e) => setSoundTitle(e.target.value)}
                    placeholder="Live Camera Audio"
                    className="studio-input"
                  />
                </div>

                <div className="form-group">
                  <label>
                    <Hash size={14} style={{ color: '#9b51e0' }} /> Hashtags
                  </label>
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
          <div className="studio-body">
            {userClips.length === 0 ? (
              <div className="empty-clips-view">
                <VideoIcon size={40} color="rgba(255,255,255,0.3)" />
                <h4>No Clips Published Yet</h4>
                <p>Use the Upload or Record tabs above to share your first video!</p>
                <button
                  type="button"
                  onClick={() => handleTabChange('upload')}
                  className="dropzone-btn"
                  style={{ marginTop: '12px' }}
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
    </div>
  );
};
