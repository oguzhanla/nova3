import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { 
  Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Maximize2, Minimize2, 
  Settings, Radio, Subtitles, AudioWaveform, Cpu, Check, 
  ArrowLeft, Heart, Zap, Sparkles, Sliders, AlertTriangle, RefreshCw, List, ChevronRight
} from 'lucide-react';
import { BUFFER_PRESETS } from '../constants/defaults';
import { PlayerSettings, StreamType } from '../types';
import { storageService } from '../services/storageService';

interface ChannelItem {
  id: string;
  name: string;
  icon?: string;
  number?: number;
  raw: any;
}

interface LivePlayerProps {
  streamUrl: string;
  streamUrlTs?: string;
  title: string;
  streamType: StreamType;
  streamId: string;
  poster?: string;
  category?: string;
  settings: PlayerSettings;
  onUpdateSettings: (settings: PlayerSettings) => void;
  onClose: () => void;
  onNextChannel?: () => void;
  onPrevChannel?: () => void;
  channels?: ChannelItem[];
  onSelectChannel?: (channel: any) => void;
}

export const LivePlayer: React.FC<LivePlayerProps> = ({
  streamUrl,
  streamUrlTs,
  title,
  streamType,
  streamId,
  poster,
  category,
  settings,
  onUpdateSettings,
  onClose,
  onNextChannel,
  onPrevChannel,
  channels = [],
  onSelectChannel,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Active stream URL and fallback variants
  const [activeUrl, setActiveUrl] = useState<string>(streamUrl);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [streamFormat, setStreamFormat] = useState<'hls' | 'ts' | 'direct'>('hls');
  const [isChannelListOpen, setIsChannelListOpen] = useState<boolean>(false);
  const [selectedChannelIdx, setSelectedChannelIdx] = useState<number>(0);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [bufferedTime, setBufferedTime] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [isFavorite, setIsFavorite] = useState<boolean>(storageService.isFavorite(streamId));
  const [activeMenu, setActiveMenu] = useState<'none' | 'audio' | 'subtitle' | 'engine' | 'buffer' | 'quality'>('none');
  const [selectedQuality, setSelectedQuality] = useState<string>('Auto (1080p)');
  const [selectedAudio, setSelectedAudio] = useState<string>('TR - Dolby Digital Plus (5.1)');
  const [selectedSubtitle, setSelectedSubtitle] = useState<string>('Kapalı');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | 'fit' | 'fill'>('16:9');
  const [isLiveJumpActive, setIsLiveJumpActive] = useState<boolean>(false);
  const [liveShiftSeconds, setLiveShiftSeconds] = useState<number>(0);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync activeUrl when streamUrl prop changes
  useEffect(() => {
    setActiveUrl(streamUrl);
    setStreamError(null);
    setStreamFormat(streamUrl.includes('.ts') ? 'ts' : 'hls');
    setIsBuffering(true);
  }, [streamUrl]);

  // Auto-hide controls timer
  const resetControlsTimer = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (activeMenu === 'none' && !isChannelListOpen) {
        setShowControls(false);
      }
    }, 4500);
  };

  useEffect(() => {
    resetControlsTimer();
    const handleActivity = () => resetControlsTimer();
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [activeMenu, isChannelListOpen]);

  // Keyboard navigation for TV Remote
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      resetControlsTimer();

      // If channel drawer is open on live TV:
      if (isChannelListOpen && channels.length > 0) {
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedChannelIdx(prev => (prev - 1 + channels.length) % channels.length);
          return;
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedChannelIdx(prev => (prev + 1) % channels.length);
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          const target = channels[selectedChannelIdx];
          if (target && onSelectChannel) {
            onSelectChannel(target.raw);
          }
          setIsChannelListOpen(false);
          return;
        }
        if (e.key === 'ArrowRight' || e.key === 'Escape' || e.key === 'Backspace') {
          e.preventDefault();
          setIsChannelListOpen(false);
          return;
        }
      }

      switch (e.key) {
        case ' ':
        case 'Enter':
          if (activeMenu === 'none') {
            togglePlay();
          }
          break;
        case 'ArrowLeft':
          if (streamType === 'live' && channels.length > 0) {
            // Open quick TV channel list drawer
            setIsChannelListOpen(prev => !prev);
          } else {
            handleSeekRelative(-10);
          }
          break;
        case 'ArrowRight':
          handleSeekRelative(10);
          break;
        case 'ArrowUp':
          if (onPrevChannel && streamType === 'live') onPrevChannel();
          break;
        case 'ArrowDown':
          if (onNextChannel && streamType === 'live') onNextChannel();
          break;
        case 'Escape':
        case 'Backspace':
          if (isChannelListOpen) {
            setIsChannelListOpen(false);
          } else if (activeMenu !== 'none') {
            setActiveMenu('none');
          } else {
            onClose();
          }
          break;
        case 'c':
        case 'C':
          if (streamType === 'live') {
            setIsChannelListOpen(prev => !prev);
          }
          break;
        case 'm':
        case 'M':
          toggleMute();
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, activeMenu, streamType, currentTime, isChannelListOpen, selectedChannelIdx, channels]);

  // Video Stream Initializer (Smart HLS, TS, Direct Video Fallback)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeUrl) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    setIsBuffering(true);
    setStreamError(null);

    const bufferSeconds = BUFFER_PRESETS[settings.bufferSize]?.seconds || 15;
    const isM3u8 = activeUrl.includes('.m3u8');
    const isTs = activeUrl.includes('.ts');

    // If explicit TS or native mode, bypass HLS.js and feed video element directly (Android native player handles TS)
    if (streamFormat === 'ts' || (isTs && !isM3u8)) {
      video.src = activeUrl;
      video.load();
      video.play().catch(() => {});
      return;
    }

    // Try Hls.js for m3u8 playlists
    if ((isM3u8 || streamType === 'live') && Hls.isSupported() && streamFormat !== 'direct') {
      const hls = new Hls({
        maxBufferLength: Math.max(10, bufferSeconds),
        maxMaxBufferLength: Math.max(30, bufferSeconds * 2),
        liveSyncDurationCount: settings.bufferSize === 'none' ? 1 : 3,
        liveMaxLatencyDurationCount: settings.bufferSize === 'none' ? 3 : 6,
        enableWorker: settings.hardwareAcceleration,
        lowLatencyMode: settings.bufferSize === 'none',
      });

      hlsRef.current = hls;
      hls.loadSource(activeUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsBuffering(false);
        setStreamError(null);
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          console.warn('HLS.js fatal error, switching to direct video element...');
          hls.destroy();
          hlsRef.current = null;

          // Auto fallback to TS or direct video element
          if (activeUrl.includes('.m3u8')) {
            const fallbackTs = streamUrlTs || activeUrl.replace(/\.m3u8($|\?)/, '.ts$1');
            console.log('Falling back to TS stream:', fallbackTs);
            setStreamFormat('ts');
            video.src = fallbackTs;
            video.load();
            video.play().catch(() => {
              setStreamError('Yayın akışı yüklenemedi. Aşağıdaki butonlardan MPEG-TS veya Doğrudan Akış modunu deneyebilirsiniz.');
              setIsBuffering(false);
            });
          } else {
            video.src = activeUrl;
            video.load();
            video.play().catch(() => {
              setStreamError('Yayın akışı başlatılamadı. Format butonuna dokunup tekrar deneyiniz.');
              setIsBuffering(false);
            });
          }
        }
      });
    } else {
      // Direct mp4 / native HLS
      video.src = activeUrl;
      video.load();
      video.play().catch(() => {
        setIsBuffering(false);
      });
    }

    // Restore previous watch position if movie or series
    if (streamType !== 'live') {
      const history = storageService.getWatchHistory().find(h => h.id === streamId);
      if (history && history.lastPositionSeconds > 10 && history.lastPositionSeconds < history.durationSeconds - 20) {
        video.currentTime = history.lastPositionSeconds;
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [activeUrl, streamFormat, settings.engine, settings.bufferSize, settings.hardwareAcceleration]);

  // Watch position tracker
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setDuration(video.duration || 0);
      updateBufferProgress();

      // Save watch history periodically
      if (streamType !== 'live' && video.currentTime > 5 && video.duration > 0) {
        storageService.saveWatchHistory({
          id: streamId,
          title,
          streamUrl: activeUrl,
          streamType,
          poster,
          category,
          lastPositionSeconds: Math.floor(video.currentTime),
          durationSeconds: Math.floor(video.duration),
          watchedAt: Date.now(),
        });
      }
    };

    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => {
      setIsBuffering(false);
      setIsPlaying(true);
      setStreamError(null);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
    };
  }, [streamId, title, activeUrl, streamType, poster, category]);

  const updateBufferProgress = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.buffered.length > 0) {
      for (let i = video.buffered.length - 1; i >= 0; i--) {
        if (video.buffered.start(i) <= video.currentTime) {
          setBufferedTime(video.buffered.end(i));
          break;
        }
      }
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSeekRelative = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;

    if (streamType === 'live') {
      const newShift = Math.max(0, liveShiftSeconds - seconds);
      setLiveShiftSeconds(newShift);
      setIsLiveJumpActive(newShift > 0);
      video.currentTime = Math.max(0, video.currentTime + seconds);
    } else {
      video.currentTime = Math.min(duration, Math.max(0, video.currentTime + seconds));
    }
  };

  const handleSeekAbsolute = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    video.currentTime = pos * duration;
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const toggleFavorite = () => {
    const newState = storageService.toggleFavorite(streamId);
    setIsFavorite(newState);
  };

  const jumpToLive = () => {
    const video = videoRef.current;
    if (!video) return;
    if (hlsRef.current) {
      video.currentTime = video.duration || 0;
    }
    setLiveShiftSeconds(0);
    setIsLiveJumpActive(false);
  };

  const formatTime = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  // Manual format switchers for problematic streams
  const handleSwitchToTs = () => {
    const tsUrl = streamUrlTs || activeUrl.replace(/\.m3u8($|\?)/, '.ts$1');
    setActiveUrl(tsUrl);
    setStreamFormat('ts');
    setStreamError(null);
  };

  const handleSwitchToHls = () => {
    const m3u8Url = streamUrl.includes('.ts') ? streamUrl.replace(/\.ts($|\?)/, '.m3u8$1') : streamUrl;
    setActiveUrl(m3u8Url);
    setStreamFormat('hls');
    setStreamError(null);
  };

  const handleSwitchToDirect = () => {
    const cleanUrl = activeUrl.replace(/\.(m3u8|ts)($|\?)/, '$2');
    setActiveUrl(cleanUrl);
    setStreamFormat('direct');
    setStreamError(null);
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none overflow-hidden"
      style={{
        padding: `${settings.overscanMargin}%`,
      }}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        playsInline
        autoPlay
        onCanPlay={() => {
          setIsBuffering(false);
          setStreamError(null);
        }}
        onPlaying={() => {
          setIsBuffering(false);
          setIsPlaying(true);
          setStreamError(null);
        }}
        onWaiting={() => setIsBuffering(true)}
        onError={() => {
          setIsBuffering(false);
          if (activeUrl.includes('.m3u8')) {
            handleSwitchToTs();
          } else {
            setStreamError('Yayın akışı başlatılamadı. Farklı bir format deneyiniz.');
          }
        }}
        className={`w-full h-full object-${aspectRatio === 'fill' ? 'fill' : aspectRatio === 'fit' ? 'contain' : 'contain'} cursor-pointer`}
        onClick={() => {
          resetControlsTimer();
          togglePlay();
        }}
      />

      {/* Buffering Indicator */}
      {isBuffering && !streamError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-xs z-30 pointer-events-none">
          <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin"></div>
          <p className="mt-4 text-cyan-300 font-medium text-sm tracking-wider uppercase flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
            {streamFormat === 'ts' ? 'MPEG-TS Yayını Yükleniyor...' : 'HLS Akışı Yükleniyor...'}
          </p>
          <span className="text-xs text-slate-400 mt-1">
            Arabellek: {BUFFER_PRESETS[settings.bufferSize]?.label} ({BUFFER_PRESETS[settings.bufferSize]?.seconds}s)
          </span>
        </div>
      )}

      {/* Stream Error Recovery Overlay */}
      {streamError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md z-40 p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mb-3">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-white mb-1">Yayın Başlatılamadı</h2>
          <p className="text-xs text-slate-400 max-w-md mb-4 leading-relaxed">
            {streamError}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleSwitchToTs}
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20"
            >
              <Cpu className="w-4 h-4" />
              <span>MPEG-TS (.ts) Olarak Oynat</span>
            </button>

            <button
              onClick={handleSwitchToHls}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all border border-slate-700"
            >
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>HLS (.m3u8) Olarak Oynat</span>
            </button>

            <button
              onClick={handleSwitchToDirect}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all border border-slate-700"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Doğrudan Akış</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-red-950 text-slate-400 hover:text-red-400 text-xs font-semibold transition-all border border-slate-800"
            >
              Geri Dön (ESC)
            </button>
          </div>
        </div>
      )}

      {/* QUICK CHANNEL LIST DRAWER (TV OSD) */}
      {isChannelListOpen && channels.length > 0 && (
        <div className="absolute top-0 bottom-0 left-0 w-80 bg-slate-950/95 border-r border-slate-800/90 z-50 flex flex-col p-4 backdrop-blur-md animate-in slide-in-from-left duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-sm text-white">Kanal Rehberi ({channels.length})</h3>
            </div>
            <button
              onClick={() => setIsChannelListOpen(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Kapat ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-2 space-y-1 pr-1">
            {channels.map((ch, idx) => {
              const isCurrent = `live_${ch.raw.stream_id}` === streamId || ch.id === streamId;
              const isSelected = selectedChannelIdx === idx;

              return (
                <div
                  key={ch.id}
                  onClick={() => {
                    if (onSelectChannel) onSelectChannel(ch.raw);
                    setIsChannelListOpen(false);
                  }}
                  className={`p-2.5 rounded-xl flex items-center justify-between gap-2.5 cursor-pointer transition-all ${
                    isCurrent
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                      : isSelected
                      ? 'bg-slate-800 text-white border border-cyan-400'
                      : 'bg-slate-900/60 text-slate-300 hover:bg-slate-850 border border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xs font-mono font-bold w-6 text-center opacity-75">
                      #{idx + 1}
                    </span>
                    <span className="text-xs truncate">{ch.name}</span>
                  </div>
                  {isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-slate-950 animate-pulse shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between">
            <span>▲/▼ Gezin • OK Seç</span>
            <span>► Kapat</span>
          </div>
        </div>
      )}

      {/* Top Header Overlay */}
      <div 
        className={`absolute top-0 left-0 right-0 p-6 bg-linear-to-b from-black/90 via-black/50 to-transparent transition-opacity duration-300 z-40 flex items-center justify-between ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="w-12 h-12 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 text-white flex items-center justify-center transition-all border border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 cursor-pointer"
            title="Geri Dön (ESC)"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                streamType === 'live' ? 'bg-red-600 text-white animate-pulse' : 'bg-cyan-600 text-white'
              }`}>
                {streamType === 'live' ? 'CANLI YAYIN' : streamType === 'movie' ? 'VOD SİNEMA' : 'DİZİ'}
              </span>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1 font-mono uppercase">
                <Cpu className="w-3 h-3 text-cyan-400" />
                {streamFormat}
              </span>
              {settings.hardwareAcceleration && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 hidden sm:inline-block">
                  HW+ Donanım Hızlandırma
                </span>
              )}
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white mt-1 drop-shadow-md flex items-center gap-2">
              {title}
            </h1>
            {category && <p className="text-xs text-slate-400">{category}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick TV Channel Switcher trigger */}
          {streamType === 'live' && channels.length > 0 && (
            <button
              onClick={() => setIsChannelListOpen(prev => !prev)}
              className="px-3.5 py-2 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
              title="Kanal Listesini Aç (◄ Tuşu)"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Kanal Listesi</span>
            </button>
          )}

          {/* Live Timeshift status badge */}
          {streamType === 'live' && isLiveJumpActive && (
            <button
              onClick={jumpToLive}
              className="px-4 py-2 rounded-xl bg-red-600/90 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-red-600/30 animate-bounce"
            >
              <Radio className="w-4 h-4" />
              Canlıya Dön ({liveShiftSeconds}s Gecikme)
            </button>
          )}

          <button
            onClick={toggleFavorite}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all border ${
              isFavorite 
                ? 'bg-pink-600/30 border-pink-500 text-pink-400' 
                : 'bg-slate-800/70 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Favorilere Ekle"
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-pink-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Bottom Controls Overlay */}
      <div 
        className={`absolute bottom-0 left-0 right-0 p-6 bg-linear-to-t from-black/95 via-black/60 to-transparent transition-opacity duration-300 z-40 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Seekbar */}
        <div className="mb-4">
          <div 
            onClick={handleSeekAbsolute}
            className="group relative w-full h-2.5 hover:h-3.5 bg-slate-800/80 rounded-full cursor-pointer transition-all flex items-center"
          >
            <div 
              className="absolute left-0 top-0 bottom-0 bg-slate-600/70 rounded-full transition-all"
              style={{
                width: duration > 0 ? `${(bufferedTime / duration) * 100}%` : '60%',
              }}
            />
            <div 
              className="absolute left-0 top-0 bottom-0 bg-linear-to-r from-cyan-500 to-blue-500 rounded-full transition-all shadow-sm"
              style={{
                width: duration > 0 ? `${(currentTime / duration) * 100}%` : '100%',
              }}
            />
            <div 
              className="absolute w-4 h-4 bg-white rounded-full shadow-lg -translate-x-1/2 group-hover:scale-125 transition-transform"
              style={{
                left: duration > 0 ? `${(currentTime / duration) * 100}%` : '100%',
              }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-300 mt-2 font-mono">
            <div className="flex items-center gap-3">
              <span>{formatTime(currentTime)}</span>
              {duration > 0 && <span className="text-slate-500">/ {formatTime(duration)}</span>}
              {streamType === 'live' && (
                <span className="flex items-center gap-1.5 text-xs font-sans font-bold text-red-500 bg-red-950/80 px-2 py-0.5 rounded border border-red-900/50">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                  CANLI AKIŞ
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs font-sans text-slate-400">
              <button
                onClick={handleSwitchToTs}
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all ${
                  streamFormat === 'ts' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                MPEG-TS
              </button>
              <button
                onClick={handleSwitchToHls}
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all ${
                  streamFormat === 'hls' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                HLS
              </button>
            </div>
          </div>
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="w-12 h-12 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center transition-all shadow-lg shadow-cyan-500/30 focus:outline-none focus:ring-2 focus:ring-white cursor-pointer"
              title="Oynat / Duraklat (Boşluk/OK)"
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
            </button>

            {/* Rewind 10s */}
            <button
              onClick={() => handleSeekRelative(-10)}
              className="w-10 h-10 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white flex items-center justify-center transition-all border border-slate-700 cursor-pointer"
              title="10 sn Geri Al"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            {/* Forward 10s */}
            <button
              onClick={() => handleSeekRelative(10)}
              className="w-10 h-10 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white flex items-center justify-center transition-all border border-slate-700 cursor-pointer"
              title="10 sn İleri Al"
            >
              <RotateCw className="w-5 h-5" />
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2 ml-2">
              <button
                onClick={toggleMute}
                className="w-10 h-10 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white flex items-center justify-center transition-all border border-slate-700 cursor-pointer"
                title="Sesi Aç/Kapat (M)"
              >
                {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Quick Option Buttons */}
          <div className="flex items-center gap-2">
            {/* Aspect Ratio */}
            <button
              onClick={() => {
                const modes: ('16:9' | 'fit' | 'fill')[] = ['16:9', 'fit', 'fill'];
                const nextIdx = (modes.indexOf(aspectRatio) + 1) % modes.length;
                setAspectRatio(modes[nextIdx]);
              }}
              className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
              title="En Boy Oranı"
            >
              {aspectRatio === '16:9' ? '16:9' : aspectRatio === 'fit' ? 'Sığdır' : 'Doldur'}
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="w-10 h-10 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white flex items-center justify-center transition-all border border-slate-700 cursor-pointer"
              title="Tam Ekran (F)"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* TV Remote Shortcut Guide Bar */}
        <div className="mt-3 pt-2 border-t border-slate-800/50 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-4">
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono">OK</kbd> Duraklat</span>
            {streamType === 'live' && (
              <>
                <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono">◄</kbd> Kanal Listesi</span>
                <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono">▲/▼</kbd> Kanal Değiştir</span>
              </>
            )}
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono">GERİ</kbd> Çıkış</span>
          </div>
          <div className="flex items-center gap-1.5 text-cyan-400">
            <Sparkles className="w-3.5 h-3.5" />
            NovaStream TV Oynatıcı
          </div>
        </div>
      </div>
    </div>
  );
};
