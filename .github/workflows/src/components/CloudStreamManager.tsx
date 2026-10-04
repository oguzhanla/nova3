import React, { useState } from 'react';
import { 
  Download, Plus, RefreshCw, CheckCircle2, ShieldCheck, Sparkles, 
  Trash2, ExternalLink, Play, Search, FolderGit2, Check, Film
} from 'lucide-react';
import { CloudStreamContent, CloudStreamPlugin, CloudStreamRepo } from '../types';
import { cloudstreamService } from '../services/cloudstreamService';
import { storageService } from '../services/storageService';

interface CloudStreamManagerProps {
  repos: CloudStreamRepo[];
  installedPlugins: CloudStreamPlugin[];
  onUpdateRepos: (repos: CloudStreamRepo[]) => void;
  onUpdatePlugins: (plugins: CloudStreamPlugin[]) => void;
  onPlayContent: (content: CloudStreamContent) => void;
}

export const CloudStreamManager: React.FC<CloudStreamManagerProps> = ({
  repos,
  installedPlugins,
  onUpdateRepos,
  onUpdatePlugins,
  onPlayContent,
}) => {
  const [activeTab, setActiveTab] = useState<'repos' | 'installed' | 'content'>('repos');
  const [selectedRepo, setSelectedRepo] = useState<CloudStreamRepo | null>(repos[0] || null);
  const [selectedPlugin, setSelectedPlugin] = useState<CloudStreamPlugin | null>(null);
  const [pluginContent, setPluginContent] = useState<CloudStreamContent[]>([]);
  const [repoPlugins, setRepoPlugins] = useState<CloudStreamPlugin[]>([]);
  const [isLoadingPlugins, setIsLoadingPlugins] = useState<boolean>(false);
  const [activePluginFilter, setActivePluginFilter] = useState<'all' | 'sports' | 'movie' | 'tv' | 'anime'>('all');

  const [inputUrl, setInputUrl] = useState<string>('');
  const [isAddingRepo, setIsAddingRepo] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [installingIds, setInstallingIds] = useState<Record<string, boolean>>({});
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Dynamically load plugins when selectedRepo changes
  React.useEffect(() => {
    if (!selectedRepo) return;
    const initial = cloudstreamService.getPluginsForRepo(selectedRepo);
    setRepoPlugins(initial);

    setIsLoadingPlugins(true);
    cloudstreamService.fetchLiveRepoPlugins(selectedRepo).then(fetched => {
      if (fetched && fetched.length > 0) {
        setRepoPlugins(fetched);
      }
      setIsLoadingPlugins(false);
    }).catch(() => {
      setIsLoadingPlugins(false);
    });
  }, [selectedRepo]);

  // Handle auto-install plugin
  const handleInstallPlugin = (plugin: CloudStreamPlugin) => {
    setInstallingIds(prev => ({ ...prev, [plugin.id]: true }));

    setTimeout(() => {
      const updatedPlugin: CloudStreamPlugin = {
        ...plugin,
        isInstalled: true,
        status: 'ready',
      };

      const existingIndex = installedPlugins.findIndex(p => p.id === plugin.id);
      let newPlugins: CloudStreamPlugin[];
      if (existingIndex >= 0) {
        newPlugins = [...installedPlugins];
        newPlugins[existingIndex] = updatedPlugin;
      } else {
        newPlugins = [...installedPlugins, updatedPlugin];
      }

      onUpdatePlugins(newPlugins);
      storageService.setInstalledPlugins(newPlugins);
      setInstallingIds(prev => ({ ...prev, [plugin.id]: false }));
      setStatusMessage(`"${plugin.name}" eklentisi başarıyla kuruldu ve aktif edildi!`);
      setTimeout(() => setStatusMessage(null), 3000);
    }, 700);
  };

  // Auto install all plugins in the repo
  const handleInstallAllInRepo = (repo: CloudStreamRepo) => {
    const targetPlugins = repoPlugins.length > 0 ? repoPlugins : cloudstreamService.getPluginsForRepo(repo);
    targetPlugins.forEach(p => {
      setInstallingIds(prev => ({ ...prev, [p.id]: true }));
    });

    setTimeout(() => {
      const newInstalled = [...installedPlugins];
      targetPlugins.forEach(p => {
        if (!newInstalled.some(x => x.id === p.id)) {
          newInstalled.push({ ...p, isInstalled: true, status: 'ready' });
        }
      });
      onUpdatePlugins(newInstalled);
      storageService.setInstalledPlugins(newInstalled);
      setInstallingIds({});
      setStatusMessage(`"${repo.name}" deposundaki ${targetPlugins.length} eklenti otomatik kuruldu!`);
      setTimeout(() => setStatusMessage(null), 3500);
    }, 1000);
  };

  // Uninstall plugin
  const handleUninstallPlugin = (pluginId: string) => {
    const updated = installedPlugins.filter(p => p.id !== pluginId);
    onUpdatePlugins(updated);
    storageService.setInstalledPlugins(updated);
    if (selectedPlugin?.id === pluginId) {
      setSelectedPlugin(null);
      setPluginContent([]);
      setActiveTab('installed');
    }
  };

  // View plugin content
  const handleViewPluginContent = (plugin: CloudStreamPlugin) => {
    setSelectedPlugin(plugin);
    const content = cloudstreamService.getPluginContent(plugin.id);
    setPluginContent(content);
    setActiveTab('content');
  };

  // Add new repository by URL or Shortcode
  const handleAddRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;

    setIsAddingRepo(true);
    let targetUrl = inputUrl.trim();

    // Check if it's a shortcode like 'wiospor'
    const resolvedUrl = await cloudstreamService.resolveShortcode(targetUrl);
    if (resolvedUrl) {
      targetUrl = resolvedUrl;
    }

    // Generate or fetch repo info
    const newRepo: CloudStreamRepo = {
      id: `custom_${Date.now()}`,
      name: targetUrl.split('/').slice(-2, -1)[0] || 'Özel Cloudstream Deposu',
      url: targetUrl,
      icon: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=120&auto=format&fit=crop&q=80',
      description: 'Kullanıcı tarafından eklenen özel Cloudstream eklenti deposu.',
      author: 'Topluluk',
      pluginCount: 4,
      isCustom: true,
    };

    const newRepos = [...repos, newRepo];
    onUpdateRepos(newRepos);
    storageService.setCloudStreamRepos(newRepos);
    setSelectedRepo(newRepo);
    setInputUrl('');
    setIsAddingRepo(false);
    setStatusMessage('Yeni Cloudstream deposu başarıyla eklendi!');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const displayedPlugins = (repoPlugins.length > 0 ? repoPlugins : (selectedRepo ? cloudstreamService.getPluginsForRepo(selectedRepo) : [])).filter((plugin) => {
    const matchesSearch = !searchFilter.trim() || 
      plugin.name.toLowerCase().includes(searchFilter.toLowerCase()) || 
      plugin.description.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesCat = activePluginFilter === 'all' || plugin.types.includes(activePluginFilter);
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="p-6 rounded-2xl bg-linear-to-r from-blue-950/40 via-cyan-950/20 to-slate-900 border border-cyan-800/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            CloudStream 3 / 4 Genişletilebilir Altyapı
          </div>
          <h2 className="text-2xl font-black text-white">Eklentiler & Depolar (Plugins)</h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            CloudStream repo adreslerini veya kısa kodlarını içe aktararak canlı spor yayınlarını, yerli/yabancı sinema ve dizi kaynaklarını tek dokunuşla otomatik kurun.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-center">
            <div className="text-xs text-slate-400">Aktif Depolar</div>
            <div className="text-lg font-bold text-cyan-400">{repos.length}</div>
          </div>
          <div className="px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-center">
            <div className="text-xs text-slate-400">Yüklü Eklentiler</div>
            <div className="text-lg font-bold text-emerald-400">{installedPlugins.length}</div>
          </div>
        </div>
      </div>

      {/* Status Notification */}
      {statusMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-600/60 text-emerald-200 text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('repos')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'repos' 
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FolderGit2 className="w-4 h-4" />
            Depolar ({repos.length})
          </button>

          <button
            onClick={() => setActiveTab('installed')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'installed' 
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Yüklü Eklentiler ({installedPlugins.length})
          </button>

          {selectedPlugin && (
            <button
              onClick={() => setActiveTab('content')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'content' 
                  ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Play className="w-4 h-4" />
              {selectedPlugin.name} İçerikleri ({pluginContent.length})
            </button>
          )}
        </div>

        {/* Shortcode quick import input */}
        <form onSubmit={handleAddRepo} className="flex items-center gap-2 max-w-md w-full">
          <input
            type="text"
            placeholder="Repo linki veya kısa kod (ör: wiospor, kekik)..."
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
          <button
            type="submit"
            disabled={isAddingRepo || !inputUrl.trim()}
            className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0"
          >
            {isAddingRepo ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            İçe Aktar
          </button>
        </form>
      </div>

      {/* Tab: REPOS */}
      {activeTab === 'repos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Repo list from user's photo */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Kayıtlı Repolar (Kullanıcı Fotoğrafından)
            </h3>
            <div className="space-y-2">
              {repos.map((repo) => {
                const isSelected = selectedRepo?.id === repo.id;
                return (
                  <div
                    key={repo.id}
                    onClick={() => setSelectedRepo(repo)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                      isSelected
                        ? 'bg-slate-800/90 border-cyan-400/80 shadow-md shadow-cyan-950/50'
                        : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/50 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                      {repo.icon && repo.icon.trim() !== '' ? (
                        <img src={repo.icon} alt={repo.name} className="w-full h-full object-cover" />
                      ) : (
                        <FolderGit2 className="w-6 h-6 text-cyan-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-white truncate">{repo.name}</h4>
                        {repo.isCustom && (
                          <span className="px-1.5 py-0.2 bg-purple-900/60 text-purple-300 text-[10px] rounded font-medium">Özel</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5 font-mono">{repo.url}</p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-cyan-400/90 font-medium">
                        <span>{repo.pluginCount || 4} Eklenti Mevcut</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Repo Details & Plugins available to install */}
          {selectedRepo && (
            <div className="lg:col-span-2 space-y-4">
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white">{selectedRepo.name}</h3>
                    <span className="text-xs text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-800/50">
                      Geliştirici: {selectedRepo.author || 'Açık Kaynak'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 max-w-xl">{selectedRepo.description}</p>
                  <p className="text-[11px] text-slate-500 font-mono mt-1 break-all">{selectedRepo.url}</p>
                </div>

                <button
                  onClick={() => handleInstallAllInRepo(selectedRepo)}
                  className="px-4 py-2.5 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-cyan-500/20 shrink-0 transition-all"
                >
                  <Download className="w-4 h-4" />
                  Tümünü Otomatik Kur
                </button>
              </div>

              {/* Plugins inside this repo */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <span>Bu Depodaki Eklentiler ({displayedPlugins.length} / {repoPlugins.length})</span>
                      {isLoadingPlugins && (
                        <span className="text-[10px] text-cyan-400 font-normal flex items-center gap-1">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          GitHub senkronize ediliyor...
                        </span>
                      )}
                    </h4>
                  </div>

                  {/* Plugin Search Input */}
                  <div className="relative max-w-xs w-full">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Eklenti ara (ör: Selçuk, İnat, DiziPal)..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {[
                    { id: 'all', label: 'Tümü' },
                    { id: 'sports', label: '⚽ Spor & Canlı TV' },
                    { id: 'movie', label: '🎬 Sinema & Film' },
                    { id: 'tv', label: '📺 Dizi & Platform' },
                    { id: 'anime', label: '🍿 Anime & Çizgi Dizi' },
                  ].map((filterTab) => (
                    <button
                      key={filterTab.id}
                      onClick={() => setActivePluginFilter(filterTab.id as any)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                        activePluginFilter === filterTab.id
                          ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                          : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {filterTab.label}
                    </button>
                  ))}
                </div>

                {displayedPlugins.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400 text-xs">
                    Aranan kriterlere uygun eklenti bulunamadı.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {displayedPlugins.map((plugin) => {
                      const isAlreadyInstalled = installedPlugins.some(p => p.id === plugin.id);
                      const isInstalling = installingIds[plugin.id];

                    return (
                      <div
                        key={plugin.id}
                        tabIndex={0}
                        role="button"
                        onClick={() => {
                          if (isAlreadyInstalled) {
                            handleViewPluginContent(plugin);
                          } else {
                            handleInstallPlugin(plugin);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            if (isAlreadyInstalled) {
                              handleViewPluginContent(plugin);
                            } else {
                              handleInstallPlugin(plugin);
                            }
                          }
                        }}
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 cursor-pointer focus:outline-none focus:ring-4 focus:ring-cyan-400 focus:scale-[1.02] focus:border-cyan-400 ${
                          isAlreadyInstalled
                            ? 'bg-slate-900/90 border-emerald-500/50 shadow-md shadow-emerald-950/40'
                            : 'bg-slate-900/50 border-slate-800 hover:border-cyan-500/50 hover:bg-slate-850'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h5 className="font-bold text-sm text-white flex items-center gap-1.5">
                                {plugin.name}
                                {isAlreadyInstalled && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                              </h5>
                              <span className="text-[11px] text-slate-500">v{plugin.version} • {plugin.author}</span>
                            </div>
                            <div className="flex gap-1">
                              {plugin.types.map(t => (
                                <span key={t} className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-800 text-cyan-400">
                                  {t === 'sports' ? 'Spor' : t === 'movie' ? 'Sinema' : t === 'tv' ? 'Dizi' : 'Canlı'}
                                </span>
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-slate-400 mt-2 leading-relaxed">{plugin.description}</p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                          {isAlreadyInstalled ? (
                            <>
                              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                                <Check className="w-4 h-4" />
                                Kuruldu (İçeriği Açmak İçin Tıklayın)
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewPluginContent(plugin);
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 text-xs font-bold transition-all flex items-center gap-1"
                                >
                                  <Play className="w-3.5 h-3.5 fill-current" />
                                  İçeriği Aç
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUninstallPlugin(plugin.id);
                                  }}
                                  className="p-1.5 rounded-lg bg-red-950/50 hover:bg-red-900 text-red-400 text-xs transition-all"
                                  title="Eklentiyi Kaldır"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <span className="text-xs text-cyan-300 font-medium">Dokunarak Hemen Kur</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleInstallPlugin(plugin);
                                }}
                                disabled={isInstalling}
                                className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20"
                              >
                                {isInstalling ? (
                                  <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    Kuruluyor...
                                  </>
                                ) : (
                                  <>
                                    <Download className="w-3.5 h-3.5" />
                                    Otomatik Kur
                                  </>
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )}

      {/* Tab: INSTALLED PLUGINS */}
      {activeTab === 'installed' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Cihaza Yüklü CloudStream Eklentileri ({installedPlugins.length})
            </h3>
            <span className="text-xs text-slate-500">
              Bu eklentiler medya oynatıcı ve arama motoruna entegre edilmiştir.
            </span>
          </div>

          {installedPlugins.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
              <FolderGit2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm font-medium">Henüz kurulmuş bir eklenti yok.</p>
              <button
                onClick={() => setActiveTab('repos')}
                className="mt-3 px-4 py-2 rounded-xl bg-cyan-600 text-white text-xs font-bold"
              >
                Depolardan Eklenti Seç ve Kur
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {installedPlugins.map((plugin) => (
                <div
                  key={plugin.id}
                  className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-800/60 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Aktif
                      </span>
                      <span className="text-xs text-slate-500 font-mono">v{plugin.version}</span>
                    </div>

                    <h4 className="font-bold text-white text-base">{plugin.name}</h4>
                    <p className="text-xs text-cyan-400 font-medium mt-0.5">Depo: {plugin.repoId}</p>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">{plugin.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => handleViewPluginContent(plugin)}
                      className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      İçerikleri Göster
                    </button>

                    <button
                      onClick={() => handleUninstallPlugin(plugin.id)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 transition-all"
                      title="Kaldır"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: PLUGIN CONTENT VIEWER */}
      {activeTab === 'content' && selectedPlugin && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('installed')}
                className="text-xs font-bold text-cyan-400 hover:underline"
              >
                ← Eklentilere Dön
              </button>
              <h3 className="text-base font-bold text-white">
                {selectedPlugin.name} Tarafından Sağlanan Yayınlar
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              {pluginContent.length} akış kaynağı çözümlendi
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pluginContent.map((item) => (
              <div
                key={item.id}
                tabIndex={0}
                role="button"
                onClick={() => onPlayContent(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onPlayContent(item);
                  }
                }}
                className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-400 focus:scale-[1.02] focus:border-cyan-400 cursor-pointer transition-all flex flex-col"
              >
                <div className="relative aspect-video overflow-hidden bg-slate-950 flex items-center justify-center">
                  {item.poster && item.poster.trim() !== '' ? (
                    <img
                      src={item.poster}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <Film className="w-8 h-8 text-slate-700" />
                  )}
                  <div className="absolute top-2 left-2 flex gap-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-600 text-white">
                      {item.type === 'live' ? 'Canlı' : 'VOD'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-black/80 text-cyan-400 border border-cyan-800">
                      {item.quality}
                    </span>
                  </div>

                  <button
                    onClick={() => onPlayContent(item)}
                    className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-xl"
                  >
                    <Play className="w-6 h-6 fill-current ml-0.5" />
                  </button>
                </div>

                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                      {item.title}
                    </h4>
                    {item.description && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">{item.sourcePlugin}</span>
                    <button
                      onClick={() => onPlayContent(item)}
                      className="px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      Oynat
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
