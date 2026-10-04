import React, { useState, useEffect } from 'react';
import { 
  X, Download, Copy, Check, ExternalLink, Archive, FileCode, 
  Terminal, Sparkles, AlertCircle, RefreshCw, Smartphone, Tv, Play, ChevronRight 
} from 'lucide-react';

interface ZipDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ZipDownloadModal: React.FC<ZipDownloadModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'download' | 'apk'>('download');
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedCmd, setCopiedCmd] = useState<boolean>(false);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const fullDownloadUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/download-zip` 
    : '/api/download-zip';

  // Automatically trigger download when modal opens
  useEffect(() => {
    if (isOpen) {
      triggerDownload();
    } else {
      setDownloadStatus('idle');
      setCopied(false);
      setCopiedCmd(false);
      setErrorMessage('');
    }
  }, [isOpen]);

  const triggerDownload = async () => {
    try {
      setDownloadStatus('downloading');
      setErrorMessage('');

      const response = await fetch('/api/download-zip');
      if (!response.ok) {
        throw new Error(`Sunucu hatası: HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', 'novastream-tv.zip');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000);
      setDownloadStatus('success');
    } catch (err: any) {
      console.warn('Tarayıcı indirmeyi engellemiş olabilir:', err);
      setDownloadStatus('error');
      setErrorMessage(err.message || 'Tarayıcı veya iFrame güvenlik politikası doğrudan indirmeyi kısıtladı.');
    }
  };

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullDownloadUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      });
    }
  };

  const handleCopyCapacitorCommands = () => {
    const cmds = `unzip novastream-tv.zip
cd novastream-tv
npm install
npm install @capacitor/core @capacitor/cli @capacitor/android
npm run build
npx cap add android
npx cap copy
npx cap open android`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(cmds).then(() => {
        setCopiedCmd(true);
        setTimeout(() => setCopiedCmd(false), 3000);
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-xl max-h-[92vh] bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                NovaStream TV
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30 font-mono">
                  APK & ZIP
                </span>
              </h2>
              <p className="text-xs text-slate-400">Tüm kaynak kodları ve Android APK oluşturma merkezi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-slate-950 rounded-2xl border border-slate-800 mt-4 shrink-0">
          <button
            onClick={() => setActiveTab('download')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'download'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>ZIP İndirme</span>
          </button>

          <button
            onClick={() => setActiveTab('apk')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'apk'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>APK Nasıl Yapılır? (5 Dk)</span>
          </button>
        </div>

        {/* Scrollable Tab Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {activeTab === 'download' ? (
            <>
              {/* Status Notification */}
              {downloadStatus === 'downloading' && (
                <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center gap-3 text-cyan-300 text-xs">
                  <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-cyan-400" />
                  <span>ZIP dosyası paketleniyor ve tarayıcınıza aktarılıyor...</span>
                </div>
              )}

              {downloadStatus === 'success' && (
                <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-3 text-emerald-300 text-xs">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>İndirme tetiklendi! İndirilenler klasörünüzü kontrol ediniz.</span>
                </div>
              )}

              {downloadStatus === 'error' && (
                <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-start gap-3 text-amber-300 text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">Tarayıcı iFrame İndirme Koruması</div>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Önizleme penceresi güvenlik kısıtlamaları nedeniyle dosya otomatik inmediyse aşağıdaki bağlantıyı kullanabilirsiniz.
                    </p>
                  </div>
                </div>
              )}

              {/* Primary Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={triggerDownload}
                  disabled={downloadStatus === 'downloading'}
                  className="w-full py-3 px-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>Tekrar İndirmeyi Dene</span>
                </button>

                <a
                  href="/api/download-zip"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all border border-slate-700 hover:border-slate-600"
                >
                  <ExternalLink className="w-4 h-4 text-cyan-400" />
                  <span>Yeni Sekmede Aç & İndir</span>
                </a>
              </div>

              {/* Copy Download Link Section */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    Doğrudan İndirme Bağlantısı:
                  </span>
                  <button
                    onClick={handleCopyLink}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                      copied 
                        ? 'bg-emerald-500 text-slate-950' 
                        : 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Kopyalandı!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Linki Kopyala</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-400 truncate select-all">
                  {fullDownloadUrl}
                </div>
                <p className="text-[10px] text-slate-500">
                  * Linki kopyalayıp tarayıcınızın yeni bir sekmesine yapıştırıp Enter'a basarak dosyayı anında indirebilirsiniz.
                </p>
              </div>

              {/* Info banner about APK */}
              <div 
                onClick={() => setActiveTab('apk')}
                className="p-3 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 hover:border-cyan-400/50 cursor-pointer flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <Tv className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-semibold text-slate-200">
                    Bu projeyi Android TV Box APK'sına dönüştürmek ister misiniz?
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-cyan-400" />
              </div>
            </>
          ) : (
            /* APK GUIDE TAB */
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 space-y-1">
                <div className="font-bold text-xs text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  <span>En Kolay Yöntem: Capacitor ile 5 Dakikada APK</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Proje içerisinde <span className="font-mono text-cyan-300">capacitor.config.json</span> ve <span className="font-mono text-cyan-300">APK_REHBERI.md</span> dosyaları hazır olarak eklenmiştir.
                </p>
              </div>

              {/* Commands Block */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                    Sırasıyla Terminalde Çalıştırın:
                  </span>
                  <button
                    onClick={handleCopyCapacitorCommands}
                    className="px-2 py-1 rounded-lg text-xs font-bold bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30 flex items-center gap-1"
                  >
                    {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCmd ? 'Kopyalandı!' : 'Komutları Kopyala'}</span>
                  </button>
                </div>
                <pre className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto leading-relaxed">
{`# 1. ZIP'i açın ve girin
unzip novastream-tv.zip
cd novastream-tv

# 2. Paketleri kurun
npm install
npm install @capacitor/core @capacitor/cli @capacitor/android

# 3. Projeyi derleyin ve Android platformunu ekleyin
npm run build
npx cap add android
npx cap copy

# 4. Android Studio'da açıp Build APK'ya basın
npx cap open android`}
                </pre>
              </div>

              {/* TV Specific Instructions */}
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Tv className="w-3.5 h-3.5 text-amber-400" />
                  Android TV Kumandası & Leanback Ayarı (Önemli)
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Android Studio içinde <span className="font-mono text-slate-200">AndroidManifest.xml</span> dosyasına TV başlatıcısı ekleyin:
                </p>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-[10px] font-mono text-cyan-300 overflow-x-auto">
                  &lt;category android:name="android.intent.category.LEANBACK_LAUNCHER" /&gt;
                </div>
              </div>

              {/* Online / No-code Option */}
              <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-1">
                <div className="text-xs font-bold text-slate-300">
                  Kodsuz / Online APK Oluşturucu Alternatifi:
                </div>
                <p className="text-[11px] text-slate-400">
                  Uygulamanızı Vercel/Render üzerine yükleyip <span className="text-cyan-400 font-semibold">WebToApp.design</span> veya <span className="text-cyan-400 font-semibold">PWABuilder</span> ile tek tıkla doğrudan .apk çıktısı alabilirsiniz.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-between items-center shrink-0">
          <span className="text-[11px] text-slate-500">
            NovaStream TV • v1.0 Android Leanback
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
