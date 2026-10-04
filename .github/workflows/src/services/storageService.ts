import { DEFAULT_BUILTIN_PLUGINS, DEFAULT_CLOUDSTREAM_REPOS, DEFAULT_PLAYER_SETTINGS, DEFAULT_XTREAM_CREDENTIALS } from '../constants/defaults';
import { CloudStreamPlugin, CloudStreamRepo, PlayerSettings, WatchHistoryItem, XtreamCredentials } from '../types';

const STORAGE_KEYS = {
  XTREAM_CONFIG: 'novastream_xtream_config',
  CLOUDSTREAM_REPOS: 'novastream_cloudstream_repos',
  INSTALLED_PLUGINS: 'novastream_installed_plugins',
  FAVORITES: 'novastream_favorites',
  WATCH_HISTORY: 'novastream_watch_history',
  SETTINGS: 'novastream_player_settings',
};

export const storageService = {
  getXtreamConfig(): XtreamCredentials {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.XTREAM_CONFIG);
      return data ? JSON.parse(data) : DEFAULT_XTREAM_CREDENTIALS;
    } catch {
      return DEFAULT_XTREAM_CREDENTIALS;
    }
  },

  setXtreamConfig(config: XtreamCredentials): void {
    localStorage.setItem(STORAGE_KEYS.XTREAM_CONFIG, JSON.stringify(config));
  },

  getCloudStreamRepos(): CloudStreamRepo[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CLOUDSTREAM_REPOS);
      return data ? JSON.parse(data) : DEFAULT_CLOUDSTREAM_REPOS;
    } catch {
      return DEFAULT_CLOUDSTREAM_REPOS;
    }
  },

  setCloudStreamRepos(repos: CloudStreamRepo[]): void {
    localStorage.setItem(STORAGE_KEYS.CLOUDSTREAM_REPOS, JSON.stringify(repos));
  },

  getInstalledPlugins(): CloudStreamPlugin[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INSTALLED_PLUGINS);
      const existing: CloudStreamPlugin[] = data ? JSON.parse(data) : [];

      // Auto-merge with ALL built-in turnkey plugins so nothing is missing
      const existingIds = new Set(existing.map(p => p.id));
      const merged = [...existing];

      for (const builtin of DEFAULT_BUILTIN_PLUGINS) {
        if (!existingIds.has(builtin.id)) {
          merged.push(builtin);
        }
      }

      return merged.length > 0 ? merged : DEFAULT_BUILTIN_PLUGINS;
    } catch {
      return DEFAULT_BUILTIN_PLUGINS;
    }
  },

  setInstalledPlugins(plugins: CloudStreamPlugin[]): void {
    localStorage.setItem(STORAGE_KEYS.INSTALLED_PLUGINS, JSON.stringify(plugins));
  },

  getFavorites(): string[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      return data ? JSON.parse(data) : ['live_1', 'live_2', 'vod_1', 'series_1'];
    } catch {
      return [];
    }
  },

  toggleFavorite(id: string): boolean {
    const favorites = this.getFavorites();
    const index = favorites.indexOf(id);
    let isNowFavorite = false;
    if (index > -1) {
      favorites.splice(index, 1);
      isNowFavorite = false;
    } else {
      favorites.push(id);
      isNowFavorite = true;
    }
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    return isNowFavorite;
  },

  isFavorite(id: string): boolean {
    const favorites = this.getFavorites();
    return favorites.includes(id);
  },

  getWatchHistory(): WatchHistoryItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WATCH_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveWatchHistory(item: WatchHistoryItem): void {
    const history = this.getWatchHistory().filter(h => h.id !== item.id);
    history.unshift(item);
    // Keep max 40 items
    if (history.length > 40) history.pop();
    localStorage.setItem(STORAGE_KEYS.WATCH_HISTORY, JSON.stringify(history));
  },

  clearWatchHistory(): void {
    localStorage.removeItem(STORAGE_KEYS.WATCH_HISTORY);
  },

  getPlayerSettings(): PlayerSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_PLAYER_SETTINGS, ...JSON.parse(data) } : DEFAULT_PLAYER_SETTINGS;
    } catch {
      return DEFAULT_PLAYER_SETTINGS;
    }
  },

  setPlayerSettings(settings: PlayerSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },
};
