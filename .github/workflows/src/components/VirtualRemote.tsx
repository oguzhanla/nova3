import React, { useState } from 'react';
import { 
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, CornerDownLeft, 
  Home, Menu, Volume2, VolumeX, Tv, X, Power, Radio, Minimize2, Maximize2
} from 'lucide-react';

interface VirtualRemoteProps {
  onKeyPress?: (key: string) => void;
  onOpenSettings?: () => void;
  onOpenXtreamConfig?: () => void;
}

export const VirtualRemote: React.FC<VirtualRemoteProps> = ({
  onKeyPress,
  onOpenSettings,
  onOpenXtreamConfig,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const simulateKey = (key: string, code: string) => {
    if (onKeyPress) onKeyPress(key);
    window.dispatchEvent(new KeyboardEvent('keydown', { key, code, bubbles: true }));
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 px-4 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-2xl shadow-cyan-500/30 transition-all hover:scale-105"
        title="Android TV Kumandasını Aç"
      >
        <Tv className="w-4 h-4 fill-current" />
        <span>TV Kumandası</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-64 bg-slate-950/95 border-2 border-cyan-500/50 rounded-3xl p-5 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5">
      {/* Remote Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Android TV Box IR</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* D-PAD Navigation Circle */}
      <div className="my-5 flex items-center justify-center">
        <div className="relative w-44 h-44 rounded-full bg-slate-900 border-2 border-slate-800 shadow-inner flex items-center justify-center">
          {/* UP Button */}
          <button
            onClick={() => simulateKey('ArrowUp', 'ArrowUp')}
            className="absolute top-1.5 left-1/2 -translate-x-1/2 w-14 h-11 rounded-t-full bg-slate-800 hover:bg-cyan-600 active:bg-cyan-500 text-slate-300 hover:text-slate-950 flex items-center justify-center transition-all shadow-sm"
            title="Yukarı (ArrowUp)"
          >
            <ChevronUp className="w-6 h-6" />
          </button>

          {/* DOWN Button */}
          <button
            onClick={() => simulateKey('ArrowDown', 'ArrowDown')}
            className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-14 h-11 rounded-b-full bg-slate-800 hover:bg-cyan-600 active:bg-cyan-500 text-slate-300 hover:text-slate-950 flex items-center justify-center transition-all shadow-sm"
            title="Aşağı (ArrowDown)"
          >
            <ChevronDown className="w-6 h-6" />
          </button>

          {/* LEFT Button */}
          <button
            onClick={() => simulateKey('ArrowLeft', 'ArrowLeft')}
            className="absolute left-1.5 top-1/2 -translate-y-1/2 h-14 w-11 rounded-l-full bg-slate-800 hover:bg-cyan-600 active:bg-cyan-500 text-slate-300 hover:text-slate-950 flex items-center justify-center transition-all shadow-sm"
            title="Sol (ArrowLeft)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* RIGHT Button */}
          <button
            onClick={() => simulateKey('ArrowRight', 'ArrowRight')}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-14 w-11 rounded-r-full bg-slate-800 hover:bg-cyan-600 active:bg-cyan-500 text-slate-300 hover:text-slate-950 flex items-center justify-center transition-all shadow-sm"
            title="Sağ (ArrowRight)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* OK / Center Button */}
          <button
            onClick={() => simulateKey('Enter', 'Enter')}
            className="w-16 h-16 rounded-full bg-linear-to-tr from-cyan-500 to-blue-600 active:scale-95 text-slate-950 font-black text-sm tracking-wider flex items-center justify-center shadow-lg shadow-cyan-500/30 transition-transform"
            title="Seç / Oynat (Enter)"
          >
            OK
          </button>
        </div>
      </div>

      {/* Function Buttons Row: BACK, HOME, MENU */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
        <button
          onClick={() => simulateKey('Escape', 'Escape')}
          className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-cyan-900/60 text-slate-300 hover:text-cyan-400 border border-slate-800 flex flex-col items-center gap-1 transition-all"
          title="Geri Dön (ESC/BACK)"
        >
          <CornerDownLeft className="w-4 h-4" />
          <span className="text-[10px] font-bold">GERİ</span>
        </button>

        <button
          onClick={() => simulateKey('h', 'KeyH')}
          className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-cyan-900/60 text-slate-300 hover:text-cyan-400 border border-slate-800 flex flex-col items-center gap-1 transition-all"
          title="Ana Menü"
        >
          <Home className="w-4 h-4" />
          <span className="text-[10px] font-bold">ANA MENÜ</span>
        </button>

        <button
          onClick={() => onOpenSettings && onOpenSettings()}
          className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-cyan-900/60 text-slate-300 hover:text-cyan-400 border border-slate-800 flex flex-col items-center gap-1 transition-all"
          title="Ayarlar Menüsü"
        >
          <Menu className="w-4 h-4" />
          <span className="text-[10px] font-bold">AYARLAR</span>
        </button>
      </div>

      {/* Bottom info */}
      <div className="mt-3 text-[10px] text-center text-slate-500">
        Klavyedeki <kbd className="text-cyan-400">Yön Tuşları</kbd> ve <kbd className="text-cyan-400">ENTER</kbd> tuşlarını da kullanabilirsiniz.
      </div>
    </div>
  );
};
