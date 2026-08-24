import { Video, Comment, User } from '@/types';

/**
 * Fallback Mock Data
 * Used automatically if backend server is not connected or in local preview mode.
 * Your backend teammate can replace this by connecting their database and endpoints!
 */

export const MOCK_CURRENT_USER: User = {
  id: 'usr_guest_01',
  username: 'antigravity_dev',
  name: 'Dev Explorer',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
};

export const INITIAL_VIDEOS: Video[] = [
  {
    id: 'vid_001',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    description: 'Neon synthwave vibes in the cyber city 🌃✨ Built with Next.js + TypeScript! Drop a like if you love clean code.',
    tags: ['cyberpunk', 'synthwave', 'coding', 'nextjs'],
    soundTitle: 'Retro Future Beats - Cyber City Original Mix',
    creator: {
      id: 'usr_sarah_cyber',
      username: 'sarah_codes',
      name: 'Sarah Cyber',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      isFollowing: false,
      followerCount: 24500,
    },
    likeCount: 4230,
    isLiked: false,
    commentCount: 184,
    shareCount: 520,
    downloadUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    createdAt: '2 hours ago',
  },
  {
    id: 'vid_002',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    description: 'Exploring hidden waterfalls and misty mountain trails 🌲💧 Who wants to hike here next weekend?',
    tags: ['nature', 'wanderlust', 'adventure', 'travel'],
    soundTitle: 'Ambient Nature Echoes - Acoustic Travel',
    creator: {
      id: 'usr_alex_travel',
      username: 'alex_outdoors',
      name: 'Alex Rivera',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      isFollowing: true,
      followerCount: 189000,
    },
    likeCount: 12450,
    isLiked: false,
    commentCount: 432,
    shareCount: 1290,
    downloadUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    createdAt: '1 day ago',
  },
  {
    id: 'vid_003',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    description: 'Late night live studio session jamming on guitar chords 🎸🔥 High energy short clips ready for full screen zoom!',
    tags: ['music', 'guitar', 'livejam', 'studio'],
    soundTitle: 'Electric Groove Jam #4 - Studio Live Sessions',
    creator: {
      id: 'usr_leo_music',
      username: 'leojams',
      name: 'Leo Chen',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      isFollowing: false,
      followerCount: 56200,
    },
    likeCount: 8840,
    isLiked: false,
    commentCount: 310,
    shareCount: 670,
    downloadUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    createdAt: '3 days ago',
  },
  {
    id: 'vid_004',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    description: 'Electric festival atmosphere! Lighting, lasers, and crowd energy ✨🎉 Turn up the sound!',
    tags: ['festival', 'party', 'edm', 'vibes'],
    soundTitle: 'Midnight Drop - Mainstage Festival Mix',
    creator: {
      id: 'usr_elena_fest',
      username: 'elena_dj',
      name: 'Elena V',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      isFollowing: false,
      followerCount: 78300,
    },
    likeCount: 15300,
    isLiked: false,
    commentCount: 620,
    shareCount: 2100,
    downloadUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    createdAt: '4 days ago',
  },
];

export const MOCK_COMMENTS: Record<string, Comment[]> = {
  vid_001: [
    {
      id: 'cmt_001',
      videoId: 'vid_001',
      user: {
        id: 'usr_kai',
        username: 'kai_coder',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      },
      text: 'The 50% centered video layout with dark backdrop is so sleek! 🔥',
      createdAt: '15m ago',
      likeCount: 34,
      isLiked: false,
    },
    {
      id: 'cmt_002',
      videoId: 'vid_001',
      user: {
        id: 'usr_devina',
        username: 'devina_ui',
        avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      },
      text: 'Loving the smooth transitions and zoom view! Ready for backend connection.',
      createdAt: '1 hour ago',
      likeCount: 12,
      isLiked: false,
    },
  ],
  vid_002: [
    {
      id: 'cmt_003',
      videoId: 'vid_002',
      user: {
        id: 'usr_hiker',
        username: 'trail_walker',
        avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
      },
      text: 'Where was this shot? The waterfall is breathtaking!',
      createdAt: '3 hours ago',
      likeCount: 8,
      isLiked: false,
    },
  ],
};
