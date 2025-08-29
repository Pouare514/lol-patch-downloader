'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useManifests } from '@/hooks/useManifests';
import { useDownloads } from '@/hooks/useDownloads';
import { PatchManifest } from '@/types';

export default function Home() {
  const [selectedManifest, setSelectedManifest] = useState<PatchManifest | null>(null);
  const [language, setLanguage] = useState('en_us');
  const [content, setContent] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showSpecialVersions, setShowSpecialVersions] = useState(false); // Par défaut : versions live uniquement
  const [showCompleteVersionsOnly, setShowCompleteVersionsOnly] = useState(true); // Nouvel état pour les versions complètes uniquement
  const [notifications, setNotifications] = useState<Array<{id: string, type: 'success' | 'error' | 'info', message: string}>>([]);
  
  const { manifests, loading, error, filters, setFilters, preferredServer, setPreferredServer, refetch } = useManifests(showSpecialVersions, showCompleteVersionsOnly);
  const { downloads, downloadPath, selectDownloadFolder, startDownload, pauseDownload, resumeDownload, cancelDownload, cleanupCompleted } = useDownloads();

  // Auto-refresh des manifestes toutes les 6 heures
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 6 * 60 * 60 * 1000); // 6 heures

    return () => clearInterval(interval);
  }, [refetch]);

  // Fonctions utilitaires pour les notifications
  const addNotification = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, message }]);
    // Auto-remove après 5 secondes
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleDownload = async (manifest: PatchManifest) => {
    try {
      const taskId = await startDownload(manifest.manifest, language, content);
      addNotification('success', `Téléchargement de ${manifest.version} démarré`);
      return taskId;
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      addNotification('error', `Erreur lors du démarrage du téléchargement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      throw error;
    }
  };

  const handleBulkDownload = async () => {
    const selectedManifests = manifests.filter(m =>
      m.languages.includes(language) &&
      (content === '' || m.content.toLowerCase().includes(content.toLowerCase()))
    );

    if (selectedManifests.length === 0) {
      addNotification('info', 'Aucun patch trouvé avec les filtres actuels');
      return;
    }

    addNotification('info', `Démarrage du téléchargement de ${Math.min(selectedManifests.length, 3)} patch(es)...`);

    for (const manifest of selectedManifests.slice(0, 3)) { // Limite à 3 téléchargements simultanés
      try {
        await handleDownload(manifest);
      } catch (error) {
        console.error(`Erreur lors du téléchargement de ${manifest.version}:`, error);
        addNotification('error', `Échec du téléchargement de ${manifest.version}`);
      }
    }
  };

  const handleSelectFolder = async () => {
    try {
      const path = await selectDownloadFolder();
      if (path) {
        addNotification('success', `✅ Dossier sélectionné: ${path.split(/[/\\]/).pop()}`);
      } else {
        addNotification('info', 'ℹ️ Aucun dossier sélectionné');
      }
    } catch {
      addNotification('error', 'Erreur lors de la sélection du dossier');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-600';
      case 'error': return 'bg-red-600';
      case 'paused': return 'bg-yellow-600';
      case 'downloading': return 'bg-blue-600';
      default: return 'bg-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Terminé';
      case 'error': return 'Erreur';
      case 'paused': return 'En pause';
      case 'downloading': return 'Téléchargement';
      case 'pending': return 'En attente';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <div className="text-white text-xl">Chargement des manifestes...</div>
          <div className="text-gray-400 text-sm mt-2">Récupération depuis Google Sheets</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">Erreur de chargement</div>
          <div className="text-gray-400 mb-4">{error}</div>
          <button
            onClick={refetch}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white" style={{ fontFamily: 'var(--font-lol)' }}>
      {/* Notifications Toast */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg shadow-lg backdrop-blur-sm border border-gray-700/50 flex items-center justify-between min-w-80 ${
              notification.type === 'success' ? 'bg-green-600/90' :
              notification.type === 'error' ? 'bg-red-600/90' :
              'bg-blue-600/90'
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-lg">
                {notification.type === 'success' ? '✅' :
                 notification.type === 'error' ? '❌' : 'ℹ️'}
              </span>
              <span className="text-sm font-medium">{notification.message}</span>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="text-white/70 hover:text-white text-lg"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="bg-gray-800/80 backdrop-blur-md border-b border-gray-700/50 p-6 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 p-2 rounded-lg bg-gray-700/50 backdrop-blur-sm">
                <Image 
                  src="/logo.svg" 
                  alt="Logo" 
                  width={48}
                  height={48}
                  className="drop-shadow-lg" 
                />
                <h1 className="text-3xl font-bold lol-green-light tracking-wide">LoL Patch Downloader</h1>
              </div>
            </div>
            <div className="text-sm text-gray-400">
              {manifests.length} patches disponibles
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Contrôles de vue */}
            <div className="flex bg-gray-700/50 backdrop-blur-sm rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-md transition-all duration-200 font-medium ${
                  viewMode === 'list' 
                    ? 'lol-gradient text-white shadow-lg' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
                }`}
              >
                📋 Liste
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-md transition-all duration-200 font-medium ${
                  viewMode === 'grid' 
                    ? 'lol-gradient text-white shadow-lg' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
                }`}
              >
                🎯 Grille
              </button>
            </div>

            {/* Paramètres rapides */}
                                    <select
                          value={language}
                          onChange={(e) => setLanguage(e.target.value)}
                          className="bg-gray-700/50 backdrop-blur-sm border border-gray-600/50 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 hover:bg-gray-600/50 focus:outline-none focus:ring-2 focus:ring-green-400"
                        >
                          <option value="en_us">🇺🇸 English (US)</option>
                          <option value="en_gb">🇬🇧 English (UK)</option>
                          <option value="en_au">🇦🇺 English (Australia)</option>
                          <option value="en_pl">🇵🇱 English (Poland)</option>
                          <option value="fr_fr">🇫🇷 Français</option>
                          <option value="de_de">🇩🇪 Deutsch</option>
                          <option value="es_es">🇪🇸 Español (España)</option>
                          <option value="es_mx">🇲🇽 Español (México)</option>
                          <option value="es_ar">🇦🇷 Español (Argentina)</option>
                          <option value="it_it">🇮🇹 Italiano</option>
                          <option value="pt_br">🇧🇷 Português (Brasil)</option>
                          <option value="ru_ru">🇷🇺 Русский</option>
                          <option value="pl_pl">🇵🇱 Polski</option>
                          <option value="tr_tr">🇹🇷 Türkçe</option>
                          <option value="ja_jp">🇯🇵 日本語</option>
                          <option value="ko_kr">🇰🇷 한국어</option>
                          <option value="zh_cn">🇨🇳 中文 (简体)</option>
                          <option value="cs_cz">🇨🇿 Čeština</option>
                          <option value="el_gr">🇬🇷 Ελληνικά</option>
                          <option value="hu_hu">🇭🇺 Magyar</option>
                          <option value="ro_ro">🇷🇴 Română</option>
                        </select>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="bg-gray-700/50 backdrop-blur-sm hover:bg-gray-600/50 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
            >
              ⚙️ Paramètres
            </button>

            <button
              onClick={() => {
                const link = document.createElement('a');
                link.href = 'https://docs.google.com/spreadsheets/d/18Fl88fB2sI57OFhOFSHtcOlHZG9kMS0uU3kjFxzv_EA/gviz/tq?tqx=out:csv&gid=1618660863';
                link.download = 'lol-manifests.csv';
                link.click();
              }}
              className="bg-green-600 hover:bg-green-700 hover:scale-105 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all duration-200 shadow-lg"
            >
              📥 Télécharger CSV
            </button>

            <button
              onClick={refetch}
              className="lol-gradient hover:scale-105 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all duration-200 shadow-lg"
            >
              🔄 Actualiser
            </button>
          </div>
        </div>

        {/* Barre de filtres avancés */}
        <div className="max-w-7xl mx-auto mt-6">
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="🔍 Rechercher par version, contenu, manifeste..."
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="bg-gray-700/50 backdrop-blur-sm border border-gray-600/50 rounded-lg px-4 py-3 flex-1 min-w-64 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
            />
            
            <input
              type="text"
              placeholder="Version spécifique"
              value={filters.version || ''}
              onChange={(e) => setFilters({ ...filters, version: e.target.value })}
              className="bg-gray-700/50 backdrop-blur-sm border border-gray-600/50 rounded-lg px-4 py-3 w-40 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
            />
            

            
            <select
              value={filters.region || ''}
              onChange={(e) => setFilters({ ...filters, region: e.target.value })}
              className="bg-gray-700/50 backdrop-blur-sm border border-gray-600/50 rounded-lg px-4 py-3 w-36 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
            >
              <option value="">🌍 Tous serveurs</option>
              <option value="NA1">🇺🇸 NA1 (Amérique du Nord)</option>
              <option value="EUW1">🇪🇺 EUW1 (Europe Ouest)</option>
              <option value="EUN1">🇪🇺 EUN1 (Europe Nord & Est)</option>
              <option value="BR1">🇧🇷 BR1 (Brésil)</option>
              <option value="KR">🇰🇷 KR (Corée)</option>
              <option value="JP1">🇯🇵 JP1 (Japon)</option>
              <option value="LA1">🇲🇽 LA1 (Amérique Latine Nord)</option>
              <option value="LA2">🇨🇱 LA2 (Amérique Latine Sud)</option>
              <option value="OC1">🇦🇺 OC1 (Océanie)</option>
              <option value="RU">🇷🇺 RU (Russie)</option>
              <option value="TR1">🇹🇷 TR1 (Turquie)</option>
              <option value="SG2">🇸🇬 SG2 (Singapour)</option>
              <option value="TW2">🇹🇼 TW2 (Taïwan)</option>
              <option value="VN2">🇻🇳 VN2 (Vietnam)</option>
              <option value="ME1">🇸🇦 ME1 (Moyen-Orient)</option>
            </select>

            <button
              onClick={() => setShowSpecialVersions(!showSpecialVersions)}
              className={`${
                showSpecialVersions 
                  ? 'bg-purple-600/80 backdrop-blur-sm hover:bg-purple-500/80' 
                  : 'bg-gray-600/50 backdrop-blur-sm hover:bg-gray-500/50'
              } px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105`}
            >
              {showSpecialVersions ? '🎮' : '🎯'} {showSpecialVersions ? 'Toutes versions' : 'Versions Live'}
            </button>

            <button
              onClick={() => setShowCompleteVersionsOnly(!showCompleteVersionsOnly)}
              className={`${
                showCompleteVersionsOnly 
                  ? 'bg-green-600/80 backdrop-blur-sm hover:bg-green-500/80' 
                  : 'bg-gray-600/50 backdrop-blur-sm hover:bg-gray-500/50'
              } px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105`}
            >
              {showCompleteVersionsOnly ? '✅' : '⚠️'} {showCompleteVersionsOnly ? 'Versions complètes' : 'Toutes tailles'}
            </button>

            <button
              onClick={() => setFilters({ region: 'EUW1' })}
              className="bg-gray-600/50 backdrop-blur-sm hover:bg-gray-500/50 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
            >
              🗑️ Réinitialiser
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Liste des manifestes */}
          <div className="xl:col-span-3">
            <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-gray-700/30">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">📦 Patches disponibles</h2>
                              <div className="flex space-x-3">
                <button
                  onClick={handleBulkDownload}
                  className="lol-gradient hover:scale-105 px-6 py-3 rounded-lg text-sm font-medium text-white transition-all duration-200 shadow-lg"
                >
                  📥 Télécharger en lot
                </button>
                <button
                  onClick={cleanupCompleted}
                  className="bg-gray-600/50 backdrop-blur-sm hover:bg-gray-500/50 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                >
                  🧹 Nettoyer terminés
                </button>
              </div>
              </div>

              {/* Liste des patches */}
              <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-4'} max-h-[600px] overflow-y-auto`}>
                {manifests.map((manifest) => (
                  <div
                    key={manifest.id}
                    className={`bg-gray-700/50 backdrop-blur-sm rounded-xl p-6 hover:bg-gray-600/50 cursor-pointer transition-all duration-300 border border-gray-600/30 hover:border-green-400/50 hover:shadow-lg hover:shadow-green-400/20 ${
                      selectedManifest?.id === manifest.id ? 'ring-2 ring-green-400 shadow-lg shadow-green-400/30' : ''
                    }`}
                    onClick={() => setSelectedManifest(manifest)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="flex flex-col">
                            <h3 className="text-xl font-bold lol-green-light">
                              {manifest.version}
                            </h3>
                            {manifest.officialVersion && manifest.officialVersion !== manifest.version && (
                              <span className="text-xs text-gray-400">
                                Version officielle: {manifest.officialVersion}
                              </span>
                            )}
                          </div>
                          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                            manifest.region === preferredServer 
                              ? 'bg-green-600/80 backdrop-blur-sm' 
                              : manifest.region.includes('PBE') || manifest.region.includes('LIVESTAGING') || manifest.region.includes('LOLTMNT')
                              ? 'bg-purple-600/80 backdrop-blur-sm'
                              : 'bg-blue-600/80 backdrop-blur-sm'
                          }`}>
                            {manifest.region}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 mb-2 flex items-center">
                          <span className="mr-2">📅</span> {manifest.date}
                        </p>
                        <p className="text-sm text-gray-400 mb-3 flex items-center">
                          <span className="mr-2">📄</span> {manifest.content}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {manifest.languages.slice(0, 3).map((lang) => (
                            <span key={lang} className="text-xs bg-gray-600/80 backdrop-blur-sm px-3 py-1 rounded-full font-medium">
                              {lang}
                            </span>
                          ))}
                          {manifest.languages.length > 3 && (
                            <span className="text-xs bg-gray-600/80 backdrop-blur-sm px-3 py-1 rounded-full font-medium">
                              +{manifest.languages.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-6">
                        <p className="text-sm text-gray-300 mb-3 flex items-center justify-end">
                          <span className="mr-2">💾</span> {manifest.size}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(manifest);
                          }}
                          className="lol-gradient hover:scale-105 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all duration-200 shadow-lg"
                        >
                          📥 Télécharger
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {manifests.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-lg mb-2">Aucun patch trouvé</div>
                  <div className="text-gray-500 text-sm">Essayez de modifier vos filtres</div>
                </div>
              )}
            </div>
          </div>

          {/* Panneau latéral */}
          <div className="space-y-8">
            {/* Détails du patch sélectionné */}
            {selectedManifest && (
              <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-gray-700/30">
                <h2 className="text-xl font-semibold mb-4">📋 Détails du patch</h2>
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-400 text-sm">Version:</span>
                    <p className="text-yellow-400 font-semibold">{selectedManifest.version}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Date:</span>
                    <p>{selectedManifest.date}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Taille:</span>
                    <p>{selectedManifest.size}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Contenu:</span>
                    <p>{selectedManifest.content}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Région:</span>
                    <p>{selectedManifest.region}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Langues:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedManifest.languages.map((lang) => (
                        <span key={lang} className="text-xs bg-gray-600 px-2 py-1 rounded">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Manifeste:</span>
                    <p className="text-xs font-mono bg-gray-700 p-2 rounded break-all">
                      {selectedManifest.manifest}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(selectedManifest)}
                  className="w-full lol-gradient hover:scale-105 py-4 rounded-xl mt-6 font-bold text-white transition-all duration-200 shadow-lg"
                >
                  📥 Télécharger ce patch
                </button>
              </div>
            )}

            {/* Informations sur le dossier de destination */}
            <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-gray-700/30 mb-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <span className="text-lg">📂</span>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-300">Dossier de destination</h3>
                    {downloadPath ? (
                      <>
                        <p className="text-xs text-gray-400 break-all font-mono bg-gray-700/30 p-2 rounded mt-1">
                          {downloadPath}
                        </p>
                        <p className="text-xs text-green-400 mt-1">
                          ✅ Prêt pour le téléchargement
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-yellow-400 mt-1">
                        ⚠️ Aucun dossier sélectionné
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleSelectFolder}
                  className="bg-purple-600 hover:bg-purple-700 hover:scale-105 px-4 py-2 rounded-lg text-xs font-medium text-white transition-all duration-200 shadow-lg ml-4"
                >
                  {downloadPath ? 'Changer' : 'Sélectionner'}
                </button>
              </div>
            </div>

            {/* Téléchargements en cours */}
            <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-gray-700/30">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">📥 Téléchargements</h2>
                <span className="text-sm text-gray-400">{downloads.length} actifs</span>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {downloads.map((download) => (
                  <div key={download.id} className="bg-gray-700/50 backdrop-blur-sm rounded-xl p-6 border border-gray-600/30 hover:shadow-lg transition-all duration-200">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium truncate">{download.manifest}</span>
                      <span className={`text-xs px-2 py-1 rounded ${getStatusColor(download.status)}`}>
                        {getStatusText(download.status)}
                      </span>
                    </div>
                    
                    {/* Barre de progression */}
                    <div className="mb-4">
                      <div className="w-full bg-gray-600/50 backdrop-blur-sm rounded-full h-3 overflow-hidden">
                        <div
                          className="lol-gradient h-3 rounded-full transition-all duration-500 shadow-lg"
                          style={{ width: `${download.progress}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* Métriques */}
                    <div className="flex justify-between text-xs text-gray-400 mb-3">
                      <span>📊 {download.progress}%</span>
                      <span>⚡ {download.speed}</span>
                      <span>⏱️ {download.eta}</span>
                    </div>

                    {/* Dossier de destination */}
                    {download.outputPath && (
                      <div className="text-xs text-gray-500 mb-3">
                        📁 {download.outputPath.split(/[/\\]/).pop()}
                      </div>
                    )}
                    
                    {/* Contrôles */}
                    <div className="flex gap-2">
                      {download.status === 'downloading' && (
                        <button
                          onClick={() => {
                            pauseDownload(download.id);
                            addNotification('info', 'Téléchargement mis en pause');
                          }}
                          className="bg-yellow-600/80 backdrop-blur-sm hover:bg-yellow-500/80 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105"
                        >
                          ⏸️ Pause
                        </button>
                      )}
                      {download.status === 'paused' && (
                        <button
                          onClick={() => {
                            resumeDownload(download.id);
                            addNotification('success', 'Téléchargement repris');
                          }}
                          className="bg-green-600/80 backdrop-blur-sm hover:bg-green-500/80 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105"
                        >
                          ▶️ Reprendre
                        </button>
                      )}
                      {download.status === 'completed' && (
                        <span className="bg-green-600/80 backdrop-blur-sm px-3 py-2 rounded-lg text-xs font-medium">
                          ✅ Terminé
                        </span>
                      )}
                      {download.status === 'error' && (
                        <span className="bg-red-600/80 backdrop-blur-sm px-3 py-2 rounded-lg text-xs font-medium">
                          ❌ Erreur
                        </span>
                      )}
                      {download.status !== 'completed' && download.status !== 'error' && (
                        <button
                          onClick={() => {
                            cancelDownload(download.id);
                            addNotification('info', 'Téléchargement annulé');
                          }}
                          className="bg-red-600/80 backdrop-blur-sm hover:bg-red-500/80 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105"
                        >
                          ❌ Annuler
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                
                {downloads.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-lg mb-2">Aucun téléchargement</div>
                    <div className="text-gray-500 text-sm">Sélectionnez un patch pour commencer</div>
                  </div>
                )}
              </div>
            </div>

            {/* Paramètres rapides */}
            {showSettings && (
              <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-gray-700/30">
                <h2 className="text-xl font-semibold mb-4">⚙️ Paramètres rapides</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Serveur préféré</label>
                    <select
                      value={preferredServer}
                      onChange={(e) => setPreferredServer(e.target.value)}
                      className="w-full bg-gray-700/50 backdrop-blur-sm border border-gray-600/50 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
                    >
                      <option value="NA1">🇺🇸 NA1 (Amérique du Nord)</option>
                      <option value="EUW1">🇪🇺 EUW1 (Europe Ouest)</option>
                      <option value="EUN1">🇪🇺 EUN1 (Europe Nord & Est)</option>
                      <option value="BR1">🇧🇷 BR1 (Brésil)</option>
                      <option value="KR">🇰🇷 KR (Corée)</option>
                      <option value="JP1">🇯🇵 JP1 (Japon)</option>
                      <option value="LA1">🇲🇽 LA1 (Amérique Latine Nord)</option>
                      <option value="LA2">🇨🇱 LA2 (Amérique Latine Sud)</option>
                      <option value="OC1">🇦🇺 OC1 (Océanie)</option>
                      <option value="RU">🇷🇺 RU (Russie)</option>
                      <option value="TR1">🇹🇷 TR1 (Turquie)</option>
                      <option value="SG2">🇸🇬 SG2 (Singapour)</option>
                      <option value="TW2">🇹🇼 TW2 (Taïwan)</option>
                      <option value="VN2">🇻🇳 VN2 (Vietnam)</option>
                      <option value="ME1">🇸🇦 ME1 (Moyen-Orient)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Langue par défaut</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full bg-gray-700/50 backdrop-blur-sm border border-gray-600/50 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
                    >
                      <option value="en_us">🇺🇸 English (US)</option>
                      <option value="en_gb">🇬🇧 English (UK)</option>
                      <option value="en_au">🇦🇺 English (Australia)</option>
                      <option value="en_pl">🇵🇱 English (Poland)</option>
                      <option value="fr_fr">🇫🇷 Français</option>
                      <option value="de_de">🇩🇪 Deutsch</option>
                      <option value="es_es">🇪🇸 Español (España)</option>
                      <option value="es_mx">🇲🇽 Español (México)</option>
                      <option value="es_ar">🇦🇷 Español (Argentina)</option>
                      <option value="it_it">🇮🇹 Italiano</option>
                      <option value="pt_br">🇧🇷 Português (Brasil)</option>
                      <option value="ru_ru">🇷🇺 Русский</option>
                      <option value="pl_pl">🇵🇱 Polski</option>
                      <option value="tr_tr">🇹🇷 Türkçe</option>
                      <option value="ja_jp">🇯🇵 日本語</option>
                      <option value="ko_kr">🇰🇷 한국어</option>
                      <option value="zh_cn">🇨🇳 中文 (简体)</option>
                      <option value="cs_cz">🇨🇿 Čeština</option>
                      <option value="el_gr">🇬🇷 Ελληνικά</option>
                      <option value="hu_hu">🇭🇺 Magyar</option>
                      <option value="ro_ro">🇷🇴 Română</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Filtre de contenu</label>
                    <input
                      type="text"
                      placeholder="Ex: assets, sounds, etc."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full bg-gray-700/50 backdrop-blur-sm border border-gray-600/50 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Données</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = '/test2.csv';
                          link.download = 'lol-manifests-local.csv';
                          link.click();
                        }}
                        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                      >
                        📁 Charger CSV local
                      </button>
                      <button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = 'https://docs.google.com/spreadsheets/d/18Fl88fB2sI57OFhOFSHtcOlHZG9kMS0uU3kjFxzv_EA/gviz/tq?tqx=out:csv&gid=1618660863';
                          link.download = 'lol-manifests-online.csv';
                          link.click();
                        }}
                        className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                      >
                        🌐 Télécharger CSV en ligne
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
