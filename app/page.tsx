"use client"

import { useState, useEffect, useRef } from "react"
import { useTheme } from "next-themes"
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  Maximize2,
  Heart,
  Search as SearchIcon,
  Home as HomeIcon,
  Library as LibraryIcon,
  Music,
  Bell,
  ChevronLeft,
  ChevronRight,
  Clock,
  ListMusic,
  Plus,
  Moon,
  Sun,
  Check,
  Disc,
  Info,
  Headphones
} from "lucide-react"
import { MOCK_TRACKS, MOCK_PLAYLISTS, Track, Playlist } from "@/lib/audio"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu"

export default function Page() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Navigation State
  const [activeTab, setActiveTab] = useState<"home" | "search" | "library" | "liked" | "playlist-detail">("home")
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null)
  
  // Search State
  const [searchQuery, setSearchQuery] = useState("")

  // Playlists State
  const [playlists, setPlaylists] = useState<Playlist[]>(MOCK_PLAYLISTS)
  const [likedTrackIds, setLikedTrackIds] = useState<string[]>(["1", "3", "4"])

  // Audio Playback State
  const [currentTrack, setCurrentTrack] = useState<Track>(MOCK_TRACKS[0])
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(MOCK_TRACKS[0].durationSec)
  const [volume, setVolume] = useState(0.7)
  const [isMuted, setIsMuted] = useState(false)
  const [isShuffle, setIsShuffle] = useState(false)
  const [isRepeat, setIsRepeat] = useState(false)

  // References
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Prevent Hydration mismatch
  useEffect(() => {
    setMounted(true)
    audioRef.current = new Audio()
    audioRef.current.src = currentTrack.audioUrl
    audioRef.current.volume = volume

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ""
      }
    }
  }, [])

  // Sync track changes
  useEffect(() => {
    if (!audioRef.current || !mounted) return

    const wasPlaying = isPlaying
    audioRef.current.src = currentTrack.audioUrl
    audioRef.current.load()
    
    // Sync current time and duration
    setCurrentTime(0)
    setDuration(currentTrack.durationSec)

    if (wasPlaying) {
      audioRef.current.play().catch(err => {
        console.error("Audio playback error:", err)
        setIsPlaying(false)
      })
    }
  }, [currentTrack])

  // Sync audio play/pause status
  useEffect(() => {
    if (!audioRef.current || !mounted) return

    if (isPlaying) {
      audioRef.current.play().catch(err => {
        console.error("Audio play failed:", err)
        setIsPlaying(false)
      })
    } else {
      audioRef.current.pause()
    }
  }, [isPlaying])

  // Sync volume and mute state
  useEffect(() => {
    if (!audioRef.current || !mounted) return
    audioRef.current.volume = isMuted ? 0 : volume
  }, [volume, isMuted])

  // Event Listeners for Audio
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleDurationChange = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration)
      }
    }

    const handleEnded = () => {
      if (isRepeat) {
        audio.currentTime = 0
        audio.play().catch(err => console.log(err))
      } else {
        handleNextTrack()
      }
    }

    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("durationchange", handleDurationChange)
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("durationchange", handleDurationChange)
      audio.removeEventListener("ended", handleEnded)
    }
  }, [currentTrack, isShuffle, isRepeat])

  // Playback Control Handlers
  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  const handlePlayTrack = (track: Track) => {
    if (currentTrack.id === track.id) {
      handleTogglePlay()
    } else {
      setCurrentTrack(track)
      setIsPlaying(true)
    }
  }

  const handleNextTrack = () => {
    let nextIndex = 0
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * MOCK_TRACKS.length)
    } else {
      const currentIndex = MOCK_TRACKS.findIndex(t => t.id === currentTrack.id)
      nextIndex = (currentIndex + 1) % MOCK_TRACKS.length
    }
    setCurrentTrack(MOCK_TRACKS[nextIndex])
  }

  const handlePrevTrack = () => {
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0
      setCurrentTime(0)
    } else {
      const currentIndex = MOCK_TRACKS.findIndex(t => t.id === currentTrack.id)
      const prevIndex = currentIndex === 0 ? MOCK_TRACKS.length - 1 : currentIndex - 1
      setCurrentTrack(MOCK_TRACKS[prevIndex])
    }
  }

  const handleVolumeChange = (val: number) => {
    setVolume(val)
    if (val > 0) {
      setIsMuted(false)
    }
  }

  const handleToggleMute = () => {
    setIsMuted(!isMuted)
  }

  const handleToggleLike = (trackId: string) => {
    if (likedTrackIds.includes(trackId)) {
      setLikedTrackIds(likedTrackIds.filter(id => id !== trackId))
    } else {
      setLikedTrackIds([...likedTrackIds, trackId])
    }
  }

  const handleCreatePlaylist = () => {
    const newPlaylistId = `playlist-${playlists.length + 1}`
    const newPlaylist: Playlist = {
      id: newPlaylistId,
      name: `My Vibe Mix #${playlists.length + 1}`,
      description: "A customized collection of your favorite sync vibes.",
      coverUrl: "https://images.unsplash.com/photo-1494232410401-ad00d5433cfa?q=80&w=250&auto=format&fit=crop",
      trackIds: ["1", "3", "7"]
    }
    setPlaylists([...playlists, newPlaylist])
    setSelectedPlaylistId(newPlaylistId)
    setActiveTab("playlist-detail")
  }

  const selectPlaylist = (id: string) => {
    setSelectedPlaylistId(id)
    setActiveTab("playlist-detail")
  }

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00"
    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  if (!mounted) return null

  // Derived playlists or items based on selections
  const currentPlaylist = playlists.find(p => p.id === selectedPlaylistId)
  const currentPlaylistTracks = currentPlaylist 
    ? MOCK_TRACKS.filter(t => currentPlaylist.trackIds.includes(t.id))
    : []

  const likedTracks = MOCK_TRACKS.filter(t => likedTrackIds.includes(t.id))

  // Filtered tracks for search tab
  const filteredTracks = MOCK_TRACKS.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.album.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans select-none antialiased">
      {/* 1. Left Sidebar */}
      <aside className="w-[280px] bg-card/60 backdrop-blur-lg border-r border-border/40 flex flex-col py-6 px-4 shrink-0 hidden md:flex">
        {/* Brand Name */}
        <div className="px-4 mb-8 flex items-center justify-between">
          <h1 className="font-serif text-3xl font-bold text-primary tracking-tight">VibeSync</h1>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-primary/20 text-primary rounded-full">
            Beta
          </span>
        </div>

        {/* Navigation Section */}
        <div className="space-y-1 mb-6">
          <button
            onClick={() => setActiveTab("home")}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === "home"
                ? "bg-primary/10 text-primary font-bold border-l-4 border-primary pl-3"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <HomeIcon size={20} />
            <span>Home</span>
          </button>
          <button
            onClick={() => setActiveTab("search")}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === "search"
                ? "bg-primary/10 text-primary font-bold border-l-4 border-primary pl-3"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <SearchIcon size={20} />
            <span>Search</span>
          </button>
          <button
            onClick={() => setActiveTab("library")}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === "library"
                ? "bg-primary/10 text-primary font-bold border-l-4 border-primary pl-3"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <LibraryIcon size={20} />
            <span>Your Library</span>
          </button>
          <button
            onClick={() => setActiveTab("liked")}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === "liked"
                ? "bg-primary/10 text-primary font-bold border-l-4 border-primary pl-3"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <Heart size={20} className={likedTrackIds.length > 0 ? "fill-primary text-primary" : ""} />
            <span>Liked Songs</span>
            {likedTrackIds.length > 0 && (
              <span className="ml-auto text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">
                {likedTrackIds.length}
              </span>
            )}
          </button>
        </div>

        {/* Playlists Header */}
        <div className="px-4 py-2 border-t border-border/30 flex items-center justify-between mt-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Playlists</span>
          <button 
            onClick={handleCreatePlaylist}
            className="text-muted-foreground hover:text-primary transition-colors p-1 rounded-full hover:bg-muted"
            title="Create Playlist"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Playlists Navigation List */}
        <ScrollArea className="flex-1 -mx-2 px-2 mt-2">
          <div className="space-y-1 pr-1 pb-4">
            {playlists.map(playlist => (
              <button
                key={playlist.id}
                onClick={() => selectPlaylist(playlist.id)}
                className={`w-full text-left px-4 py-2.5 rounded-md text-sm truncate flex items-center gap-3 transition-colors ${
                  activeTab === "playlist-detail" && selectedPlaylistId === playlist.id
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
              >
                <div className="w-8 h-8 rounded overflow-hidden bg-muted flex-shrink-0">
                  <img src={playlist.coverUrl} alt={playlist.name} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{playlist.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{playlist.trackIds.length} tracks</p>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>

        {/* Tiny Info / Current Cover Art block in Sidebar */}
        <div className="mt-auto pt-4 border-t border-border/30">
          <div className="rounded-xl overflow-hidden aspect-square w-full relative group">
            <img 
              src={currentTrack.coverUrl} 
              alt={currentTrack.title} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
              <p className="text-white text-xs font-bold truncate">{currentTrack.title}</p>
              <p className="text-gray-300 text-[11px] truncate">{currentTrack.artist}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. Main Content Container */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen relative pb-[120px] bg-background">
        
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between px-6 md:px-8 h-16 bg-background/80 backdrop-blur-md border-b border-border/10">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex gap-2">
              <button 
                onClick={() => setActiveTab("home")}
                className="w-8 h-8 rounded-full bg-card border border-border/30 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
                title="Back to Home"
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                className="w-8 h-8 rounded-full bg-card border border-border/30 flex items-center justify-center text-muted-foreground cursor-not-allowed opacity-50"
                disabled
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Dynamic Contextual Search Input */}
            <div className="relative w-full max-w-md ml-2">
              <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder={
                  activeTab === "liked" 
                    ? "Search in Liked Songs..." 
                    : activeTab === "playlist-detail" 
                      ? "Search in this playlist..."
                      : "Search for songs, artists, or albums..."
                }
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  if (activeTab !== "search" && activeTab !== "liked" && activeTab !== "playlist-detail") {
                    setActiveTab("search")
                  }
                }}
                className="w-full bg-card border border-border/30 rounded-full py-1.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground/60 transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground font-bold"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* User Controls & Theme Toggles */}
          <div className="flex items-center gap-4">
            {/* Quick stats on top */}
            <span className="text-xs text-muted-foreground hidden lg:inline-flex items-center gap-1.5">
              <Headphones size={13} className="text-primary animate-pulse" />
              <span>Playing {currentTrack.title}</span>
            </span>

            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="p-2 rounded-full border border-border/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
              title="Toggle Dark Mode (Hotkey: D)"
            >
              {resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* User Profile Info with Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 border border-border/40 bg-card/40 hover:bg-card/70 rounded-full p-1 pr-3 cursor-pointer transition-colors">
                  <Avatar className="size-7">
                    <AvatarImage src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop" alt="Elena S." />
                    <AvatarFallback>ES</AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-semibold hidden sm:inline">Elena S.</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-card border border-border shadow-lg">
                <DropdownMenuLabel className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">My Account</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/40" />
                <DropdownMenuItem onClick={() => setActiveTab("library")} className="cursor-pointer hover:bg-muted focus:bg-muted">
                  Your Library
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("liked")} className="cursor-pointer hover:bg-muted focus:bg-muted">
                  Liked Songs ({likedTrackIds.length})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} className="cursor-pointer hover:bg-muted focus:bg-muted">
                  Toggle Dark Mode
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border/40" />
                <DropdownMenuItem className="cursor-pointer text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive">
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* 3. Main Dashboard Layout Panels (Switchable Views) */}
        <div className="px-6 md:px-8 py-6">

          {/* ================= VIEW: HOME ================= */}
          {activeTab === "home" && (
            <div className="space-y-10 animate-in fade-in duration-300">
              
              {/* Premium Featured Playlist Hero Banner */}
              <section className="relative h-[320px] rounded-2xl overflow-hidden group border border-border/10 shadow-xl">
                <div className="absolute inset-0 z-0">
                  <img 
                    src="https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=1200&auto=format&fit=crop" 
                    alt="Late Night Grooves" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-103"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/60 to-transparent"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
                </div>

                <div className="absolute inset-y-0 left-0 flex flex-col justify-center p-8 md:p-12 z-10 space-y-4 max-w-2xl">
                  <span className="inline-flex self-start px-2.5 py-1 bg-primary/20 text-primary border border-primary/30 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                    Featured Vibe
                  </span>
                  <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground leading-tight">
                    Late Night Grooves
                  </h2>
                  <p className="text-muted-foreground text-sm md:text-base max-w-lg leading-relaxed">
                    Sultry rhythms and smooth melodies to accompany your nocturnal journey. Curated for the restless dreamers.
                  </p>
                  
                  <div className="flex items-center gap-6 pt-2">
                    <Button 
                      onClick={() => selectPlaylist("playlist-1")} 
                      className="bg-primary hover:bg-primary/90 text-white rounded-full px-6 py-5 flex items-center gap-2.5 text-sm font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      <Play size={16} fill="white" />
                      View Playlist
                    </Button>
                    <span className="text-xs text-muted-foreground font-semibold">
                      1,240,503 followers
                    </span>
                  </div>
                </div>
              </section>

              {/* Grid: Recently Played */}
              <section>
                <div className="flex justify-between items-end mb-5">
                  <h3 className="font-serif text-2xl font-semibold tracking-tight">Recently Played</h3>
                  <button 
                    onClick={() => setActiveTab("library")} 
                    className="text-primary text-xs font-semibold hover:underline"
                  >
                    View all
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                  {MOCK_TRACKS.slice(0, 6).map((track) => (
                    <div 
                      key={track.id} 
                      onClick={() => handlePlayTrack(track)}
                      className="bg-card/40 hover:bg-card/90 border border-border/20 rounded-xl p-3 flex flex-col group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 relative"
                    >
                      <div className="relative aspect-square rounded-lg overflow-hidden mb-3 bg-muted border border-border/15">
                        <img 
                          src={track.coverUrl} 
                          alt={track.title} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                          <div className="bg-primary hover:bg-primary/95 text-white w-11 h-11 rounded-full flex items-center justify-center transform translate-y-3 group-hover:translate-y-0 transition-all duration-300 shadow-md">
                            {currentTrack.id === track.id && isPlaying ? (
                              <Pause size={18} fill="white" />
                            ) : (
                              <Play size={18} className="ml-0.5" fill="white" />
                            )}
                          </div>
                        </div>
                      </div>
                      <h4 className="text-sm font-semibold truncate font-serif text-foreground">{track.title}</h4>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{track.artist}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Table / Grid Combined: Made for you & Top Tracks */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column: Top Tracks Table */}
                <div className="lg:col-span-2 space-y-5">
                  <div className="flex justify-between items-end">
                    <h3 className="font-serif text-2xl font-semibold tracking-tight">Top Tracks This Week</h3>
                  </div>

                  <div className="bg-card/30 border border-border/25 rounded-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-muted-foreground text-xs uppercase tracking-wider border-b border-border/10">
                          <th className="px-5 py-3.5 font-semibold w-12 text-center">#</th>
                          <th className="px-5 py-3.5 font-semibold">Title</th>
                          <th className="px-5 py-3.5 font-semibold hidden sm:table-cell">Album</th>
                          <th className="px-5 py-3.5 font-semibold text-right"><Clock size={14} className="ml-auto" /></th>
                          <th className="px-4 py-3.5 w-12"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {MOCK_TRACKS.slice(0, 5).map((track, idx) => {
                          const isCurrent = currentTrack.id === track.id
                          return (
                            <tr 
                              key={track.id}
                              className={`group hover:bg-muted/50 border-b border-border/5 transition-colors cursor-pointer ${
                                isCurrent ? "bg-primary/5" : ""
                              }`}
                            >
                              <td className="px-5 py-3 text-center text-sm font-semibold">
                                <span className={`group-hover:hidden ${isCurrent ? "text-primary font-bold" : "text-muted-foreground"}`}>
                                  {idx + 1}
                                </span>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handlePlayTrack(track); }}
                                  className="hidden group-hover:inline-flex text-primary hover:scale-110 active:scale-95 transition-all w-full justify-center"
                                >
                                  {isCurrent && isPlaying ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}
                                </button>
                              </td>
                              <td className="px-5 py-3" onClick={() => handlePlayTrack(track)}>
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded overflow-hidden bg-muted flex-shrink-0 border border-border/10">
                                    <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className={`text-sm font-semibold truncate ${isCurrent ? "text-primary font-bold" : "text-foreground"}`}>
                                      {track.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-sm text-muted-foreground hidden sm:table-cell" onClick={() => handlePlayTrack(track)}>
                                <span className="truncate max-w-[180px] block">{track.album}</span>
                              </td>
                              <td className="px-5 py-3 text-sm text-muted-foreground text-right" onClick={() => handlePlayTrack(track)}>
                                {track.duration}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleToggleLike(track.id); }}
                                  className={`opacity-0 group-hover:opacity-100 transition-opacity hover:scale-115 active:scale-95 ${
                                    likedTrackIds.includes(track.id) ? "opacity-100 text-primary" : "text-muted-foreground hover:text-foreground"
                                  }`}
                                >
                                  <Heart size={15} className={likedTrackIds.includes(track.id) ? "fill-primary text-primary" : ""} />
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right Column: Featured Playlists Grid */}
                <div className="space-y-5">
                  <h3 className="font-serif text-2xl font-semibold tracking-tight">Vibe Playlists</h3>
                  <div className="space-y-4">
                    {playlists.map((playlist) => (
                      <div 
                        key={playlist.id}
                        onClick={() => selectPlaylist(playlist.id)}
                        className="flex items-center gap-4 p-3 bg-card/35 hover:bg-card/85 border border-border/20 rounded-xl cursor-pointer transition-all duration-200 group"
                      >
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0 relative">
                          <img src={playlist.coverUrl} alt={playlist.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Play size={16} fill="white" className="text-white translate-y-1 group-hover:translate-y-0 transition-transform" />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                            {playlist.name}
                          </h4>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
                            {playlist.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ================= VIEW: SEARCH ================= */}
          {activeTab === "search" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h3 className="font-serif text-3xl font-semibold tracking-tight">Search</h3>
                <p className="text-sm text-muted-foreground mt-1">Explore and find tracks by title, artist, or album</p>
              </div>

              {/* Show results if query exists */}
              {searchQuery ? (
                <div className="space-y-6">
                  <h4 className="text-lg font-bold text-foreground">Showing results for &ldquo;{searchQuery}&rdquo;</h4>
                  
                  {filteredTracks.length > 0 ? (
                    <div className="bg-card/30 border border-border/25 rounded-2xl overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="text-muted-foreground text-xs uppercase border-b border-border/10">
                            <th className="px-5 py-3 w-12 text-center">#</th>
                            <th className="px-5 py-3">Title</th>
                            <th className="px-5 py-3">Album</th>
                            <th className="px-5 py-3 text-right"><Clock size={14} className="ml-auto" /></th>
                            <th className="px-4 py-3 w-12"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTracks.map((track, idx) => {
                            const isCurrent = currentTrack.id === track.id
                            return (
                              <tr 
                                key={track.id}
                                className={`group hover:bg-muted/50 border-b border-border/5 transition-colors cursor-pointer ${
                                  isCurrent ? "bg-primary/5" : ""
                                }`}
                              >
                                <td className="px-5 py-3 text-center text-sm font-semibold">
                                  <span className="group-hover:hidden text-muted-foreground">{idx + 1}</span>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handlePlayTrack(track); }}
                                    className="hidden group-hover:inline text-primary"
                                  >
                                    {isCurrent && isPlaying ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}
                                  </button>
                                </td>
                                <td className="px-5 py-3" onClick={() => handlePlayTrack(track)}>
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded overflow-hidden bg-muted flex-shrink-0">
                                      <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                      <p className={`text-sm font-semibold truncate ${isCurrent ? "text-primary" : "text-foreground"}`}>
                                        {track.title}
                                      </p>
                                      <p className="text-xs text-muted-foreground">{track.artist}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-5 py-3 text-sm text-muted-foreground" onClick={() => handlePlayTrack(track)}>
                                  {track.album}
                                </td>
                                <td className="px-5 py-3 text-sm text-muted-foreground text-right" onClick={() => handlePlayTrack(track)}>
                                  {track.duration}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleToggleLike(track.id); }}
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                  >
                                    <Heart size={15} className={likedTrackIds.includes(track.id) ? "fill-primary text-primary" : ""} />
                                  </button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-20 text-center text-muted-foreground space-y-2">
                      <Music size={40} className="mx-auto text-muted-foreground/35 mb-2" />
                      <p className="text-base font-medium">No results found</p>
                      <p className="text-xs">Check spelling or search for another keyword</p>
                    </div>
                  )}
                </div>
              ) : (
                /* Search Categories (Genres) */
                <div className="space-y-6">
                  <h4 className="text-lg font-bold">Browse All Categories</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    
                    {/* Chill Out */}
                    <div 
                      onClick={() => setSearchQuery("Tame Impala")}
                      className="aspect-square rounded-2xl p-5 bg-gradient-to-br from-indigo-900 to-indigo-700 flex flex-col justify-between cursor-pointer relative overflow-hidden group shadow-lg"
                    >
                      <h5 className="font-serif text-lg font-bold text-white z-10">Chill Out</h5>
                      <Disc size={64} className="absolute -bottom-4 -right-4 text-white/10 group-hover:scale-115 group-hover:rotate-45 transition-transform duration-500" />
                    </div>

                    {/* Electronic Mix */}
                    <div 
                      onClick={() => setSearchQuery("M83")}
                      className="aspect-square rounded-2xl p-5 bg-gradient-to-br from-emerald-900 to-emerald-700 flex flex-col justify-between cursor-pointer relative overflow-hidden group shadow-lg"
                    >
                      <h5 className="font-serif text-lg font-bold text-white z-10">Electronic</h5>
                      <Disc size={64} className="absolute -bottom-4 -right-4 text-white/10 group-hover:scale-115 group-hover:rotate-45 transition-transform duration-500" />
                    </div>

                    {/* Pop Vibe */}
                    <div 
                      onClick={() => setSearchQuery("The Weeknd")}
                      className="aspect-square rounded-2xl p-5 bg-gradient-to-br from-rose-900 to-rose-700 flex flex-col justify-between cursor-pointer relative overflow-hidden group shadow-lg"
                    >
                      <h5 className="font-serif text-lg font-bold text-white z-10">Pop Mix</h5>
                      <Disc size={64} className="absolute -bottom-4 -right-4 text-white/10 group-hover:scale-115 group-hover:rotate-45 transition-transform duration-500" />
                    </div>

                    {/* Ambient / Study */}
                    <div 
                      onClick={() => setSearchQuery("Aphex Twin")}
                      className="aspect-square rounded-2xl p-5 bg-gradient-to-br from-amber-900 to-amber-700 flex flex-col justify-between cursor-pointer relative overflow-hidden group shadow-lg"
                    >
                      <h5 className="font-serif text-lg font-bold text-white z-10">Ambient Focus</h5>
                      <Disc size={64} className="absolute -bottom-4 -right-4 text-white/10 group-hover:scale-115 group-hover:rotate-45 transition-transform duration-500" />
                    </div>

                    {/* Trip Hop */}
                    <div 
                      onClick={() => setSearchQuery("Massive Attack")}
                      className="aspect-square rounded-2xl p-5 bg-gradient-to-br from-purple-900 to-purple-700 flex flex-col justify-between cursor-pointer relative overflow-hidden group shadow-lg"
                    >
                      <h5 className="font-serif text-lg font-bold text-white z-10">Trip Hop</h5>
                      <Disc size={64} className="absolute -bottom-4 -right-4 text-white/10 group-hover:scale-115 group-hover:rotate-45 transition-transform duration-500" />
                    </div>

                    {/* Folk & Acoustic */}
                    <div 
                      onClick={() => setSearchQuery("Taylor Swift")}
                      className="aspect-square rounded-2xl p-5 bg-gradient-to-br from-teal-900 to-teal-700 flex flex-col justify-between cursor-pointer relative overflow-hidden group shadow-lg"
                    >
                      <h5 className="font-serif text-lg font-bold text-white z-10">Acoustic</h5>
                      <Disc size={64} className="absolute -bottom-4 -right-4 text-white/10 group-hover:scale-115 group-hover:rotate-45 transition-transform duration-500" />
                    </div>

                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= VIEW: LIBRARY ================= */}
          {activeTab === "library" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-serif text-3xl font-semibold tracking-tight">Your Library</h3>
                  <p className="text-sm text-muted-foreground mt-1">Browse, organize, and create custom music collections</p>
                </div>
                <Button 
                  onClick={handleCreatePlaylist}
                  className="bg-primary hover:bg-primary/95 text-white flex items-center gap-2 rounded-full cursor-pointer px-5"
                >
                  <Plus size={16} />
                  Create Playlist
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* Special Liked Playlist Card */}
                <div 
                  onClick={() => setActiveTab("liked")}
                  className="bg-gradient-to-br from-primary/30 to-primary/90 rounded-2xl p-6 flex flex-col justify-between aspect-video relative overflow-hidden group cursor-pointer border border-primary/20 shadow-lg transition-transform duration-300 hover:-translate-y-1"
                >
                  <div className="flex justify-between">
                    <Heart size={32} fill="white" className="text-white" />
                  </div>
                  <div>
                    <h4 className="font-serif text-2xl font-bold text-white">Liked Songs</h4>
                    <p className="text-white/80 text-xs mt-1.5 font-medium">{likedTrackIds.length} tracks in collection</p>
                  </div>
                </div>

                {/* Playlist Cards */}
                {playlists.map((playlist) => (
                  <div 
                    key={playlist.id}
                    onClick={() => selectPlaylist(playlist.id)}
                    className="bg-card/40 border border-border/20 hover:bg-card/90 rounded-2xl p-4 flex flex-col group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 relative"
                  >
                    <div className="relative aspect-video rounded-xl overflow-hidden mb-4 bg-muted border border-border/15">
                      <img 
                        src={playlist.coverUrl} 
                        alt={playlist.name} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center shadow-md">
                          <Play size={18} fill="white" className="ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <h4 className="text-base font-semibold truncate font-serif text-foreground group-hover:text-primary transition-colors">
                      {playlist.name}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-normal">
                      {playlist.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= VIEW: LIKED SONGS ================= */}
          {activeTab === "liked" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              
              {/* Jumbotron Playlist Header */}
              <div className="flex flex-col sm:flex-row items-end gap-6 pb-6 border-b border-border/10">
                <div className="w-[180px] h-[180px] rounded-2xl bg-gradient-to-br from-primary/30 to-primary/95 flex items-center justify-center flex-shrink-0 shadow-2xl border border-primary/20">
                  <Heart size={72} fill="white" className="text-white" />
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">System Playlist</span>
                  <h2 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight">Liked Songs</h2>
                  <p className="text-sm text-muted-foreground">Your collection of loved and favorited tracks from across VibeSync.</p>
                  <p className="text-xs text-muted-foreground font-semibold pt-1">
                    Elena S. &bull; {likedTracks.length} songs
                  </p>
                </div>
              </div>

              {likedTracks.length > 0 ? (
                <div className="bg-card/30 border border-border/25 rounded-2xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-muted-foreground text-xs uppercase tracking-wider border-b border-border/10">
                        <th className="px-5 py-3.5 w-12 text-center">#</th>
                        <th className="px-5 py-3.5">Title</th>
                        <th className="px-5 py-3.5">Album</th>
                        <th className="px-5 py-3.5 text-right"><Clock size={14} className="ml-auto" /></th>
                        <th className="px-4 py-3.5 w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {likedTracks.map((track, idx) => {
                        const isCurrent = currentTrack.id === track.id
                        return (
                          <tr 
                            key={track.id}
                            className={`group hover:bg-muted/50 border-b border-border/5 transition-colors cursor-pointer ${
                              isCurrent ? "bg-primary/5" : ""
                            }`}
                          >
                            <td className="px-5 py-3.5 text-center text-sm font-semibold">
                              <span className="group-hover:hidden text-muted-foreground">{idx + 1}</span>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handlePlayTrack(track); }}
                                className="hidden group-hover:inline text-primary"
                              >
                                {isCurrent && isPlaying ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}
                              </button>
                            </td>
                            <td className="px-5 py-3.5" onClick={() => handlePlayTrack(track)}>
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded overflow-hidden bg-muted flex-shrink-0">
                                  <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                  <p className={`text-sm font-semibold truncate ${isCurrent ? "text-primary" : "text-foreground"}`}>
                                    {track.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{track.artist}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-sm text-muted-foreground" onClick={() => handlePlayTrack(track)}>
                              {track.album}
                            </td>
                            <td className="px-5 py-3.5 text-sm text-muted-foreground text-right" onClick={() => handlePlayTrack(track)}>
                              {track.duration}
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleToggleLike(track.id); }}
                                className="text-primary hover:scale-110 active:scale-95 transition-transform"
                              >
                                <Heart size={15} className="fill-primary text-primary" />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-24 text-center border border-dashed border-border/40 rounded-2xl space-y-3">
                  <Heart size={44} className="mx-auto text-muted-foreground/35 mb-2" />
                  <p className="text-base font-semibold">No Liked Songs yet</p>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    Songs you heart while listening will automatically display here.
                  </p>
                  <Button 
                    onClick={() => setActiveTab("home")}
                    className="bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary rounded-full px-5 text-xs font-semibold cursor-pointer"
                  >
                    Go Find Songs
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ================= VIEW: PLAYLIST DETAIL ================= */}
          {activeTab === "playlist-detail" && currentPlaylist && (
            <div className="space-y-8 animate-in fade-in duration-300">
              
              {/* Jumbotron Playlist Header */}
              <div className="flex flex-col sm:flex-row items-end gap-6 pb-6 border-b border-border/10">
                <div className="w-[180px] h-[180px] rounded-2xl bg-muted overflow-hidden flex-shrink-0 shadow-2xl border border-border/20 relative group">
                  <img src={currentPlaylist.coverUrl} alt={currentPlaylist.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button 
                      onClick={() => currentPlaylistTracks.length > 0 && handlePlayTrack(currentPlaylistTracks[0])}
                      className="bg-primary hover:bg-primary/95 text-white w-12 h-12 rounded-full p-0 flex items-center justify-center cursor-pointer shadow-lg"
                    >
                      <Play size={20} fill="white" className="ml-0.5" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 flex-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">Vibe Playlist</span>
                  <h2 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight">{currentPlaylist.name}</h2>
                  <p className="text-sm text-muted-foreground max-w-2xl">{currentPlaylist.description}</p>
                  <p className="text-xs text-muted-foreground font-semibold pt-1">
                    VibeSync Curators &bull; {currentPlaylistTracks.length} tracks &bull; {
                      formatTime(currentPlaylistTracks.reduce((acc, curr) => acc + curr.durationSec, 0))
                    } total time
                  </p>
                </div>
              </div>

              {currentPlaylistTracks.length > 0 ? (
                <div className="bg-card/30 border border-border/25 rounded-2xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-muted-foreground text-xs uppercase tracking-wider border-b border-border/10">
                        <th className="px-5 py-3.5 w-12 text-center">#</th>
                        <th className="px-5 py-3.5">Title</th>
                        <th className="px-5 py-3.5">Album</th>
                        <th className="px-5 py-3.5 text-right"><Clock size={14} className="ml-auto" /></th>
                        <th className="px-4 py-3.5 w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentPlaylistTracks.map((track, idx) => {
                        const isCurrent = currentTrack.id === track.id
                        return (
                          <tr 
                            key={track.id}
                            className={`group hover:bg-muted/50 border-b border-border/5 transition-colors cursor-pointer ${
                              isCurrent ? "bg-primary/5" : ""
                            }`}
                          >
                            <td className="px-5 py-3.5 text-center text-sm font-semibold">
                              <span className="group-hover:hidden text-muted-foreground">{idx + 1}</span>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handlePlayTrack(track); }}
                                className="hidden group-hover:inline text-primary"
                              >
                                {isCurrent && isPlaying ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}
                              </button>
                            </td>
                            <td className="px-5 py-3.5" onClick={() => handlePlayTrack(track)}>
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded overflow-hidden bg-muted flex-shrink-0">
                                  <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                  <p className={`text-sm font-semibold truncate ${isCurrent ? "text-primary" : "text-foreground"}`}>
                                    {track.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{track.artist}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-sm text-muted-foreground" onClick={() => handlePlayTrack(track)}>
                              {track.album}
                            </td>
                            <td className="px-5 py-3.5 text-sm text-muted-foreground text-right" onClick={() => handlePlayTrack(track)}>
                              {track.duration}
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleToggleLike(track.id); }}
                                className={`text-muted-foreground hover:text-foreground transition-colors ${
                                  likedTrackIds.includes(track.id) ? "text-primary" : ""
                                }`}
                              >
                                <Heart size={15} className={likedTrackIds.includes(track.id) ? "fill-primary text-primary" : ""} />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-20 text-center border border-dashed border-border/40 rounded-2xl">
                  <Music size={32} className="mx-auto text-muted-foreground/35 mb-2" />
                  <p className="text-sm text-muted-foreground">This playlist has no tracks.</p>
                </div>
              )}
            </div>
          )}

        </div>

      </main>

      {/* 4. Bottom Playback Controls Bar */}
      <footer className="fixed bottom-0 left-0 right-0 h-[100px] bg-card/85 backdrop-blur-xl border-t border-border/40 px-6 flex items-center justify-between z-40">
        
        {/* Left Section: Active Track details */}
        <div className="flex items-center gap-4 w-1/3 min-w-0">
          <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0 shadow-md border border-border/10">
            <img src={currentTrack.coverUrl} alt={currentTrack.title} className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0 pr-2">
            <h4 className="text-sm font-semibold truncate text-foreground hover:text-primary cursor-pointer transition-colors leading-tight">
              {currentTrack.title}
            </h4>
            <p className="text-xs text-muted-foreground truncate hover:underline cursor-pointer mt-0.5">
              {currentTrack.artist}
            </p>
          </div>
          <button 
            onClick={() => handleToggleLike(currentTrack.id)}
            className="text-muted-foreground hover:text-primary active:scale-90 transition-all flex-shrink-0"
            title={likedTrackIds.includes(currentTrack.id) ? "Unlike song" : "Like song"}
          >
            <Heart 
              size={18} 
              className={likedTrackIds.includes(currentTrack.id) ? "fill-primary text-primary" : ""} 
            />
          </button>
        </div>

        {/* Center Section: Playback controls & timeline */}
        <div className="flex flex-col items-center gap-2 flex-1 max-w-2xl px-4">
          
          {/* Controls */}
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsShuffle(!isShuffle)}
              className={`p-1.5 rounded transition-colors ${
                isShuffle ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
              }`}
              title="Shuffle"
            >
              <Shuffle size={16} />
            </button>

            <button 
              onClick={handlePrevTrack}
              className="text-muted-foreground hover:text-foreground active:scale-95 transition-all p-1.5"
              title="Previous Track"
            >
              <SkipBack size={18} />
            </button>

            <button 
              onClick={handleTogglePlay}
              className="bg-primary hover:bg-primary/95 text-white w-10 h-10 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause size={18} fill="white" /> : <Play size={18} fill="white" className="ml-0.5" />}
            </button>

            <button 
              onClick={handleNextTrack}
              className="text-muted-foreground hover:text-foreground active:scale-95 transition-all p-1.5"
              title="Next Track"
            >
              <SkipForward size={18} />
            </button>

            <button 
              onClick={() => setIsRepeat(!isRepeat)}
              className={`p-1.5 rounded transition-colors ${
                isRepeat ? "text-primary font-bold animate-pulse" : "text-muted-foreground hover:text-foreground"
              }`}
              title="Repeat Track"
            >
              <Repeat size={16} />
            </button>
          </div>

          {/* Timeline Slider */}
          <div className="w-full flex items-center gap-3">
            <span className="text-[10px] font-mono text-muted-foreground w-8 text-right select-none">
              {formatTime(currentTime)}
            </span>
            
            <Slider
              value={[currentTime]}
              min={0}
              max={duration || 100}
              step={0.1}
              onValueChange={(val) => {
                setCurrentTime(val[0])
                if (audioRef.current) {
                  audioRef.current.currentTime = val[0]
                }
              }}
              className="flex-1 cursor-pointer"
            />

            <span className="text-[10px] font-mono text-muted-foreground w-8 select-none">
              {formatTime(duration)}
            </span>
          </div>

        </div>

        {/* Right Section: Volume & extra utilities */}
        <div className="flex items-center justify-end gap-4 w-1/3">
          
          <button 
            className="text-muted-foreground hover:text-foreground p-1 hidden sm:inline-flex"
            title="Lyrics"
          >
            <span className="text-xs font-bold uppercase tracking-wider scale-90 border border-muted-foreground/30 px-1.5 py-0.5 rounded">
              Lyrics
            </span>
          </button>
          
          <button 
            onClick={() => setActiveTab("library")}
            className={`p-1 transition-colors ${activeTab === "library" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            title="Queue"
          >
            <ListMusic size={18} />
          </button>

          {/* Volume control block */}
          <div className="flex items-center gap-3 group w-28">
            <button 
              onClick={handleToggleMute}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 shrink-0"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted || volume === 0 ? <VolumeX size={18} className="text-primary" /> : <Volume2 size={18} />}
            </button>
            <Slider
              value={[isMuted ? 0 : volume]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={(val) => handleVolumeChange(val[0])}
              className="w-full cursor-pointer"
            />
          </div>

          <button 
            className="text-muted-foreground hover:text-foreground p-1 hidden sm:inline-flex"
            title="Fullscreen"
          >
            <Maximize2 size={16} />
          </button>

        </div>

      </footer>

    </div>
  )
}
