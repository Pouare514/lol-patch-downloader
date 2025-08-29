import { useState, useEffect, useCallback } from 'react';
import { PatchManifest, PatchFilters } from '@/types';

// Fonction pour obtenir la version de patch à partir d'une date (période de 3 jours)
const getPatchVersionFromDate = (dateString: string): string | null => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;

  // Dates officielles des patches (deuxième mardi de chaque cycle de 2 semaines)
  const officialPatchDates: { year: number; month: number; day: number; version: string }[] = [
    // 2025 Patches
    { year: 2025, month: 1, day: 9, version: '25.1' },
    { year: 2025, month: 1, day: 23, version: '25.2' },
    { year: 2025, month: 2, day: 5, version: '25.3' },
    { year: 2025, month: 2, day: 20, version: '25.4' },
    { year: 2025, month: 3, day: 5, version: '25.5' },
    { year: 2025, month: 3, day: 19, version: '25.6' },
    { year: 2025, month: 4, day: 2, version: '25.7' },
    { year: 2025, month: 4, day: 16, version: '25.8' },
    { year: 2025, month: 4, day: 30, version: '25.9' },
    { year: 2025, month: 5, day: 14, version: '25.10' },
    { year: 2025, month: 5, day: 28, version: '25.11' },
    { year: 2025, month: 6, day: 11, version: '25.12' },
    { year: 2025, month: 6, day: 25, version: '25.13' },
    { year: 2025, month: 7, day: 16, version: '25.14' },
    { year: 2025, month: 7, day: 30, version: '25.15' },
    { year: 2025, month: 8, day: 13, version: '25.16' },
    { year: 2025, month: 8, day: 27, version: '25.17' },
    { year: 2025, month: 9, day: 10, version: '25.18' },
    { year: 2025, month: 9, day: 24, version: '25.19' },
    { year: 2025, month: 10, day: 8, version: '25.20' },
    { year: 2025, month: 10, day: 22, version: '25.21' },
    { year: 2025, month: 11, day: 5, version: '25.22' },
    { year: 2025, month: 11, day: 19, version: '25.23' },
    { year: 2025, month: 12, day: 10, version: '25.24' },

    // 2024 Patches
    { year: 2024, month: 1, day: 10, version: '24.1' },
    { year: 2024, month: 1, day: 24, version: '24.2' },
    { year: 2024, month: 2, day: 7, version: '24.3' },
    { year: 2024, month: 2, day: 21, version: '24.4' },
    { year: 2024, month: 3, day: 6, version: '24.5' },
    { year: 2024, month: 3, day: 20, version: '24.6' },
    { year: 2024, month: 4, day: 3, version: '24.7' },
    { year: 2024, month: 4, day: 17, version: '24.8' },
    { year: 2024, month: 5, day: 1, version: '24.9' },
    { year: 2024, month: 5, day: 15, version: '24.10' },
    { year: 2024, month: 5, day: 29, version: '24.11' },
    { year: 2024, month: 6, day: 12, version: '24.12' },
    { year: 2024, month: 6, day: 26, version: '24.13' },
    { year: 2024, month: 7, day: 17, version: '24.14' },
    { year: 2024, month: 7, day: 31, version: '24.15' },
    { year: 2024, month: 8, day: 14, version: '24.16' },
    { year: 2024, month: 8, day: 28, version: '24.17' },
    { year: 2024, month: 9, day: 11, version: '24.18' },
    { year: 2024, month: 9, day: 25, version: '24.19' },
    { year: 2024, month: 10, day: 9, version: '24.20' },
    { year: 2024, month: 10, day: 23, version: '24.21' },
    { year: 2024, month: 11, day: 6, version: '24.22' },
    { year: 2024, month: 11, day: 20, version: '24.23' },
    { year: 2024, month: 12, day: 11, version: '24.24' },

    // 2023 Patches
    { year: 2023, month: 1, day: 11, version: '23.1' },
    { year: 2023, month: 1, day: 25, version: '23.2' },
    { year: 2023, month: 2, day: 8, version: '23.3' },
    { year: 2023, month: 2, day: 22, version: '23.4' },
    { year: 2023, month: 3, day: 8, version: '23.5' },
    { year: 2023, month: 3, day: 22, version: '23.6' },
    { year: 2023, month: 4, day: 5, version: '23.7' },
    { year: 2023, month: 4, day: 19, version: '23.8' },
    { year: 2023, month: 5, day: 3, version: '23.9' },
    { year: 2023, month: 5, day: 17, version: '23.10' },
    { year: 2023, month: 5, day: 31, version: '23.11' },
    { year: 2023, month: 6, day: 14, version: '23.12' },
    { year: 2023, month: 6, day: 28, version: '23.13' },
    { year: 2023, month: 7, day: 19, version: '23.14' },
    { year: 2023, month: 8, day: 2, version: '23.15' },
    { year: 2023, month: 8, day: 16, version: '23.16' },
    { year: 2023, month: 8, day: 30, version: '23.17' },
    { year: 2023, month: 9, day: 13, version: '23.18' },
    { year: 2023, month: 9, day: 27, version: '23.19' },
    { year: 2023, month: 10, day: 11, version: '23.20' },
    { year: 2023, month: 10, day: 25, version: '23.21' },
    { year: 2023, month: 11, day: 8, version: '23.22' },
    { year: 2023, month: 11, day: 22, version: '23.23' },
    { year: 2023, month: 12, day: 13, version: '23.24' },

    // 2022 Patches
    { year: 2022, month: 1, day: 5, version: '22.1' },
    { year: 2022, month: 1, day: 20, version: '22.2' },
    { year: 2022, month: 2, day: 2, version: '22.3' },
    { year: 2022, month: 2, day: 16, version: '22.4' },
    { year: 2022, month: 3, day: 2, version: '22.5' },
    { year: 2022, month: 3, day: 16, version: '22.6' },
    { year: 2022, month: 3, day: 30, version: '22.7' },
    { year: 2022, month: 4, day: 13, version: '22.8' },
    { year: 2022, month: 4, day: 27, version: '22.9' },
    { year: 2022, month: 5, day: 11, version: '22.10' },
    { year: 2022, month: 5, day: 25, version: '22.11' },
    { year: 2022, month: 6, day: 8, version: '22.12' },
    { year: 2022, month: 6, day: 23, version: '22.13' },
    { year: 2022, month: 7, day: 13, version: '22.14' },
    { year: 2022, month: 7, day: 27, version: '22.15' },
    { year: 2022, month: 8, day: 10, version: '22.16' },
    { year: 2022, month: 8, day: 24, version: '22.17' },
    { year: 2022, month: 9, day: 8, version: '22.18' },
    { year: 2022, month: 9, day: 21, version: '22.19' },
    { year: 2022, month: 10, day: 5, version: '22.20' },
    { year: 2022, month: 10, day: 19, version: '22.21' },
    { year: 2022, month: 11, day: 2, version: '22.22' },
    { year: 2022, month: 11, day: 16, version: '22.23' },
    { year: 2022, month: 12, day: 7, version: '22.24' },
  ];

  // Chercher la date officielle la plus proche dans une période de 3 jours
  for (const patchDate of officialPatchDates) {
    const officialDate = new Date(patchDate.year, patchDate.month - 1, patchDate.day);
    const diffTime = Math.abs(date.getTime() - officialDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Si la date est dans une période de 3 jours autour de la date officielle
    if (diffDays <= 3) {
      return patchDate.version;
    }
  }

  return null;
};

