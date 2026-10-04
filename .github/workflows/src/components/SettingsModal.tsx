import React from 'react';
import { 
  X, Cpu, Zap, Sliders, Volume2, Subtitles, Monitor, Palette, 
  RotateCcw, Sparkles, Check, Info, Download
} from 'lucide-react';
import { BUFFER_PRESETS, DEFAULT_PLAYER_SETTINGS } from '../constants/defaults';
import { AutoFrameRate, BufferSize, PlayerEngine, PlayerSettings } from '../types';
import { storageService } from '../services/storageService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PlayerSettings;
  onUpdateSettings: (settings: PlayerSettings) => void;
  onOpenDownloadModal?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onOpenDownloadModal,
}) => {
  if (!isOpen) return null;

  const handleUpdate = (partial: Partial<PlayerSettings>) => {
    const updated = { ...settings, ...partial };
    onUpdateSettings(updated);
    storageService.setPlayerSettings(updated);
  };

  const handleResetDefaults = () => {
    onUpdateSettings(DEFAULT_PLAYER_SETTINGS);
    storageService.setPlayerSettings(DEFAULT_PLAYER_SETTINGS);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Android TV Medya & Oynatıcı Ayarları</h2>
              <p className="text-xs text-slate-400">Kodek, donanım hızlandırma, arabellek ve görüntü optimizasyonu</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6 pr-1">
          {/* Section: Player Engine (ExoPlayer vs VLC) */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Oynatıcı Altyapısı (Playback Engine)</h3>
              </div>
              <span className="text-xs text-cyan-400 font-mono font-bold uppercase">{settings.engine}</span>
            </div>
            <p className="text-xs text-slate-400">
              Düşük donanımlı Android TV Box cihazlarda en yüksek FPS ve en az CPU kullanımı için motor seçimi:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div
                onClick={() => handleUpdate({ engine: 'exoplayer' })}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  settings.engine === 'exoplayer'
                    ? 'bg-cyan-950/40 border-cyan-400 text-white shadow-md shadow-cyan-950/50'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-xs text-white">
                  <span>Google ExoPlayer</span>
                  {settings.engine === 'exoplayer' && <Check className="w-4 h-4 text-cyan-400" />}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Android TV standartı. Düşük gecikmeli HLS, ABR adaptif kalite ve akıcı kanal geçişleri.
                </p>
              </div>

              <div
                onClick={() => handleUpdate({ engine: 'vlc' })}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  settings.engine === 'vlc'
                    ? 'bg-cyan-950/40 border-cyan-400 text-white shadow-md shadow-cyan-950/50'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-xs text-white">
                  <span>VLC (LibVLC)</span>
                  {settings.engine === 'vlc' && <Check className="w-4 h-4 text-cyan-400" />}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Evrensel kodek motoru (AC3, E-AC3, DTS, MKV). Hatalı veya özel formatlı IPTV akışlarını onarır.
                </p>
              </div>
            </div>
          </div>

          {/* Section: Buffer Size Customization */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Özelleştirilebilir Arabellek Boyutu (Buffer Size)</h3>
              </div>
              <span className="text-xs text-amber-400 font-bold">
                {BUFFER_PRESETS[settings.bufferSize]?.label}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Yayın donmalarını önlemek için tampon süresini "Yok" seviyesinden "Çok Büyük" seviyesine kadar ayarlayın:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1">
              {(Object.keys(BUFFER_PRESETS) as BufferSize[]).map((key) => {
                const item = BUFFER_PRESETS[key];
                const isSelected = settings.bufferSize === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleUpdate({ bufferSize: key })}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-white">{item.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{item.seconds}s Tampon</div>
                  </button>
                );
              })}
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{BUFFER_PRESETS[settings.bufferSize]?.description}</span>
            </div>
          </div>

          {/* Section: Hardware Acceleration & Codecs */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Donanım Hızlandırma & Kare Hızı (AFR)</h3>
            </div>

            {/* HW+ switch */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <div className="text-xs font-bold text-white">Donanımsal Hızlandırma (HW+ Decoder)</div>
                <div className="text-[11px] text-slate-400">
                  GPU (Grafik İşlemci) donanım dekoderini zorlayarak işlemci ısınmasını ve CPU kullanımını düşürür.
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleUpdate({ hardwareAcceleration: !settings.hardwareAcceleration })}
                className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ml-4 ${
                  settings.hardwareAcceleration ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  settings.hardwareAcceleration ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Auto Frame Rate (AFR) */}
            <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-white">Otomatik Kare Hızı Eşitleme (Auto Frame Rate - AFR)</div>
                <div className="text-[11px] text-slate-400">
                  Televizyon panelinin yenileme hızını içeriğe göre senkronize ederek takılmaları (judder) önler.
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                {[
                  { id: 'off', label: 'Kapalı' },
                  { id: 'match_24', label: '24Hz (Sinema)' },
                  { id: 'match_50', label: '50Hz (TR Spor)' },
                  { id: 'match_60', label: '60Hz' },
                ].map((afr) => (
                  <button
                    key={afr.id}
                    type="button"
                    onClick={() => handleUpdate({ autoFrameRate: afr.id as AutoFrameRate })}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      settings.autoFrameRate === afr.id
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {afr.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto Quality (ABR) */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">Dinamik Adaptif Kalite (Auto ABR)</div>
                <div className="text-[11px] text-slate-400">
                  İnternet hızınız düştüğünde donmayı önlemek için çözünürlüğü otomatik ölçekler.
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleUpdate({ autoQuality: !settings.autoQuality })}
                className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ml-4 ${
                  settings.autoQuality ? 'bg-cyan-500' : 'bg-slate-700'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  settings.autoQuality ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>

          {/* Section: Audio Codecs & Night Dialogue Boost */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white">Ses Kodekleri & Diyalog Güçlendirme</h3>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                <div className="text-xs font-bold text-white">Diyalog Netleştirici & Gece Modu (Dialogue Booster)</div>
                <div className="text-[11px] text-slate-400">
                  Patlama ve müzik seslerini dengeler, insan konuşma frekanslarını %150 öne çıkarır.
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleUpdate({ audioDialogueBoost: !settings.audioDialogueBoost })}
                className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ml-4 ${
                  settings.audioDialogueBoost ? 'bg-cyan-500' : 'bg-slate-700'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  settings.audioDialogueBoost ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>

          {/* Section: UI Dark Mode & Overscan */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-pink-400" />
              <h3 className="text-sm font-bold text-white">Karanlık Mod & TV Ekran Güvenli Alanı</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: 'oled-black', label: 'Derin OLED Siyahı', color: 'bg-black' },
                { id: 'titanium', label: 'Titanyum Koyu Gri', color: 'bg-slate-900' },
                { id: 'deep-navy', label: 'Gece Mavisi (TV)', color: 'bg-[#0b1329]' },
              ].map((thm) => (
                <button
                  key={thm.id}
                  type="button"
                  onClick={() => handleUpdate({ theme: thm.id as any })}
                  className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all ${
                    settings.theme === thm.id
                      ? 'border-cyan-400 bg-cyan-950/30 text-white font-bold'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border border-slate-700 ${thm.color}`} />
                  <span className="text-xs">{thm.label}</span>
                </button>
              ))}
            </div>

            {/* Overscan slider */}
            <div className="pt-3 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-300 font-semibold">TV Kenar Taşması (Overscan Payı):</span>
                <span className="font-mono text-cyan-400 font-bold">%{settings.overscanMargin}</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="1"
                value={settings.overscanMargin}
                onChange={(e) => handleUpdate({ overscanMargin: parseInt(e.target.value) })}
                className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-slate-500">
                Eski TV ekranlarında köşelerin kırpılmasını önler.
              </span>
            </div>
          </div>

          {/* Section: Project Source Code ZIP Download */}
          <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Tüm Proje Kaynak Kodunu İndir (.ZIP)</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Tüm bileşenleri, API tünelleme sunucusunu ve Android TV konfigürasyonlarını içeren hazır zip arşivi.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenDownloadModal?.();
              }}
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 whitespace-nowrap transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>novastream-tv.zip İndir</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Fabrika Ayarlarına Dön
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-cyan-500/25"
          >
            Tamam & Kaydet
          </button>
        </div>
      </div>
    </div>
  );
};
