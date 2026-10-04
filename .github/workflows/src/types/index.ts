export type StreamType = 'live' | 'movie' | 'series';

export interface XtreamCredentials {
  server: string;
  username: string;
  password: string;
}

export interface XtreamUserInfo {
  username: string;
  status: string;
  exp_date: string;
  is_trial: string;
  active_cons: string;
  max_connections: string;
  created_at: string;
  allowed_output_formats?: string[];
}

export interface XtreamServerInfo {
  url: string;
  port: string;
  https_port?: string;
  server_protocol: string;
  rtmp_port?: string;
  timezone: string;
  time_now: string;
}

export interface Category {
  category_id: string;
  category_name: string;
  parent_id?: number;
}

export interface LiveStreamItem {
  num?: number;
  name: string;
  stream_type: 'live';
  stream_id: number | string;
  stream_icon?: string;
  epg_channel_id?: string;
  added?: string;
  category_id: string;
  custom_sid?: string;
  tv_archive?: number;
  direct_source?: string;
  stream_url?: string;
  stream_url_ts?: string;
  resolution?: string;
  current_program?: string;
}

export interface VodItem {
  num?: number;
  name: string;
  stream_type: 'movie';
  stream_id: number | string;
  stream_icon?: string;
  rating?: string | number;
  rating_5based?: number;
  added?: string;
  category_id: string;
  container_extension?: string;
  custom_sid?: string;
  direct_source?: string;
  year?: string;
  genre?: string;
  plot?: string;
  duration?: string;
  stream_url?: string;
}

export interface SeriesItem {
  num?: number;
  name: string;
  series_id: number | string;
  cover?: string;
  plot?: string;
  cast?: string;
  director?: string;
  genre?: string;
  releaseDate?: string;
  last_modified?: string;
  rating?: string | number;
  rating_5based?: number;
  backdrop_path?: string[];
  youtube_trailer?: string;
  episode_run_time?: string;
  category_id: string;
  seasons?: SeriesSeason[];
}

export interface SeriesSeason {
  season_number: number;
  name: string;
  episode_count: number;
  air_date?: string;
  cover?: string;
  episodes?: SeriesEpisode[];
}

export interface SeriesEpisode {
  id: string | number;
  episode_num: number;
  season: number;
  title: string;
  container_extension?: string;
  info?: {
    plot?: string;
    duration?: string;
    releasedate?: string;
    rating?: number;
    movie_image?: string;
  };
  stream_url?: string;
}

export interface CloudStreamRepo {
  id: string;
  name: string;
  url: string;
  icon?: string;
  description?: string;
  author?: string;
  pluginCount?: number;
  isCustom?: boolean;
}

export interface CloudStreamPlugin {
  id: string;
  repoId: string;
  name: string;
  version: string;
  author: string;
  description: string;
  iconUrl?: string;
  types: ('movie' | 'tv' | 'anime' | 'sports' | 'live')[];
  downloadUrl?: string;
  isInstalled: boolean;
  status?: 'ready' | 'installing' | 'updated';
  contentPreview?: CloudStreamContent[];
}

export interface CloudStreamContent {
  id: string;
  title: string;
  poster: string;
  type: 'movie' | 'tv' | 'live';
  quality: string;
  streamUrl: string;
  description?: string;
  sourcePlugin: string;
}

export type PlayerEngine = 'exoplayer' | 'vlc';
export type BufferSize = 'none' | 'small' | 'standard' | 'large' | 'very_large';
export type VideoQuality = 'auto' | '1080p' | '720p' | '576p' | '480p';
export type AutoFrameRate = 'off' | 'match_24' | 'match_50' | 'match_60';

export interface PlayerSettings {
  engine: PlayerEngine;
  bufferSize: BufferSize;
  hardwareAcceleration: boolean;
  autoFrameRate: AutoFrameRate;
  autoQuality: boolean;
  audioDialogueBoost: boolean;
  audioDelayMs: number;
  subtitleSize: 'small' | 'medium' | 'large';
  subtitleColor: 'yellow' | 'white' | 'cyan';
  subtitleBg: boolean;
  overscanMargin: number; // 0% to 5%
  theme: 'oled-black' | 'titanium' | 'deep-navy';
}

export interface WatchHistoryItem {
  id: string;
  title: string;
  streamUrl: string;
  streamType: StreamType;
  poster?: string;
  category?: string;
  lastPositionSeconds: number;
  durationSeconds: number;
  watchedAt: number;
}
