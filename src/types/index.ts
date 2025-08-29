// Types pour les manifestes de patches
export interface PatchManifest {
  id: string; // Identifiant unique
  version: string; // Version d'affichage (ex: "25.16", "Version HASH")
  officialVersion?: string; // Version officielle LoL (ex: "25.16")
  date: string;
  size: string;
  content: string;
  manifest: string;
  languages: string[];
  region: string;
}

// Types pour les téléchargements
export interface DownloadTask {
  id: string;
  manifest: string;
  version: string;
  status: 'pending' | 'downloading' | 'completed' | 'error' | 'paused';
  progress: number;
  speed: string;
  eta: string;
  error?: string;
  startTime: Date;
  endTime?: Date;
  filePath?: string; // Chemin du fichier téléchargé
  downloaded?: string; // Quantité téléchargée (ex: "15.3 MB")
  outputPath?: string; // Dossier de destination
}

// Types pour les paramètres
export interface AppSettings {
  downloadPath: string;
  language: string;
  contentFilter: string;
  maxConcurrentDownloads: number;
  downloadSpeed: number;
  theme: 'light' | 'dark';
  autoStart: boolean;
  notifications: boolean;
}

// Types pour les filtres
export interface PatchFilters {
  version?: string;
  size?: string;
  content?: string;
  language?: string;
  region?: string;
  search?: string;
}

// Types pour les notifications
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

// Types pour l'API Google Sheets
export interface SheetsResponse {
  values: string[][];
}

// Types pour les commandes Tauri
export interface TauriCommands {
  fetchManifests: () => Promise<PatchManifest[]>;
  startDownload: (manifest: string, language: string, content: string) => Promise<string>;
  pauseDownload: (taskId: string) => Promise<void>;
  resumeDownload: (taskId: string) => Promise<void>;
  cancelDownload: (taskId: string) => Promise<void>;
  getDownloadProgress: (taskId: string) => Promise<DownloadTask>;
  getSettings: () => Promise<AppSettings>;
  saveSettings: (settings: AppSettings) => Promise<void>;
  showNotification: (title: string, message: string) => Promise<void>;
}
