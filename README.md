# 🎮 LoL Patch Downloader

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform: Windows](https://img.shields.io/badge/Platform-Windows-blue.svg)](https://www.microsoft.com/windows)
[![Built with Tauri](https://img.shields.io/badge/Built%20with-Tauri-1C1C1C?logo=tauri)](https://tauri.app/)
[![React](https://img.shields.io/badge/React-19.1.0-61DAFB?logo=react)](https://reactjs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.2-000000?logo=next.js)](https://nextjs.org/)
[![GitHub stars](https://img.shields.io/github/stars/Pouare514/lol-patch-downloader?style=social)](https://github.com/Pouare514/lol-patch-downloader)
[![GitHub forks](https://img.shields.io/github/forks/Pouare514/lol-patch-downloader?style=social)](https://github.com/Pouare514/lol-patch-downloader/network)
[![GitHub issues](https://img.shields.io/github/issues/Pouare514/lol-patch-downloader)](https://github.com/Pouare514/lol-patch-downloader/issues)

> **Application desktop moderne** pour télécharger facilement les patchs de League of Legends en utilisant les manifestes officiels de Riot Games.

<div align="center">
  <img src="public/logo.svg" alt="LoL Patch Downloader" width="200"/>
  
  *Interface moderne et intuitive pour gérer vos téléchargements LoL*
</div>

## ✨ Fonctionnalités

### 🚀 Gestion des Patchs
- **Récupération automatique** des manifestes depuis Google Sheets
- **Filtrage intelligent** par langue et contenu
- **Affichage en liste ou grille** selon vos préférences
- **Versions spéciales** et versions complètes
- **Auto-refresh** toutes les 6 heures

### 📥 Téléchargements Avancés
- **Téléchargements multiples** simultanés (jusqu'à 3)
- **Gestion des pauses** et reprises
- **Suivi en temps réel** du progrès
- **Historique des téléchargements**
- **Nettoyage automatique** des fichiers terminés

### 🎛️ Interface Utilisateur
- **Interface dark mode** moderne
- **Responsive design** adaptatif
- **Animations fluides** et feedback visuel
- **Paramètres personnalisables**
- **Gestion des serveurs préférés**

### 🔧 Technologies
- **Frontend**: React 19 + Next.js 15 + TypeScript
- **Backend**: Tauri 2.x (Rust)
- **UI**: Tailwind CSS 4
- **Autres**: ESLint, PostCSS

## 🛠️ Installation

### Prérequis

- **Windows 10/11** (64-bit)
- **Node.js** 18+ 
- **Rust** (pour le développement)
- **WebView2** (installé automatiquement)

### Branches Disponibles

- **`main`** : Version stable
- **`pre-release`** : Version de pré-sortie avec les dernières fonctionnalités

### Installation Rapide

1. **Clonez le repository**
   ```bash
   git clone https://github.com/Pouare514/lol-patch-downloader.git
   cd lol-patch-downloader
   ```

2. **Installez les dépendances**
   ```bash
   npm install
   ```

3. **Lancez en mode développement**
   ```bash
   # Pour la version stable
   git checkout main
   npm run tauri dev
   
   # Pour la version pre-release
   git checkout pre-release
   npm run tauri dev
   ```

### Build de Production

```bash
# Build pour Windows
npm run tauri build

# L'exécutable sera dans src-tauri/target/release/bundle/
```

## 🚀 Utilisation

### Première Utilisation

1. **Lancez l'application**
2. **Configurez vos préférences** dans les paramètres
3. **Sélectionnez votre langue** préférée (en_us, fr_fr, etc.)
4. **Filtrez les patchs** selon vos besoins
5. **Lancez le téléchargement** d'un patch ou plusieurs

### Versions Disponibles

- **Version Stable** : Fonctionnalités éprouvées et stables
- **Pre-Release** : Nouvelles fonctionnalités et améliorations expérimentales

### Gestion des Téléchargements

- **Clic simple** pour télécharger un patch
- **Téléchargement en lot** pour plusieurs patchs
- **Pause/Reprise** des téléchargements en cours
- **Annulation** des téléchargements non désirés
- **Nettoyage** automatique des fichiers terminés

### Paramètres Avancés

- **Serveur préféré** : Choisissez votre serveur de téléchargement
- **Mode d'affichage** : Liste ou grille
- **Versions spéciales** : Affichez les versions de test
- **Auto-refresh** : Actualisation automatique des manifestes

## 📁 Structure du Projet

```
lol-patch-downloader/
├── src/
│   ├── app/                 # Pages Next.js
│   ├── components/          # Composants React
│   │   ├── DownloadManager/ # Gestionnaire de téléchargements
│   │   ├── PatchList/       # Liste des patchs
│   │   ├── Settings/        # Paramètres
│   │   └── UI/             # Composants UI réutilisables
│   ├── hooks/              # Hooks personnalisés
│   ├── types/              # Types TypeScript
│   └── utils/              # Utilitaires
├── src-tauri/              # Backend Tauri (Rust)
│   ├── src/                # Code Rust
│   └── tauri.conf.json     # Configuration Tauri
├── assets/                 # Ressources (rman-dl.exe)
└── downloads/              # Dossier de téléchargement
```

## 🔧 Configuration

### Variables d'Environnement

Créez un fichier `.env.local` à la racine :

```env
# Configuration des serveurs
PREFERRED_SERVER=en_us
GOOGLE_SHEETS_URL=https://docs.google.com/spreadsheets/d/18Fl88fB2sI57OFhOFSHtcOlHZG9kMS0uU3kjFxzv_EA/edit?gid=1618660863#gid=1618660863

# Paramètres de téléchargement
MAX_CONCURRENT_DOWNLOADS=3
AUTO_REFRESH_INTERVAL=21600000
```

### Personnalisation

- **Thème** : Modifiez `src/app/globals.css`
- **Configuration Tauri** : Éditez `src-tauri/tauri.conf.json`
- **Types** : Ajoutez vos types dans `src/types/index.ts`

## 🤝 Contribution

Les contributions sont les bienvenues ! Voici comment contribuer :

1. **Fork** le projet
2. **Créez une branche** pour votre fonctionnalité
   ```bash
   git checkout -b feature/ma-nouvelle-fonctionnalite
   ```
3. **Commitez** vos changements
   ```bash
   git commit -m 'Ajout: nouvelle fonctionnalité'
   ```
4. **Push** vers la branche
   ```bash
   git push origin feature/ma-nouvelle-fonctionnalite
   ```
5. **Ouvrez une Pull Request**

### Standards de Code

- **TypeScript** strict mode
- **ESLint** pour la qualité du code
- **Prettier** pour le formatage
- **Tests** pour les nouvelles fonctionnalités

## 🐛 Dépannage

### Problèmes Courants

**L'application ne se lance pas**
```bash
# Vérifiez les prérequis
node --version  # >= 18
rustc --version # >= 1.70

# Nettoyez et réinstallez
rm -rf node_modules
npm install
```

**Téléchargements échouent**
- Vérifiez votre connexion internet
- Vérifiez que `rman-dl.exe` est présent dans `assets/`
- Consultez les logs dans la console

**Erreur de build**
```bash
# Nettoyez le cache Rust
cargo clean

# Rebuild
npm run tauri build
```

## 📄 Licence

Ce projet est sous licence **MIT**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🙏 Remerciements

- **Riot Games** pour les manifestes officiels
- **Tauri** pour l'excellent framework desktop
- **Next.js** pour l'infrastructure React
- **Tailwind CSS** pour les styles modernes
- **PixelButts** Pour le db de manifest

## 📞 Support

- **Issues** : [GitHub Issues](https://github.com/Pouare514/lol-patch-downloader/issues)
- **Discussions** : [GitHub Discussions](https://github.com/Pouare514/lol-patch-downloader/discussions)
- **Email** : contact@ecatoolkit.studio

---

<div align="center">
  <p>⭐ Si ce projet vous aide, n'hésitez pas à lui donner une étoile !</p>
  
  <p>Développé avec ❤️ par [Pouare514](https://github.com/Pouare514) </p>
  
  [![GitHub stars](https://img.shields.io/github/stars/Pouare514/lol-patch-downloader?style=social)](https://github.com/Pouare514/lol-patch-downloader)
  [![GitHub forks](https://img.shields.io/github/forks/Pouare514/lol-patch-downloader?style=social)](https://github.com/Pouare514/lol-patch-downloader/network)
  [![GitHub issues](https://img.shields.io/github/issues/Pouare514/lol-patch-downloader)](https://github.com/Pouare514/lol-patch-downloader/issues)
</div>
