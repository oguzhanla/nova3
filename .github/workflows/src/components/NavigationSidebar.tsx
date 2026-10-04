import React, { useEffect, useState } from 'react';
import { 
  Tv, Film, Clapperboard, FolderGit2, Heart, History, Settings, 
  Server, ShieldCheck, Wifi, Radio, Zap, Download
} from 'lucide-react';
import { XtreamCredentials } from '../types';

export type NavTab = 'live' | 'movies' | 'series' | 'cloudstream' | 'favorites' | 'history';

interface NavigationSidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenXtreamConfig: () => void;
  onOpenSettings: () => void;
  onOpenDownloadModal?: () => void;
  xtreamConfig: XtreamCredentials;
  isConnected: boolean;
  favoritesCount: number;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenXtreamConfig,
  onOpenSettings,
  onOpenDownloadModal,
  xtreamConfig,
  isConnected,
  favoritesCount,
}) => {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'live' as const, label: 'Canlı TV', icon: Radio, count: '30+' },
    { id: 'movies' as const, label: 'Filmler', icon: Film, count: 'VOD' },
    { id: 'series' as const, label: 'Diziler', icon: Clapperboard, count: 'HD' },
    { id: 'cloudstream' as const, label: 'Eklentiler', icon: FolderGit2, badge: 'Repo' },
    { id: 'favorites' as const, label: 'Favoriler', icon: Heart, count: favoritesCount.toString() },
    { id: 'history' as const, label: 'Geçmiş', icon: History },
  ];

  return (
    <aside className="w-64 bg-slate-950/90 border-r border-slate-800/80 flex flex-col justify-between p-4 shrink-0 select-none">
      {/* Brand & Connection Header */}
      <div>
        <div className="flex items-center gap-3 px-2 py-2 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/20">
            <Tv className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5">
              NovaStream
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                TV
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">Android Box & IPTV Hub</p>
          </div>
        </div>

        {/* Server Status Pill */}
        <div 
          onClick={onOpenXtreamConfig}
          className="mb-6 p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-all group"
          title="Xtream Codes Sunucu Ayarları"
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <div className="flex items-center gap-1.5 text-slate-300 font-bold">
              <Server className="w-3.5 h-3.5 text-cyan-400" />
              <span className="truncate max-w-[110px]">{xtreamConfig.username || 'Xtream Codes'}</span>
            </div>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          </div>
          <div className="text-[10px] text-slate-400 font-mono truncate group-hover:text-cyan-300 transition-colors">
            {xtreamConfig.server.replace('http://', '').replace('https://', '')}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all focus:outline-none focus:ring-4 focus:ring-cyan-400 focus:scale-[1.03] ${
                  isActive
                    ? 'bg-linear-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/20 font-extrabold scale-[1.02]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-slate-950 stroke-[2.2]' : 'text-slate-400'}`} />
                  <span className="text-sm">{item.label}</span>
                </div>

                {item.count && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}>
                    {item.count}
                  </span>
                )}

                {item.badge && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    isActive ? 'bg-slate-950 text-cyan-300' : 'bg-cyan-950 text-cyan-300 border border-cyan-800/60'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer & Settings */}
      <div className="pt-4 border-t border-slate-800/80 space-y-2">
        <button
          type="button"
          onClick={onOpenDownloadModal}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 hover:text-white transition-all text-xs font-bold group cursor-pointer"
          title="Tüm kaynak kodunu ZIP olarak indir"
        >
          <div className="flex items-center gap-2.5">
            <Download className="w-4 h-4 text-cyan-400 group-hover:translate-y-0.5 transition-transform" />
            <span>Projeyi ZIP İndir</span>
          </div>
          <span className="text-[10px] bg-cyan-500/20 px-1.5 py-0.5 rounded text-cyan-300 font-mono">ZIP</span>
        </button>

        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-all text-xs font-bold"
        >
          <Settings className="w-4 h-4 text-cyan-400" />
          <span>Oynatıcı Ayarları</span>
        </button>

        {/* Clock & HW indicator */}
        <div className="flex items-center justify-between px-3 pt-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 font-mono text-cyan-300 font-bold text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            {time}
          </div>

          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
            <Zap className="w-3 h-3" />
            HW+ Hazır
          </div>
        </div>
      </div>
    </aside>
  );
};
