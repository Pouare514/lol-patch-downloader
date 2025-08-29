use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;
use tauri::State;
use tokio::sync::Mutex;
use tokio::process::Command as TokioCommand;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PatchManifest {
    pub version: String,
    pub date: String,
    pub size: String,
    pub content: String,
    pub manifest: String,
    pub languages: Vec<String>,
    pub region: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DownloadTask {
    pub id: String,
    pub manifest: String,
    pub version: String,
    pub status: String,
    pub progress: f64,
    pub speed: String,
    pub eta: String,
    pub error: Option<String>,
    pub start_time: String,
    pub end_time: Option<String>,
}

// État global pour stocker les données
pub struct AppState {
    pub manifests: Mutex<Vec<PatchManifest>>,
    pub downloads: Mutex<HashMap<String, DownloadTask>>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            manifests: Mutex::new(Vec::new()),
            downloads: Mutex::new(HashMap::new()),
        }
    }
}

// Données de test pour simuler Google Sheets
fn get_test_manifests() -> Vec<PatchManifest> {
    vec![
        PatchManifest {
            version: "14.17.1".to_string(),
            date: "2024-08-28".to_string(),
            size: "2.1 GB".to_string(),
            content: "assets".to_string(),
            manifest: "93A211A9D0F05050.manifest".to_string(),
            languages: vec!["en_us".to_string(), "fr_fr".to_string()],
            region: "NA".to_string(),
        },
        PatchManifest {
            version: "14.17.0".to_string(),
            date: "2024-08-21".to_string(),
            size: "1.8 GB".to_string(),
            content: "assets".to_string(),
            manifest: "8B2F119C0E04040.manifest".to_string(),
            languages: vec!["en_us".to_string(), "fr_fr".to_string(), "ja_jp".to_string()],
            region: "EUW".to_string(),
        },
        PatchManifest {
            version: "14.16.1".to_string(),
            date: "2024-08-14".to_string(),
            size: "2.3 GB".to_string(),
            content: "sounds".to_string(),
            manifest: "7A1E008B0D03030.manifest".to_string(),
            languages: vec!["en_us".to_string(), "ko_kr".to_string()],
            region: "KR".to_string(),
        },
        PatchManifest {
            version: "14.16.0".to_string(),
            date: "2024-08-07".to_string(),
            size: "1.9 GB".to_string(),
            content: "assets".to_string(),
            manifest: "690FDD7A0C02020.manifest".to_string(),
            languages: vec!["en_us".to_string(), "fr_fr".to_string(), "zh_cn".to_string()],
            region: "JP".to_string(),
        },
        PatchManifest {
            version: "14.15.1".to_string(),
            date: "2024-07-31".to_string(),
            size: "2.0 GB".to_string(),
            content: "assets".to_string(),
            manifest: "580ECC690B01010.manifest".to_string(),
            languages: vec!["en_us".to_string()],
            region: "NA".to_string(),
        },
    ]
}

#[tauri::command]
pub async fn fetch_manifests(state: State<'_, AppState>) -> Result<Vec<PatchManifest>, String> {
    println!("🔍 Commande fetch_manifests appelée");
    let mut manifests = state.manifests.lock().await;
    
    // Utiliser les données de test
    println!("🔄 Utilisation des données de test...");
    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
    
    let test_data = get_test_manifests();
    println!("📦 {} manifestes de test chargés", test_data.len());
    *manifests = test_data;
    
    Ok(manifests.clone())
}

#[tauri::command]
pub async fn start_download(
    manifest: String,
    language: String,
    content: String,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let task_id = format!("task_{}", chrono::Utc::now().timestamp_millis());
    
    let task = DownloadTask {
        id: task_id.clone(),
        manifest: manifest.clone(),
        version: "Unknown".to_string(),
        status: "pending".to_string(),
        progress: 0.0,
        speed: "0 MB/s".to_string(),
        eta: "--".to_string(),
        error: None,
        start_time: chrono::Utc::now().to_rfc3339(),
        end_time: None,
    };
    
    let mut downloads = state.downloads.lock().await;
    downloads.insert(task_id.clone(), task);
    
    // Démarrer le vrai téléchargement avec rman-dl.exe
    let task_id_clone = task_id.clone();
    let manifest_clone = manifest.clone();
    let language_clone = language.clone();
    let content_clone = content.clone();
    
    tokio::spawn(async move {
        execute_real_download(task_id_clone, manifest_clone, language_clone, content_clone).await;
    });
    
    Ok(task_id)
}

