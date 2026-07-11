export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  durationSec: number;
  coverUrl: string;
  audioUrl: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverUrl: string;
  trackIds: string[];
}

export const MOCK_TRACKS: Track[] = [
  {
    id: "1",
    title: "Midnight City",
    artist: "M83",
    album: "Hurry Up, We're Dreaming",
    duration: "4:03",
    durationSec: 243,
    coverUrl: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=250&auto=format&fit=crop",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  },
  {
    id: "2",
    title: "Starboy",
    artist: "The Weeknd",
    album: "Starboy",
    duration: "3:50",
    durationSec: 230,
    coverUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=250&auto=format&fit=crop",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  },
  {
    id: "3",
    title: "Lost in Yesterday",
    artist: "Tame Impala",
    album: "The Slow Rush",
    duration: "4:10",
    durationSec: 250,
    coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=250&auto=format&fit=crop",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  },
  {
    id: "4",
    title: "Teardrop",
    artist: "Massive Attack",
    album: "Mezzanine",
    duration: "5:31",
    durationSec: 331,
    coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=250&auto=format&fit=crop",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
  },
  {
    id: "5",
    title: "After Hours",
    artist: "The Weeknd",
    album: "After Hours",
    duration: "6:01",
    durationSec: 361,
    coverUrl: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=250&auto=format&fit=crop",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
  },
  {
    id: "6",
    title: "Currents",
    artist: "Tame Impala",
    album: "Currents",
    duration: "3:35",
    durationSec: 215,
    coverUrl: "https://images.unsplash.com/photo-1487180142328-0c4e37023af5?q=80&w=250&auto=format&fit=crop",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
  },
  {
    id: "7",
    title: "Ambient Works",
    artist: "Aphex Twin",
    album: "Selected Ambient Works",
    duration: "4:45",
    durationSec: 285,
    coverUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=250&auto=format&fit=crop",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
  },
  {
    id: "8",
    title: "Folklore",
    artist: "Taylor Swift",
    album: "Folklore",
    duration: "3:58",
    durationSec: 238,
    coverUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=250&auto=format&fit=crop",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
  },
  {
    id: "9",
    title: "Blue Lines",
    artist: "Massive Attack",
    album: "Blue Lines",
    duration: "4:18",
    durationSec: 258,
    coverUrl: "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=250&auto=format&fit=crop",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
  }
];

export const MOCK_PLAYLISTS: Playlist[] = [
  {
    id: "playlist-1",
    name: "Late Night Grooves",
    description: "Sultry rhythms and smooth melodies to accompany your nocturnal journey. Curated for the restless dreamers.",
    coverUrl: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=600&auto=format&fit=crop",
    trackIds: ["1", "3", "4", "5"],
  },
  {
    id: "playlist-2",
    name: "Chill Instrumental",
    description: "Relax and focus with ambient textures and lo-fi beats.",
    coverUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=250&auto=format&fit=crop",
    trackIds: ["6", "7"],
  },
  {
    id: "playlist-3",
    name: "Techno Pulse",
    description: "High-energy driving electronic rhythms for workout or dance.",
    coverUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=250&auto=format&fit=crop",
    trackIds: ["2", "9"],
  },
  {
    id: "playlist-4",
    name: "Golden Era Hip Hop",
    description: "Classic boom-bap, warm samples, and iconic flows from the golden age.",
    coverUrl: "https://images.unsplash.com/photo-1484755560695-a4c7487215a3?q=80&w=250&auto=format&fit=crop",
    trackIds: ["8"],
  }
];
