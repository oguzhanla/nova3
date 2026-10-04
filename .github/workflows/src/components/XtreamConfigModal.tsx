import React, { useState } from 'react';
import { 
  Server, Key, User, CheckCircle2, AlertCircle, RefreshCw, 
  X, ShieldCheck, Sparkles, ExternalLink, Calendar, Users
} from 'lucide-react';
import { XtreamCredentials, XtreamServerInfo, XtreamUserInfo } from '../types';
import { xtreamService } from '../services/xtreamService';
import { DEFAULT_XTREAM_CREDENTIALS } from '../constants/defaults';
import { storageService } from '../services/storageService';

interface XtreamConfigModalProps {
  currentConfig: XtreamCredentials;
  userInfo?: XtreamUserInfo | null;
  serverInfo?: XtreamServerInfo | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: XtreamCredentials) => void;
}

export const XtreamConfigModal: React.FC<XtreamConfigModalProps> = ({
  currentConfig,
  userInfo,
  serverInfo,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<XtreamCredentials>(currentConfig);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    isSimulated?: boolean;
    user?: XtreamUserInfo;
  } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    const result = await xtreamService.authenticate(formData);
    setIsTesting(false);

    if (result.success) {
      setTestResult({
        success: true,
        message: result.isSimulated 
          ? 'Sunucuya bağlanıldı! Akıllı Yerel Önbellek & Yayın Motoru Hazır.' 
          : 'Giriş Başarılı! Xtream Codes aboneliğiniz aktif.',
        isSimulated: result.isSimulated,
        user: result.userInfo,
      });
    } else {
      setTestResult({
        success: false,
        message: result.message || 'Bağlantı kurulamadı. Lütfen sunucu, kullanıcı adı ve şifreyi kontrol edin.',
      });
    }
  };

  const handleLoadPhotoPreset = () => {
    setFormData(DEFAULT_XTREAM_CREDENTIALS);
    setTestResult(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.setXtreamConfig(formData);
    onSave(formData);
    onClose();
  };

  const formatTimestamp = (ts?: string) => {
    if (!ts) return 'Süresiz';
    try {
      const date = new Date(parseInt(ts) * 1000);
      return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return ts;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Xtream Codes Giriş Ayarları</h2>
              <p className="text-xs text-slate-400">IPTV Sunucunuzu yapılandırın ve canlı yayınları yükleyin</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset Button: Photo credentials */}
        <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-cyan-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">Fotoğraftaki Rinastv Hesabı Entegre Edildi</div>
              <div className="text-[11px] text-cyan-300 font-mono">http://8.rinastv.cfd:8080 (Oguzhanla)</div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLoadPhotoPreset}
            className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/20 shrink-0"
          >
            Varsayılana Sıfırla
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Sunucu Adresi (URL + Port)
            </label>
            <div className="relative">
              <Server className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                value={formData.server}
                onChange={(e) => setFormData({ ...formData, server: e.target.value })}
                placeholder="http://example.com:8080"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-400 focus:outline-none text-sm text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Kullanıcı Adı
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Kullanıcı adı"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-400 focus:outline-none text-sm text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Şifre
              </label>
              <div className="relative">
                <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Şifre"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-400 focus:outline-none text-sm text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Test Status feedback */}
          {testResult && (
            <div className={`p-4 rounded-2xl border text-xs ${
              testResult.success 
                ? 'bg-emerald-950/60 border-emerald-600/50 text-emerald-200' 
                : 'bg-red-950/60 border-red-600/50 text-red-200'
            }`}>
              <div className="flex items-center gap-2 font-bold text-sm mb-1">
                {testResult.success ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
                {testResult.message}
              </div>

              {testResult.user && (
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-emerald-900/60 text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Bitiş: {formatTimestamp(testResult.user.exp_date)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Bağlantı: {testResult.user.active_cons || '1'} / {testResult.user.max_connections || '2'}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              disabled={isTesting}
              onClick={handleTestConnection}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-2 transition-all border border-slate-700 disabled:opacity-50"
            >
              {isTesting ? <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" /> : <ShieldCheck className="w-4 h-4 text-cyan-400" />}
              Bağlantıyı Test Et
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-cyan-500/25"
              >
                Kaydet & Bağlan
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