// Fonction pour vérifier si une date correspond à une version live officielle (période de 3 jours)
const isOfficialLivePatch = (dateStr: string): boolean => {
  return getPatchVersionFromDate(dateStr) !== null;
};

export function useManifests(showSpecialVersions: boolean = true, showCompleteVersionsOnly: boolean = true) {
  const [manifests, setManifests] = useState<PatchManifest[]>([]);
  const [filteredManifests, setFilteredManifests] = useState<PatchManifest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PatchFilters>({ region: 'EUW1' }); // Par défaut : filtrer sur EUW1
  const [preferredServer, setPreferredServerState] = useState<string>('EUW1'); // Serveur par défaut
  
  // Fonction pour mettre à jour le serveur préféré et re-appliquer les filtres
  const setPreferredServer = useCallback((server: string) => {
    setPreferredServerState(server);
  }, []);

  // Charger les manifestes depuis le CSV
  const fetchManifests = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Chargement des manifestes depuis le CSV...');
      
      // Charger le fichier CSV directement
      const response = await fetch('/test2.csv');
      const csvText = await response.text();
      
      // Parser le CSV
      const lines = csvText.split('\n');
      const manifests: PatchManifest[] = [];
      
      // Ignorer la première ligne (en-têtes) et charger toutes les lignes
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        
        // Parser la ligne CSV (gérer les guillemets)
        const fields = line.split(',').map(field => 
          field.trim().replace(/^"|"$/g, '') // Enlever les guillemets
        );
        
        if (fields.length >= 6 && fields[0] === 'lol') {
          const realm = fields[1];
          const manifestUrl = fields[2];
          const dateModified = fields[3];
          
          // Déterminer si c'est une version spéciale (PBE, etc.)
          const isSpecialVersion = realm.includes('PBE') || realm.includes('LIVESTAGING') || realm.includes('LOLTMNT');
          
          // Extraire le hash du manifest pour l'identifier de manière unique
          const manifestHash = manifestUrl.split('/').pop()?.replace('.manifest', '') || 'Unknown';
          
          // Pour l'affichage, utiliser la version officielle pour les versions normales et le hash pour les spéciales
          let displayVersion: string;
          if (isSpecialVersion) {
            displayVersion = `Version ${manifestHash}`;
          } else {
            const officialVersion = getPatchVersionFromDate(dateModified);
            displayVersion = officialVersion || `Patch ${dateModified}`;
            const isOfficial = isOfficialLivePatch(dateModified);
            console.log(`🔍 Date: ${dateModified} → Version: ${displayVersion} → Officiel: ${isOfficial}`);
          }
          
          // Convertir la taille en bytes en format lisible
          const sizeBytes = parseInt(fields[5]) || 0;
          let size = 'Unknown';
          if (sizeBytes > 0) {
            if (sizeBytes > 1024 * 1024 * 1024) {
              size = `${(sizeBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
            } else if (sizeBytes > 1024 * 1024) {
              size = `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
            } else if (sizeBytes > 1024) {
              size = `${(sizeBytes / 1024).toFixed(1)} KB`;
            } else {
              size = `${sizeBytes} B`;
            }
          }
          
          const manifest: PatchManifest = {
            id: `${realm}-${manifestHash}`, // ID unique basé sur le serveur et le hash
            version: displayVersion,
            officialVersion: isSpecialVersion ? undefined : getPatchVersionFromDate(dateModified) || undefined,
            date: dateModified,
            size,
            content: 'assets',
            manifest: manifestUrl,
            languages: ['en_us'],
            region: realm,
          };
          
          manifests.push(manifest);
        }
      }
      
      console.log(`✅ ${manifests.length} manifestes chargés depuis le CSV`);
      setManifests(manifests);
      
    } catch (err) {
      console.error('💥 Erreur lors du chargement:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des manifestes');
    } finally {
      setLoading(false);
    }
  };

  // Appliquer les filtres
  const applyFilters = useCallback((newFilters: PatchFilters) => {
    
    let filtered = [...manifests];
    console.log(`🔍 Filtrage: ${filtered.length} manifests au départ`);

    // Filtre par version
    if (newFilters.version) {
      filtered = filtered.filter(m => m.version.includes(newFilters.version!));
    }

    // Filtre des versions spéciales
    if (!showSpecialVersions) {
      const beforeFilter = filtered.length;
      filtered = filtered.filter(m => {
        // Exclure les versions spéciales (PBE, etc.)
        const isSpecial = m.region.includes('PBE') || m.region.includes('LIVESTAGING') || m.region.includes('LOLTMNT');
        if (isSpecial) return false;
        
        // En mode "versions live", ne garder que les patches qui correspondent exactement aux dates officielles
        if (!showSpecialVersions) {
          return isOfficialLivePatch(m.date);
        }
        
        return true;
      });
      console.log(`🎯 Filtre versions spéciales: ${beforeFilter} → ${filtered.length} manifests`);
    }

    // Filtre des versions incomplètes (moins de 10MB)
    if (showCompleteVersionsOnly) {
      filtered = filtered.filter(m => {
        const sizeStr = m.size.toLowerCase();
        if (sizeStr.includes('gb')) {
          return true; // Toujours inclure les GB
        } else if (sizeStr.includes('mb')) {
          const mbValue = parseFloat(sizeStr.replace('mb', '').trim());
          return mbValue >= 10; // Inclure seulement les versions >= 10MB
        } else if (sizeStr.includes('kb')) {
          return false; // Exclure les KB
        } else {
          return true; // Inclure les autres cas (Unknown, etc.)
        }
      });
    }

    // Filtre par taille
    if (newFilters.size) {
      filtered = filtered.filter(m => m.size.includes(newFilters.size!));
    }

    // Filtre par contenu
    if (newFilters.content) {
      filtered = filtered.filter(m => 
        m.content.toLowerCase().includes(newFilters.content!.toLowerCase())
      );
    }

    // Filtre par langue
    if (newFilters.language) {
      filtered = filtered.filter(m => 
        m.languages.some(lang => lang.includes(newFilters.language!))
      );
    }

    // Filtre par région
    if (newFilters.region) {
      filtered = filtered.filter(m => m.region.includes(newFilters.region!));
    }

    // Recherche textuelle
    if (newFilters.search) {
      const searchTerm = newFilters.search.toLowerCase();
      filtered = filtered.filter(m => 
        m.version.toLowerCase().includes(searchTerm) ||
        m.content.toLowerCase().includes(searchTerm) ||
        m.manifest.toLowerCase().includes(searchTerm)
      );
    }

    // Grouper par version pour éviter les doublons
    const groupedByVersion = new Map<string, PatchManifest[]>();
    
    filtered.forEach(manifest => {
      const versionKey = `${manifest.version}-${manifest.region}`;
      if (!groupedByVersion.has(versionKey)) {
        groupedByVersion.set(versionKey, []);
      }
      groupedByVersion.get(versionKey)!.push(manifest);
    });

    console.log(`📊 Groupement: ${groupedByVersion.size} versions uniques trouvées`);
    groupedByVersion.forEach((manifests, versionKey) => {
      console.log(`  ${versionKey}: ${manifests.length} manifests`);
    });

    // Pour chaque groupe, prendre le manifest le plus récent ou le plus prioritaire
    const uniqueManifests: PatchManifest[] = [];
    
    groupedByVersion.forEach((manifestsForVersion, versionKey) => {
      // Trier : serveur préféré en premier, puis par date (plus récent en premier)
      const sorted = manifestsForVersion.sort((a, b) => {
        // Serveur préféré en premier
        if (a.region === preferredServer) return -1;
        if (b.region === preferredServer) return 1;
        
        // Sinon, par date (plus récent en premier)
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      
      // Prendre le premier (le plus prioritaire)
      uniqueManifests.push(sorted[0]);
      console.log(`✅ Sélectionné pour ${versionKey}: ${sorted[0].date} (${sorted[0].size})`);
    });

    // Trier par date (plus récent en premier)
    uniqueManifests.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setFilteredManifests(uniqueManifests);
  }, [manifests, preferredServer, showSpecialVersions, showCompleteVersionsOnly]);

  // Charger les manifestes au montage du composant
  useEffect(() => {
    fetchManifests();
  }, []);

  // Appliquer les filtres quand ils changent
  useEffect(() => {
    applyFilters(filters);
  }, [manifests, filters, preferredServer, showSpecialVersions, showCompleteVersionsOnly, applyFilters]);

  // Fonction pour mettre à jour les filtres et les appliquer immédiatement
  const updateFilters = useCallback((newFilters: PatchFilters) => {
    setFilters(newFilters);
    applyFilters(newFilters);
  }, [applyFilters]);

  return {
    manifests: filteredManifests,
    allManifests: manifests,
    loading,
    error,
    filters,
    setFilters: updateFilters, // Utiliser updateFilters au lieu de setFilters
    preferredServer,
    setPreferredServer,
    refetch: fetchManifests,
  };
}
