import React, { useEffect, useState } from 'react';
import { Play, X, Star, Calendar, Clock, Film, Sparkles } from 'lucide-react';
import { SeriesEpisode, SeriesItem, XtreamCredentials } from '../types';
import { xtreamService } from '../services/xtreamService';

interface SeriesDetailModalProps {
  series: SeriesItem | null;
  isOpen: boolean;
  onClose: () => void;
  onPlayEpisode: (episode: SeriesEpisode, series: SeriesItem) => void;
  xtreamConfig: XtreamCredentials;
}

export const SeriesDetailModal: React.FC<SeriesDetailModalProps> = ({
  series,
  isOpen,
  onClose,
  onPlayEpisode,
  xtreamConfig,
}) => {
  const [episodes, setEpisodes] = useState<SeriesEpisode[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);

  useEffect(() => {
    if (!series || !isOpen) return;

    setIsLoading(true);
    xtreamService.getSeriesInfo(xtreamConfig, series.series_id).then((epList) => {
      setEpisodes(epList);
      setIsLoading(false);
    });
  }, [series, isOpen, xtreamConfig]);

  if (!isOpen || !series) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl flex flex-col overflow-hidden">
        {/* Header with Close */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800 shrink-0">
          <div className="flex gap-4">
            <div className="w-24 h-36 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700 flex items-center justify-center">
              {series.cover && series.cover.trim() !== '' ? (
                <img src={series.cover} alt={series.name} className="w-full h-full object-cover" />
              ) : (
                <Film className="w-8 h-8 text-slate-600" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold">
                  DİZİ ARŞİVİ
                </span>
                <span className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  {series.rating || '8.5'}
                </span>
                {series.releaseDate && (
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {series.releaseDate}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-black text-white">{series.name}</h2>
              <p className="text-xs text-cyan-400 font-medium mt-0.5">{series.genre}</p>
              <p className="text-xs text-slate-400 mt-2 max-w-xl leading-relaxed">{series.plot}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Season Selector */}
        <div className="flex items-center gap-2 py-4 border-b border-slate-800 shrink-0">
          {[1, 2].map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSeason(s)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedSeason === s
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Sezon {s}
            </button>
          ))}
        </div>

        {/* Episodes List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Sezon {selectedSeason} Bölümleri ({episodes.length} Bölüm)
          </h3>

          {isLoading ? (
            <div className="py-12 text-center text-cyan-400 font-semibold text-sm">
              Bölümler yükleniyor...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {episodes.map((ep) => (
                <div
                  key={ep.id}
                  onClick={() => onPlayEpisode(ep, series)}
                  className="group p-3 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-cyan-400 transition-all cursor-pointer flex gap-3 items-center"
                >
                  <div className="relative w-28 aspect-video rounded-xl overflow-hidden bg-slate-800 shrink-0 flex items-center justify-center">
                    {(ep.info?.movie_image && ep.info.movie_image.trim() !== '') || (series.cover && series.cover.trim() !== '') ? (
                      <img
                        src={(ep.info?.movie_image && ep.info.movie_image.trim() !== '') ? ep.info.movie_image : series.cover}
                        alt={ep.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <Film className="w-6 h-6 text-slate-600" />
                    )}
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-cyan-900/30 flex items-center justify-center transition-colors">
                      <Play className="w-6 h-6 text-white group-hover:scale-110 fill-current transition-transform" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-bold text-cyan-400">Bölüm {ep.episode_num}</span>
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Clock className="w-3 h-3" />
                        {ep.info?.duration || '55 dk'}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-white truncate mt-0.5 group-hover:text-cyan-300 transition-colors">
                      {ep.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-1">{ep.info?.plot}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
