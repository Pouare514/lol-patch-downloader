// Extension de l'interface Window pour Tauri v2
declare global {
  interface Window {
    __TAURI__?: {
      invoke: (command: string, args?: unknown) => Promise<unknown>;
    };
    // Tauri v2 peut aussi utiliser cette API
    tauri?: {
      invoke: (command: string, args?: unknown) => Promise<unknown>;
    };
  }
}

// Utilitaire pour détecter l'environnement Tauri
export const isTauri = typeof window !== 'undefined' && (window.__TAURI__ || window.tauri);

// Debug: Afficher l'état de Tauri
if (typeof window !== 'undefined') {
  console.log('🔍 État de Tauri:', {
    windowExists: !!window,
    tauriV1Exists: !!window.__TAURI__,
    tauriV2Exists: !!window.tauri,
    invokeExists: !!(window.__TAURI__ && window.__TAURI__.invoke) || !!(window.tauri && window.tauri.invoke)
  });
  
  // Debug plus détaillé
  console.log('🔍 Debug détaillé:', {
    window: typeof window,
    __TAURI__: window.__TAURI__,
    tauri: window.tauri,
    keys: Object.keys(window).filter(key => key.includes('tauri') || key.includes('TAURI'))
  });
}

// Wrapper pour invoke qui fonctionne dans les deux environnements
export const safeInvoke = async (command: string, args?: unknown): Promise<unknown> => {
  try {
    console.log('🔍 safeInvoke appelé avec:', { command, args });
    
    // Vérifier si nous sommes dans l'environnement Tauri
    if (typeof window !== 'undefined') {
      console.log('🔍 Window existe, recherche des APIs Tauri...');
      
      let invokeFunction = null;
      
      // Essayer Tauri v1 d'abord
      if (window.__TAURI__ && window.__TAURI__.invoke) {
        invokeFunction = window.__TAURI__.invoke;
        console.log('🚀 Utilisation de Tauri v1');
      }
      // Sinon essayer Tauri v2
      else if (window.tauri && window.tauri.invoke) {
        invokeFunction = window.tauri.invoke;
        console.log('🚀 Utilisation de Tauri v2');
      }
      // Essayer d'autres variantes possibles
      else if ((window as unknown as Record<string, unknown>).__TAURI_INTERNALS__) {
        console.log('🔍 Tauri internals trouvés');
        invokeFunction = ((window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ as Record<string, unknown>).invoke as (command: string, args?: unknown) => Promise<unknown>;
      }
      
      if (invokeFunction) {
        console.log(`🚀 Appel de la commande Tauri: ${command}`, args);
        const result = await invokeFunction(command, args);
        console.log(`✅ Résultat de ${command}:`, result);
        return result;
      } else {
        console.log('❌ Aucune fonction invoke trouvée');
      }
    } else {
      console.log('❌ Window n\'existe pas');
    }
    
    console.warn(`⚠️ Commande Tauri "${command}" appelée en dehors de l'environnement Tauri`);
    return null;
  } catch (error) {
    console.error(`💥 Erreur lors de l'appel de la commande "${command}":`, error);
    return null;
  }
};