#[tauri::command]
pub async fn pause_download(task_id: String, state: State<'_, AppState>) -> Result<(), String> {
    let mut downloads = state.downloads.lock().await;
    if let Some(task) = downloads.get_mut(&task_id) {
        task.status = "paused".to_string();
    }
    Ok(())
}

#[tauri::command]
pub async fn resume_download(task_id: String, state: State<'_, AppState>) -> Result<(), String> {
    let mut downloads = state.downloads.lock().await;
    if let Some(task) = downloads.get_mut(&task_id) {
        task.status = "downloading".to_string();
    }
    Ok(())
}

#[tauri::command]
pub async fn cancel_download(task_id: String, state: State<'_, AppState>) -> Result<(), String> {
    let mut downloads = state.downloads.lock().await;
    if let Some(task) = downloads.get_mut(&task_id) {
        task.status = "error".to_string();
        task.error = Some("Téléchargement annulé".to_string());
    }
    Ok(())
}

#[tauri::command]
pub async fn get_download_progress(task_id: String, state: State<'_, AppState>) -> Result<Option<DownloadTask>, String> {
    let downloads = state.downloads.lock().await;
    Ok(downloads.get(&task_id).cloned())
}



// Exécuter un vrai téléchargement avec rman-dl.exe
async fn execute_real_download(task_id: String, manifest_url: String, language: String, content: String) {
    println!("🚀 Démarrage du téléchargement réel pour task: {}", task_id);
    println!("📄 Manifest URL: {}", manifest_url);
    println!("🌍 Langue: {}", language);
    println!("📦 Contenu: {}", content);
    
    // 1. Télécharger le manifest en binaire
    println!("📥 Téléchargement du manifest...");
    let manifest_content = match reqwest::get(&manifest_url).await {
        Ok(response) => {
            println!("📡 Status HTTP: {}", response.status());
            println!("📡 Content-Type: {:?}", response.headers().get("content-type"));
            println!("📡 Content-Length: {:?}", response.headers().get("content-length"));
            
            if response.status().is_success() {
                match response.bytes().await {
                    Ok(bytes) => {
                        println!("✅ Manifest téléchargé ({} bytes)", bytes.len());
                        println!("📄 Premiers 32 bytes (hex):");
                        println!("{:02x?}", bytes.iter().take(32).collect::<Vec<_>>());
                        bytes
                    }
                    Err(e) => {
                        println!("❌ Erreur lors de la lecture du manifest: {}", e);
                        return;
                    }
                }
            } else {
                println!("❌ Erreur HTTP: {}", response.status());
                return;
            }
        }
        Err(e) => {
            println!("❌ Erreur lors du téléchargement du manifest: {}", e);
            return;
        }
    };
    
    // 2. Sauvegarder le manifest localement
    let manifest_filename = format!("manifest_{}.manifest", task_id);
    let manifest_path = if cfg!(debug_assertions) {
        std::env::current_dir()
            .unwrap()
            .parent()
            .unwrap()
            .join("downloads")
            .join(&manifest_filename)
    } else {
        std::env::current_dir()
            .unwrap()
            .join("downloads")
            .join(&manifest_filename)
    };
    
    // Créer le dossier downloads s'il n'existe pas
    if let Some(parent) = manifest_path.parent() {
        if !parent.exists() {
            std::fs::create_dir_all(parent).unwrap_or_else(|e| {
                println!("❌ Erreur lors de la création du dossier downloads: {}", e);
                return;
            });
        }
    }
    
    // Sauvegarder le manifest en binaire
    match std::fs::write(&manifest_path, &manifest_content) {
        Ok(_) => println!("✅ Manifest sauvegardé: {} ({} bytes)", manifest_path.display(), manifest_content.len()),
        Err(e) => {
            println!("❌ Erreur lors de la sauvegarde du manifest: {}", e);
            return;
        }
    }
    
    // 3. Chemin vers l'exécutable rman-dl.exe
    let exe_path = if cfg!(debug_assertions) {
        std::env::current_dir()
            .unwrap()
            .parent()
            .unwrap()
            .join("assets")
            .join("rman-dl.exe")
            .to_string_lossy()
            .to_string()
    } else {
        "rman-dl.exe".to_string()
    };
    
    // Vérifier que l'exécutable existe
    println!("🔍 Chemin vers rman-dl.exe: {}", exe_path);
    if !Path::new(&exe_path).exists() {
        println!("❌ Erreur: rman-dl.exe non trouvé dans {}", exe_path);
        return;
    }
    println!("✅ rman-dl.exe trouvé !");
    
    // 4. Créer le dossier de sortie pour les fichiers téléchargés
    let output_dir = if cfg!(debug_assertions) {
        std::env::current_dir()
            .unwrap()
            .parent()
            .unwrap()
            .join("downloads")
            .join("files")
    } else {
        std::env::current_dir()
            .unwrap()
            .join("downloads")
            .join("files")
    };
    
    // Créer le dossier de sortie s'il n'existe pas
    if !output_dir.exists() {
        std::fs::create_dir_all(&output_dir).unwrap_or_else(|e| {
            println!("❌ Erreur lors de la création du dossier de sortie: {}", e);
            return;
        });
    }
    
    println!("📁 Dossier de sortie: {}", output_dir.display());
    
    // 5. Construire la commande rman-dl avec le fichier manifest local
    let mut cmd = TokioCommand::new(&exe_path);
    
    // Changer le répertoire de travail vers le dossier de sortie
    cmd.current_dir(&output_dir);
    
    // Arguments selon votre script : rman-dl -l "none|windows|%language%" --cdn http://lol.secure.dyn.riotcdn.net/channels/public "manifest_file" -p %content%
    cmd.arg("-l")
       .arg(&format!("none|windows|{}", language))
       .arg("--cdn")
       .arg("http://lol.secure.dyn.riotcdn.net/channels/public")
       .arg(manifest_path.to_string_lossy().to_string());
    
    // Ajouter le filtre de contenu seulement s'il n'est pas vide
    if !content.trim().is_empty() {
        cmd.arg("-p").arg(&content);
    }
    
    println!("🔧 Commande exécutée: {:?}", cmd);
    
    // 6. Exécuter la commande de manière non-bloquante
    println!("🚀 Lancement de rman-dl.exe...");
    
    match cmd.spawn() {
        Ok(mut child) => {
            println!("✅ rman-dl.exe lancé avec PID: {:?}", child.id());
            
            // Attendre la fin avec timeout en utilisant tokio
            let timeout_duration = tokio::time::Duration::from_secs(30); // 30 secondes max
            
            match tokio::time::timeout(timeout_duration, child.wait()).await {
                Ok(result) => {
                    match result {
                        Ok(status) => {
                            if status.success() {
                                println!("✅ rman-dl.exe terminé avec succès");
                            } else {
                                println!("❌ rman-dl.exe terminé avec erreur: {:?}", status);
                            }
                        }
                        Err(e) => {
                            println!("❌ Erreur lors de l'attente de rman-dl.exe: {}", e);
                        }
                    }
                }
                Err(_) => {
                    println!("⏰ Timeout après 30 secondes, arrêt de rman-dl.exe...");
                    let _ = child.kill().await;
                    let _ = child.wait().await;
                }
            }
        }
        Err(e) => {
            println!("❌ Erreur lors du lancement de rman-dl.exe: {}", e);
        }
    }
}
