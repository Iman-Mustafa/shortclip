# 🎬 ShortClip Frontend (Next.js + TypeScript)

A modern, high-performance short-clip video feed web application featuring a centered 50% video layout, engagement controls (Like, Comment, Share, Download), sender profile overlay, zoom theater mode, and authentication gating.

---

## 🛠️ Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Vanilla CSS Design System with Glassmorphism & Micro-animations
- **Icons**: Lucide React

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file (or copy `.env.example`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_USE_MOCK_FALLBACK=true
```

> **Note for Backend Developer**: Set `NEXT_PUBLIC_USE_MOCK_FALLBACK=false` once your backend server is up and running.

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3005](http://localhost:3005) in your browser.

---

## 🔌 Backend API Integration Guide (For Backend Colleague)

All API requests pass through `src/lib/api/client.ts` which automatically attaches the `Authorization: Bearer <token>` header stored upon user login/registration.

### 1. Authentication Endpoints

#### Register
- **Endpoint**: `POST /auth/register`
- **Payload**:
  ```json
  {
    "username": "johndoe",
    "password": "secretpassword",
    "confirmPassword": "secretpassword"
  }
  ```
- **Response**:
  ```json
  {
    "user": {
      "id": "usr_123",
      "username": "johndoe",
      "avatarUrl": "https://...",
      "bio": "Creator bio"
    },
    "token": "jwt_token_here"
  }
  ```

#### Login
- **Endpoint**: `POST /auth/login`
- **Payload**:
  ```json
  {
    "username": "johndoe",
    "password": "secretpassword"
  }
  ```
- **Response**: Same as Register response.

#### Get Current User
- **Endpoint**: `GET /auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
  ```json
  {
    "user": {
      "id": "usr_123",
      "username": "johndoe",
      "avatarUrl": "https://..."
    }
  }
  ```

---

### 2. Video Feed & Interaction Endpoints

#### Video Feed
- **Endpoint**: `GET /videos?cursor=<cursor>&limit=10`
- **Response**:
  ```json
  {
    "videos": [
      {
        "id": "vid_001",
        "videoUrl": "https://cdn.example.com/video1.mp4",
        "thumbnailUrl": "https://cdn.example.com/thumb1.jpg",
        "description": "Short clip caption with #tags",
        "tags": ["trending", "music"],
        "soundTitle": "Artist - Song Name",
        "creator": {
          "id": "usr_creator1",
          "username": "creator_name",
          "avatarUrl": "https://...",
          "isFollowing": false,
          "followerCount": 1200
        },
        "likeCount": 432,
        "isLiked": false,
        "commentCount": 24,
        "shareCount": 50,
        "downloadUrl": "https://cdn.example.com/video1.mp4",
        "createdAt": "2026-08-24T12:00:00Z"
      }
    ],
    "nextCursor": "cursor_for_next_page",
    "hasMore": true
  }
  ```

#### Like / Unlike Video
- **Endpoint**: `POST /videos/:id/like`
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
  ```json
  {
    "videoId": "vid_001",
    "isLiked": true,
    "likeCount": 433
  }
  ```

#### Get Comments
- **Endpoint**: `GET /videos/:id/comments`
- **Response**:
  ```json
  {
    "comments": [
      {
        "id": "cmt_001",
        "videoId": "vid_001",
        "user": {
          "id": "usr_123",
          "username": "johndoe",
          "avatarUrl": "https://..."
        },
        "text": "Great clip!",
        "createdAt": "5m ago"
      }
    ]
  }
  ```

#### Post Comment
- **Endpoint**: `POST /videos/:id/comments`
- **Headers**: `Authorization: Bearer <token>`
- **Payload**:
  ```json
  {
    "text": "My awesome comment"
  }
  ```
- **Response**:
  ```json
  {
    "comment": {
      "id": "cmt_002",
      "videoId": "vid_001",
      "user": { ... },
      "text": "My awesome comment",
      "createdAt": "Just now"
    }
  }
  ```

#### Share Video
- **Endpoint**: `POST /videos/:id/share`
- **Response**:
  ```json
  {
    "shareCount": 51
  }
  ```

#### Follow User
- **Endpoint**: `POST /users/:id/follow`
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
  ```json
  {
    "userId": "usr_creator1",
    "isFollowing": true
  }
  ```

---

## 📱 Features Implemented
- 50% centered viewport layout on desktop with ambient responsive glow
- Full background video playback with `IntersectionObserver` auto-play/pause
- Top-right Zoom / Theater button
- Sender profile overlay (avatar, @username, Follow action, caption, #hashtags, audio ticker)
- Bottom action bar with **Like**, **Comment**, **Share**, and **Download**
- Registration/Login modal requiring **Username**, **Password**, and **Confirm Password** before liking or commenting
- Double-tap on video to like with heart burst particle animation
- Fully typed TypeScript data layer & pluggable backend API client
