/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo } from 'react';
import { 
  Search, Play, Heart, Star, Radio, Film, Clapperboard, FolderGit2, 
  RotateCcw, SlidersHorizontal, Sparkles, Server, Zap, Cpu, Check, 
  Trash2, Clock, Filter, Tv, Eye, History as HistoryIcon, Download
} from 'lucide-react';

import { 
  Category, CloudStreamContent, CloudStreamPlugin, CloudStreamRepo, 
  LiveStreamItem, PlayerSettings, SeriesEpisode, SeriesItem, StreamType, 
  VodItem, WatchHistoryItem, XtreamCredentials, XtreamServerInfo, XtreamUserInfo 
} from './types';

import { storageService } from './services/storageService';
import { xtreamService } from './services/xtreamService';
import { cloudstreamService } from './services/cloudstreamService';

import { NavigationSidebar, NavTab } from './components/NavigationSidebar';
import { LivePlayer } from './components/LivePlayer';
import { CloudStreamManager } from './components/CloudStreamManager';
import { XtreamConfigModal } from './components/XtreamConfigModal';
import { SettingsModal } from './components/SettingsModal';
import { SeriesDetailModal } from './components/SeriesDetailModal';
import { VirtualRemote } from './components/VirtualRemote';
import { ZipDownloadModal } from './components/ZipDownloadModal';
import { useSpatialNavigation } from './utils/useSpatialNavigation';

export default function App() {
  // Xtream & Cloudstream State
  const [xtreamConfig, setXtreamConfig] = useState<XtreamCredentials>(storageService.getXtreamConfig());
  const [userInfo, setUserInfo] = useState<XtreamUserInfo | null>(null);
  const [serverInfo, setServerInfo] = useState<XtreamServerInfo | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const [repos, setRepos] = useState<CloudStreamRepo[]>(storageService.getCloudStreamRepos());
  const [installedPlugins, setInstalledPlugins] = useState<CloudStreamPlugin[]>(storageService.getInstalledPlugins());
  const [playerSettings, setPlayerSettings] = useState<PlayerSettings>(storageService.getPlayerSettings());
  const [favorites, setFavorites] = useState<string[]>(storageService.getFavorites());
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>(storageService.getWatchHistory());

  // Navigation & Category State
  const [activeTab, setActiveTab] = useState<NavTab>('live');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'default' | 'rating' | 'name'>('default');

  // Content Data
  const [liveStreams, setLiveStreams] = useState<LiveStreamItem[]>([]);
  const [vodStreams, setVodStreams] = useState<VodItem[]>([]);
  const [seriesList, setSeriesList] = useState<SeriesItem[]>([]);
  const [isLoadingContent, setIsLoadingContent] = useState<boolean>(true);

  // Modals & Active Player State
  const [isXtreamModalOpen, setIsXtreamModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [selectedSeries, setSelectedSeries] = useState<SeriesItem | null>(null);
  const [isSeriesModalOpen, setIsSeriesModalOpen] = useState<boolean>(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState<boolean>(false);

  // Video Player Active Item
  const [activePlayback, setActivePlayback] = useState<{
    url: string;
    urlTs?: string;
    title: string;
    streamType: StreamType;
    streamId: string;
    poster?: string;
    category?: string;
  } | null>(null);

  // Activate TV Remote (D-Pad) Spatial Navigation Engine across entire app
  useSpatialNavigation(!activePlayback);

  // Global Android TV Remote Back and Number Keys Handler
  useEffect(() => {
    const handleTvRemoteKey = (e: KeyboardEvent) => {
      // 1. Android TV Back Key (Escape, Backspace, or Android KeyCode 4)
      if (e.key === 'Escape' || e.key === 'Backspace' || (e as any).keyCode === 4) {
        if (activePlayback) {
          // If player is open, let player close
          return;
        }

        // Close any open modals
        if (isXtreamModalOpen) {
          e.preventDefault();
          setIsXtreamModalOpen(false);
          return;
        }
        if (isSettingsModalOpen) {
          e.preventDefault();
          setIsSettingsModalOpen(false);
          return;
        }
        if (isSeriesModalOpen) {
          e.preventDefault();
          setIsSeriesModalOpen(false);
          return;
        }
        if (isDownloadModalOpen) {
          e.preventDefault();
          setIsDownloadModalOpen(false);
          return;
        }

        // Return to home 'live' tab if on another screen
        if (activeTab !== 'live') {
          e.preventDefault();
          handleTabChange('live');
          return;
        }
      }

      // 2. Direct Number Pad Channel Jump (e.g. Pressing 1, 2, 5 on remote)
      if (activeTab === 'live' && !activePlayback && /^[0-9]$/.test(e.key)) {
        const activeTag = (document.activeElement as HTMLElement)?.tagName;
        if (activeTag !== 'INPUT' && activeTag !== 'TEXTAREA') {
          const num = parseInt(e.key, 10);
          if (num > 0 && liveStreams.length >= num) {
            const target = liveStreams[num - 1];
            if (target) {
              playLiveItem(target);
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleTvRemoteKey);
    return () => window.removeEventListener('keydown', handleTvRemoteKey);
  }, [
    activePlayback,
    isXtreamModalOpen,
    isSettingsModalOpen,
    isSeriesModalOpen,
    isDownloadModalOpen,
    activeTab,
    liveStreams
  ]);

  // Initialize connection and content on mount
  useEffect(() => {
    handleConnectXtream(xtreamConfig);
  }, []);

  const handleConnectXtream = async (config: XtreamCredentials) => {
    setIsLoadingContent(true);
    const authResult = await xtreamService.authenticate(config);
    if (authResult.success) {
      setIsConnected(true);
      if (authResult.userInfo) setUserInfo(authResult.userInfo);
      if (authResult.serverInfo) setServerInfo(authResult.serverInfo);
    }

    // Load initial categories & content
    await loadTabContent(activeTab, config);
    setIsLoadingContent(false);
  };

  const loadTabContent = async (tab: NavTab, config: XtreamCredentials = xtreamConfig) => {
    setIsLoadingContent(true);
    setSelectedCategory('all');

    if (tab === 'live') {
      const cats = await xtreamService.getLiveCategories(config);
      setCategories(cats);
      const items = await xtreamService.getLiveStreams(config);
      setLiveStreams(items);
    } else if (tab === 'movies') {
      const cats = await xtreamService.getVodCategories(config);
      setCategories(cats);
      const items = await xtreamService.getVodStreams(config);
      setVodStreams(items);
    } else if (tab === 'series') {
      const cats = await xtreamService.getSeriesCategories(config);
      setCategories(cats);
      const items = await xtreamService.getSeries(config);
      setSeriesList(items);
    }
    setIsLoadingContent(false);
  };

  const handleTabChange = (newTab: NavTab) => {
    setActiveTab(newTab);
    setSearchQuery('');
    if (newTab === 'live' || newTab === 'movies' || newTab === 'series') {
      loadTabContent(newTab);
    }
  };

  const handleToggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    storageService.toggleFavorite(id);
    setFavorites(storageService.getFavorites());
  };

  const playLiveItem = (item: LiveStreamItem) => {
    setActivePlayback({
      url: item.stream_url || xtreamService.buildLiveStreamUrl(xtreamConfig, item.stream_id),
      urlTs: item.stream_url_ts || xtreamService.buildLiveStreamUrlTs(xtreamConfig, item.stream_id),
      title: item.name,
      streamType: 'live',
      streamId: `live_${item.stream_id}`,
      poster: item.stream_icon,
      category: item.resolution || 'Canlı TV',
    });
  };

  const playVodItem = (item: VodItem) => {
    setActivePlayback({
      url: item.stream_url || xtreamService.buildVodStreamUrl(xtreamConfig, item.stream_id, item.container_extension),
      title: item.name,
      streamType: 'movie',
      streamId: `vod_${item.stream_id}`,
      poster: item.stream_icon,
      category: `${item.year || '2024'} • ${item.genre || 'Sinema'}`,
    });
  };

  const handlePlaySeriesEpisode = (episode: SeriesEpisode, series: SeriesItem) => {
    setIsSeriesModalOpen(false);
    setActivePlayback({
      url: episode.stream_url || 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      title: `${series.name} - ${episode.title}`,
      streamType: 'series',
      streamId: `series_${series.series_id}_${episode.id}`,
      poster: episode.info?.movie_image || series.cover,
      category: `Sezon ${episode.season} • Bölüm ${episode.episode_num}`,
    });
  };

  const handlePlayCloudStreamContent = (content: CloudStreamContent) => {
    setActivePlayback({
      url: content.streamUrl,
      title: content.title,
      streamType: content.type === 'live' ? 'live' : 'movie',
      streamId: content.id,
      poster: content.poster,
      category: content.sourcePlugin,
    });
  };

  const handlePlayHistoryItem = (item: WatchHistoryItem) => {
    setActivePlayback({
      url: item.streamUrl,
      title: item.title,
      streamType: item.streamType,
      streamId: item.id,
      poster: item.poster,
      category: item.category,
    });
  };

  // Next / Prev channel for Android TV remote Up/Down
  const handleNextChannel = () => {
    if (activePlayback?.streamType === 'live' && liveStreams.length > 0) {
      const currentIndex = liveStreams.findIndex(s => `live_${s.stream_id}` === activePlayback.streamId);
      const nextIdx = (currentIndex + 1) % liveStreams.length;
      playLiveItem(liveStreams[nextIdx]);
    }
  };

  const handlePrevChannel = () => {
    if (activePlayback?.streamType === 'live' && liveStreams.length > 0) {
      const currentIndex = liveStreams.findIndex(s => `live_${s.stream_id}` === activePlayback.streamId);
      const prevIdx = (currentIndex - 1 + liveStreams.length) % liveStreams.length;
      playLiveItem(liveStreams[prevIdx]);
    }
  };

  // Filtered Items for current view
  const filteredLive = useMemo(() => {
    return liveStreams.filter((item) => {
      const matchesCat = selectedCategory === 'all' || item.category_id === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [liveStreams, selectedCategory, searchQuery]);

  const filteredVod = useMemo(() => {
    let result = vodStreams.filter((item) => {
      const matchesCat = selectedCategory === 'all' || item.category_id === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
    if (sortBy === 'rating') {
      result = [...result].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    } else if (sortBy === 'name') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    }
    return result;
  }, [vodStreams, selectedCategory, searchQuery, sortBy]);

  const filteredSeries = useMemo(() => {
    let result = seriesList.filter((item) => {
      const matchesCat = selectedCategory === 'all' || item.category_id === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
    if (sortBy === 'rating') {
      result = [...result].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    }
    return result;
  }, [seriesList, selectedCategory, searchQuery, sortBy]);

  // Favorite items collection
  const favoriteItems = useMemo(() => {
    const list: Array<{ id: string; title: string; poster?: string; type: StreamType; badge: string; raw: any }> = [];
    
    liveStreams.forEach((l) => {
      if (favorites.includes(`live_${l.stream_id}`)) {
        list.push({ id: `live_${l.stream_id}`, title: l.name, poster: l.stream_icon, type: 'live', badge: 'Canlı TV', raw: l });
      }
    });

    vodStreams.forEach((v) => {
      if (favorites.includes(`vod_${v.stream_id}`)) {
        list.push({ id: `vod_${v.stream_id}`, title: v.name, poster: v.stream_icon, type: 'movie', badge: 'Sinema', raw: v });
      }
    });

    seriesList.forEach((s) => {
      if (favorites.includes(`series_${s.series_id}`)) {
        list.push({ id: `series_${s.series_id}`, title: s.name, poster: s.cover, type: 'series', badge: 'Dizi', raw: s });
      }
    });

    return list;
  }, [favorites, liveStreams, vodStreams, seriesList]);

  // Theme styling based on playerSettings.theme
  const bgClass = playerSettings.theme === 'titanium' 
    ? 'bg-slate-900' 
    : playerSettings.theme === 'deep-navy' 
    ? 'bg-[#080d1a]' 
    : 'bg-[#07090e]';

  return (
    <div className={`min-h-screen text-slate-100 flex flex-col md:flex-row ${bgClass}`}>
      {/* Sidebar Navigation (Android TV Leanback) */}
      <NavigationSidebar
        activeTab={activeTab}
        onSelectTab={handleTabChange}
        onOpenXtreamConfig={() => setIsXtreamModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenDownloadModal={() => setIsDownloadModalOpen(true)}
        xtreamConfig={xtreamConfig}
        isConnected={isConnected}
        favoritesCount={favorites.length}
      />

      {/* Main Screen Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md px-6 py-4 border-b border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Search Bar */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={`${
                activeTab === 'live' ? 'Kanal veya spor ara (ör: beIN, TRT)...' :
                activeTab === 'movies' ? 'Film adı veya tür ara...' :
                activeTab === 'series' ? 'Dizi ara...' : 'Ara...'
              }`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700/80 focus:border-cyan-400 focus:outline-none text-xs text-white placeholder-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Action, Engine & Codec Indicators */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
            <button
              onClick={() => setIsDownloadModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/25 cursor-pointer"
              title="Tüm kaynak kodlarını ZIP olarak indir"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Projeyi ZIP İndir</span>
            </button>

            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-2 transition-all"
            >
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>{playerSettings.engine.toUpperCase()}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </button>

            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-2 transition-all"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Tampon: {playerSettings.bufferSize}</span>
            </button>

            <button
              onClick={() => setIsXtreamModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Server className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Rinastv Aktif</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* TAB: CLOUDSTREAM PLUGINS */}
          {activeTab === 'cloudstream' && (
            <CloudStreamManager
              repos={repos}
              installedPlugins={installedPlugins}
              onUpdateRepos={setRepos}
              onUpdatePlugins={setInstalledPlugins}
              onPlayContent={handlePlayCloudStreamContent}
            />
          )}

          {/* TAB: FAVORITES */}
          {activeTab === 'favorites' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
                    Favori İçerikler ({favoriteItems.length})
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Sık izlediğiniz kanallar ve filmler</p>
                </div>
              </div>

              {favoriteItems.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
                  <Heart className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm font-medium">Henüz favori içerik eklemediniz.</p>
                  <p className="text-xs text-slate-500 mt-1">İçeriklerin üzerindeki kalp simgesine dokunarak favorilerinize ekleyin.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {favoriteItems.map((fav) => (
                    <div
                      key={fav.id}
                      onClick={() => {
                        if (fav.type === 'live') playLiveItem(fav.raw);
                        else if (fav.type === 'movie') playVodItem(fav.raw);
                        else {
                          setSelectedSeries(fav.raw);
                          setIsSeriesModalOpen(true);
                        }
                      }}
                      className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-cyan-400 cursor-pointer transition-all flex flex-col"
                    >
                      <div className="aspect-2/3 bg-slate-950 overflow-hidden relative flex items-center justify-center">
                        {fav.poster && fav.poster.trim() !== '' ? (
                          <img src={fav.poster} alt={fav.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <Film className="w-8 h-8 text-slate-700" />
                        )}
                        <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-600 text-white">
                          {fav.badge}
                        </span>
                        <button
                          onClick={(e) => handleToggleFavorite(fav.id, e)}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-pink-400 hover:bg-black/90 transition-all"
                        >
                          <Heart className="w-4 h-4 fill-pink-400" />
                        </button>
                      </div>
                      <div className="p-3">
                        <h4 className="font-bold text-xs text-white truncate">{fav.title}</h4>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: WATCH HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <HistoryIcon className="w-5 h-5 text-cyan-400" />
                    İzleme Geçmişi ({watchHistory.length})
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Kaldığınız yerden devam edebileceğiniz yayınlar</p>
                </div>

                {watchHistory.length > 0 && (
                  <button
                    onClick={() => {
                      storageService.clearWatchHistory();
                      setWatchHistory([]);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Geçmişi Temizle
                  </button>
                )}
              </div>

              {watchHistory.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
                  <HistoryIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm font-medium">İzleme geçmişiniz henüz boş.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {watchHistory.map((item) => {
                    const percent = item.durationSeconds > 0 
                      ? Math.min(100, Math.round((item.lastPositionSeconds / item.durationSeconds) * 100))
                      : 0;

                    return (
                      <div
                        key={item.id}
                        onClick={() => handlePlayHistoryItem(item)}
                        className="group p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-400 cursor-pointer transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 mb-3 flex items-center justify-center">
                            {item.poster && item.poster.trim() !== '' ? (
                              <img src={item.poster} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            ) : (
                              <Film className="w-8 h-8 text-slate-700" />
                            )}
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-cyan-900/30 flex items-center justify-center transition-colors">
                              <Play className="w-8 h-8 text-white fill-current opacity-90 group-hover:scale-110 transition-transform" />
                            </div>

                            {/* Progress bar */}
                            {percent > 0 && (
                              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/60">
                                <div className="h-full bg-cyan-400" style={{ width: `${percent}%` }} />
                              </div>
                            )}
                          </div>

                          <h4 className="font-bold text-sm text-white truncate group-hover:text-cyan-300 transition-colors">
                            {item.title}
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">{item.category || 'Medya Akışı'}</p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                          <span>{percent > 0 ? `%${percent} izlendi` : 'İzlendi'}</span>
                          <span className="text-cyan-400 font-bold flex items-center gap-1">
                            <Play className="w-3 h-3 fill-current" /> Devam Et
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB: LIVE TV, MOVIES & SERIES CATEGORIES */}
          {(activeTab === 'live' || activeTab === 'movies' || activeTab === 'series') && (
            <div className="space-y-6">
              {/* Category Pills Bar */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat.category_id}
                    onClick={() => setSelectedCategory(cat.category_id)}
                    className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                      selectedCategory === cat.category_id
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25 scale-[1.02]'
                        : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
                    }`}
                  >
                    <span>{cat.category_name}</span>
                  </button>
                ))}
              </div>

              {/* LIVE TV CHANNELS VIEW */}
              {activeTab === 'live' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                      Canlı Kanallar ({filteredLive.length})
                    </h3>
                    <span className="text-xs text-slate-500 font-mono">
                      Donanım Hızlandırma & Kesintisiz Buffer Aktif
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredLive.map((ch) => {
                      const isFav = favorites.includes(`live_${ch.stream_id}`);

                      return (
                        <div
                          key={ch.stream_id}
                          tabIndex={0}
                          role="button"
                          onClick={() => playLiveItem(ch)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              playLiveItem(ch);
                            }
                          }}
                          className="group p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-400 hover:bg-slate-850 focus:outline-none focus:ring-4 focus:ring-cyan-400 focus:scale-[1.03] focus:border-cyan-400 focus:bg-slate-800 cursor-pointer transition-all flex items-center justify-between gap-3 shadow-md"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            {/* Logo */}
                            <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 p-1 flex items-center justify-center shrink-0 overflow-hidden group-hover:border-cyan-500/50 group-focus:border-cyan-400 transition-colors">
                              {ch.stream_icon && ch.stream_icon.trim() !== '' ? (
                                <img src={ch.stream_icon} alt={ch.name} className="w-full h-full object-cover rounded-xl" />
                              ) : (
                                <Radio className="w-6 h-6 text-cyan-400" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">CANLI</span>
                                <span className="text-[10px] text-slate-500 font-mono">#{ch.stream_id}</span>
                              </div>
                              <h4 className="font-bold text-sm text-white truncate group-hover:text-cyan-300 group-focus:text-cyan-300 transition-colors">
                                {ch.name}
                              </h4>
                              <p className="text-xs text-slate-400 truncate mt-0.5">
                                {ch.current_program || ch.resolution || 'Canlı Yayın'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => handleToggleFavorite(`live_${ch.stream_id}`, e)}
                              className={`p-2 rounded-xl border transition-all ${
                                isFav 
                                  ? 'bg-pink-950/60 border-pink-700 text-pink-400' 
                                  : 'bg-slate-950/60 border-slate-800 text-slate-500 hover:text-white'
                              }`}
                              title="Favori"
                            >
                              <Heart className={`w-4 h-4 ${isFav ? 'fill-pink-400' : ''}`} />
                            </button>

                            <div className="w-9 h-9 rounded-xl bg-cyan-500 group-hover:bg-cyan-400 text-slate-950 flex items-center justify-center transition-all shadow-md shadow-cyan-500/20">
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* VOD MOVIES VIEW */}
              {activeTab === 'movies' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                      Filmler & Vizyon ({filteredVod.length})
                    </h3>

                    {/* Sorting */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Sırala:</span>
                      <button
                        onClick={() => setSortBy('default')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          sortBy === 'default' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        Varsayılan
                      </button>
                      <button
                        onClick={() => setSortBy('rating')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          sortBy === 'rating' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        IMDb Puanı
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {filteredVod.map((vod) => {
                      const isFav = favorites.includes(`vod_${vod.stream_id}`);

                      return (
                        <div
                          key={vod.stream_id}
                          tabIndex={0}
                          role="button"
                          onClick={() => playVodItem(vod)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              playVodItem(vod);
                            }
                          }}
                          className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-400 focus:scale-[1.03] focus:border-cyan-400 cursor-pointer transition-all flex flex-col justify-between"
                        >
                          <div className="relative aspect-2/3 bg-slate-950 overflow-hidden flex items-center justify-center">
                            {vod.stream_icon && vod.stream_icon.trim() !== '' ? (
                              <img
                                src={vod.stream_icon}
                                alt={vod.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <Film className="w-10 h-10 text-slate-700" />
                            )}
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-cyan-900/30 group-focus:bg-cyan-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity">
                              <div className="w-12 h-12 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow-lg">
                                <Play className="w-6 h-6 fill-current ml-0.5" />
                              </div>
                            </div>

                            {/* Badges */}
                            <div className="absolute top-2 left-2 flex gap-1">
                              {vod.rating && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-black/80 text-amber-400 border border-amber-500/40 flex items-center gap-0.5">
                                  <Star className="w-3 h-3 fill-current" />
                                  {vod.rating}
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={(e) => handleToggleFavorite(`vod_${vod.stream_id}`, e)}
                              className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 text-slate-400 hover:text-pink-400 transition-all"
                            >
                              <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-pink-400 text-pink-400' : ''}`} />
                            </button>
                          </div>

                          <div className="p-3">
                            <h4 className="font-bold text-xs text-white truncate group-hover:text-cyan-300 group-focus:text-cyan-300 transition-colors">
                              {vod.name}
                            </h4>
                            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                              <span>{vod.year || '2024'}</span>
                              <span>{vod.duration || 'HD'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SERIES VIEW */}
              {activeTab === 'series' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                      Diziler & Sezonlar ({filteredSeries.length})
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {filteredSeries.map((s) => {
                      const isFav = favorites.includes(`series_${s.series_id}`);

                      return (
                        <div
                          key={s.series_id}
                          tabIndex={0}
                          role="button"
                          onClick={() => {
                            setSelectedSeries(s);
                            setIsSeriesModalOpen(true);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelectedSeries(s);
                              setIsSeriesModalOpen(true);
                            }
                          }}
                          className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-400 focus:scale-[1.03] focus:border-cyan-400 cursor-pointer transition-all flex flex-col justify-between"
                        >
                          <div className="relative aspect-2/3 bg-slate-950 overflow-hidden flex items-center justify-center">
                            {s.cover && s.cover.trim() !== '' ? (
                              <img
                                src={s.cover}
                                alt={s.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <Clapperboard className="w-10 h-10 text-slate-700" />
                            )}
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-cyan-900/30 group-focus:bg-cyan-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity">
                              <span className="px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold uppercase tracking-wider">
                                Sezonları İncele
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => handleToggleFavorite(`series_${s.series_id}`, e)}
                              className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 text-slate-400 hover:text-pink-400 transition-all"
                            >
                              <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-pink-400 text-pink-400' : ''}`} />
                            </button>
                          </div>

                          <div className="p-3">
                            <h4 className="font-bold text-xs text-white truncate group-hover:text-cyan-300 group-focus:text-cyan-300 transition-colors">
                              {s.name}
                            </h4>
                            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                              <span>{s.releaseDate || 'Dizi'}</span>
                              <span className="text-amber-400 font-bold flex items-center gap-0.5">
                                <Star className="w-3 h-3 fill-current" />
                                {s.rating || '8.5'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ACTIVE VIDEO PLAYER MODAL / OVERLAY */}
      {activePlayback && (
        <LivePlayer
          streamUrl={activePlayback.url}
          streamUrlTs={activePlayback.urlTs}
          title={activePlayback.title}
          streamType={activePlayback.streamType}
          streamId={activePlayback.streamId}
          poster={activePlayback.poster}
          category={activePlayback.category}
          settings={playerSettings}
          onUpdateSettings={setPlayerSettings}
          onClose={() => {
            setActivePlayback(null);
            setWatchHistory(storageService.getWatchHistory());
          }}
          onNextChannel={handleNextChannel}
          onPrevChannel={handlePrevChannel}
          channels={liveStreams.map((s, idx) => ({
            id: String(s.stream_id),
            name: s.name,
            icon: s.stream_icon,
            number: idx + 1,
            raw: s,
          }))}
          onSelectChannel={(ch) => playLiveItem(ch)}
        />
      )}

      {/* XTREAM CONFIG MODAL */}
      <XtreamConfigModal
        isOpen={isXtreamModalOpen}
        onClose={() => setIsXtreamModalOpen(false)}
        currentConfig={xtreamConfig}
        userInfo={userInfo}
        serverInfo={serverInfo}
        onSave={(newCfg) => {
          setXtreamConfig(newCfg);
          handleConnectXtream(newCfg);
        }}
      />

      {/* COMPREHENSIVE SETTINGS MODAL */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={playerSettings}
        onUpdateSettings={setPlayerSettings}
        onOpenDownloadModal={() => setIsDownloadModalOpen(true)}
      />

      {/* ZIP DOWNLOAD MODAL */}
      <ZipDownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />

      {/* SERIES SEASONS & EPISODES MODAL */}
      <SeriesDetailModal
        series={selectedSeries}
        isOpen={isSeriesModalOpen}
        onClose={() => setIsSeriesModalOpen(false)}
        onPlayEpisode={handlePlaySeriesEpisode}
        xtreamConfig={xtreamConfig}
      />

      {/* VIRTUAL ANDROID TV REMOTE CONTROLLER */}
      <VirtualRemote
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenXtreamConfig={() => setIsXtreamModalOpen(true)}
      />
    </div>
  );
}
