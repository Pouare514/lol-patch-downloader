use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;
use tauri::State;
use tokio::sync::Mutex;
use tokio::process::Command as TokioCommand;
use std::sync::Arc;

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
    pub output_path: Option<String>,
}

// État global pour stocker les données
pub struct AppState {
    pub manifests: Mutex<Vec<PatchManifest>>,
    pub downloads: Mutex<HashMap<String, DownloadTask>>,
    pub download_processes: Mutex<HashMap<String, Arc<Mutex<Option<tokio::process::Child>>>>>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            manifests: Mutex::new(Vec::new()),
            downloads: Mutex::new(HashMap::new()),
            download_processes: Mutex::new(HashMap::new()),
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
    output_path: Option<String>,
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
        output_path: output_path.clone(),
    };
    
    let mut downloads = state.downloads.lock().await;
    downloads.insert(task_id.clone(), task);
    
    // Démarrer le vrai téléchargement avec rman-dl.exe
    let task_id_clone = task_id.clone();
    let manifest_clone = manifest.clone();
    let language_clone = language.clone();
    let content_clone = content.clone();
    let output_path_clone = output_path.clone();
    
    tokio::spawn(async move {
        execute_real_download(task_id_clone, manifest_clone, language_clone, content_clone, output_path_clone).await;
    });
    
    Ok(task_id)
}

#[tauri::command]
pub async fn pause_download(task_id: String, state: State<'_, AppState>) -> Result<(), String> {
    let downloads = state.downloads.lock().await;
    if let Some(_task) = downloads.get(&task_id) {
        // Note: En production, on mettrait à jour via un mécanisme plus robuste
        println!("📊 Task {} mise en pause", task_id);
    }

    // Arrêter le processus si en cours
    let processes = state.download_processes.lock().await;
    if let Some(process_arc) = processes.get(&task_id) {
        if let Some(child) = &mut *process_arc.lock().await {
            let _ = child.kill().await;
        }
    }
    
    Ok(())
}

#[tauri::command]
pub async fn resume_download(task_id: String, state: State<'_, AppState>) -> Result<(), String> {
    let downloads = state.downloads.lock().await;
    if let Some(task) = downloads.get(&task_id) {
        
        // Redémarrer le téléchargement
        let task_id_clone = task_id.clone();
        let manifest_clone = task.manifest.clone();
        let language = "en_us".to_string(); // Par défaut
        let content = "".to_string(); // Par défaut
        let output_path = task.output_path.clone();
        
        tokio::spawn(async move {
            execute_real_download(task_id_clone, manifest_clone, language, content, output_path).await;
        });
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
    
    // Arrêter le processus
    let processes = state.download_processes.lock().await;
    if let Some(process_arc) = processes.get(&task_id) {
        if let Some(child) = &mut *process_arc.lock().await {
            let _ = child.kill().await;
        }
    }
    
    Ok(())
}

#[tauri::command]
pub async fn get_download_progress(task_id: String, state: State<'_, AppState>) -> Result<Option<DownloadTask>, String> {
    let downloads = state.downloads.lock().await;
    Ok(downloads.get(&task_id).cloned())
}

// Nouvelle commande pour sélectionner le dossier de destination
#[tauri::command]
pub async fn select_download_folder() -> Result<Option<String>, String> {
    println!("📁 Ouverture de la boîte de dialogue de sélection de dossier...");

    // Ouvrir la boîte de dialogue native pour sélectionner un dossier
    let dialog_result = rfd::FileDialog::new()
        .set_title("Sélectionner le dossier de destination pour les patches LoL")
        .set_directory(dirs::home_dir().unwrap_or_else(|| std::path::PathBuf::from("C:\\")))
        .pick_folder();

    match dialog_result {
        Some(selected_path) => {
            println!("📁 Dossier sélectionné: {}", selected_path.display());

            // Créer le dossier s'il n'existe pas
            if !selected_path.exists() {
                std::fs::create_dir_all(&selected_path).map_err(|e| {
                    println!("⚠️ Impossible de créer le dossier: {}", e);
                    format!("Impossible de créer le dossier: {}", e)
                })?;
            }

            Ok(Some(selected_path.to_string_lossy().to_string()))
        }

        None => {
            println!("❌ Aucun dossier sélectionné par l'utilisateur");
            Ok(None)
        }
    }
}

// Fonction pour mettre à jour le statut d'un téléchargement
async fn update_download_status(task_id: String, status: String, progress: f64, error: String) {
    // Note: Dans un vrai environnement, on utiliserait l'état global pour mettre à jour le statut
    // Pour l'instant, on se contente d'un log
    println!("📊 Mise à jour statut - Task: {}, Status: {}, Progress: {}%, Error: {}", task_id, status, progress, error);
}

// Fonction pour simuler la progression du téléchargement
async fn simulate_download_progress(task_id: String) {
    let mut progress = 0.0;

    // Mettre à jour le statut initial
    update_download_status(task_id.clone(), "downloading".to_string(), progress, String::new()).await;

    // Simuler la progression
    while progress < 95.0 {
        tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;

        // Progression non linéaire (plus lente au début et à la fin)
        let increment = if progress < 10.0 {
            2.0 + rand::random::<f64>() * 3.0
        } else if progress > 80.0 {
            0.5 + rand::random::<f64>() * 1.5
        } else {
            3.0 + rand::random::<f64>() * 5.0
        };

        progress = (progress + increment).min(95.0);

        // Simuler la vitesse et l'ETA
        let speed = format!("{:.1} MB/s", 1.0 + rand::random::<f64>() * 2.0);
        let remaining = ((100.0 - progress) / 10.0).round() as i32;
        let eta = if remaining > 60 {
            format!("{}m {}s", remaining / 60, remaining % 60)
        } else {
            format!("{}s", remaining * 6)
        };

        println!("📊 Progression simulée - Task: {}, Progress: {:.1}%, Speed: {}, ETA: {}",
                task_id, progress, speed, eta);

        update_download_status(task_id.clone(), "downloading".to_string(), progress, String::new()).await;
    }

    // Attendre un peu avant de marquer comme terminé
    tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;
}

// Exécuter un vrai téléchargement avec rman-dl.exe
async fn execute_real_download(
    task_id: String, 
    manifest_url: String, 
    language: String, 
    content: String,
    output_path: Option<String>
) {
    println!("🚀 Démarrage du téléchargement réel pour task: {}", task_id);
    println!("📄 Manifest URL: {}", manifest_url);
    println!("🌍 Langue: {}", language);
    println!("📦 Contenu: {}", content);
    println!("📁 Dossier de sortie: {:?}", output_path);
    
    // 1. Télécharger le manifest en binaire
    println!("📥 Téléchargement du manifest...");
    let manifest_content = match reqwest::get(&manifest_url).await {
        Ok(response) => {
            println!("📡 Status HTTP: {}", response.status());
            
            if response.status().is_success() {
                match response.bytes().await {
                    Ok(bytes) => {
                        println!("✅ Manifest téléchargé ({} bytes)", bytes.len());
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
        // En mode debug, chercher dans le répertoire assets du projet
        let current_dir = std::env::current_dir().unwrap();
        let project_root = current_dir.parent().unwrap().parent().unwrap();
        let assets_path = project_root.join("assets").join("rman-dl.exe");

        println!("🔍 Recherche dans: {}", assets_path.display());
        if assets_path.exists() {
            assets_path.to_string_lossy().to_string()
        } else {
            println!("❌ rman-dl.exe non trouvé dans {}", assets_path.display());
            return;
        }
    } else {
        // Essayer plusieurs chemins possibles pour l'exécutable en production
        let current_dir = std::env::current_dir().unwrap();
        let exe_dir = std::env::current_exe().unwrap().parent().unwrap().to_path_buf();

        let possible_paths = vec![
            "rman-dl.exe".to_string(),
            "./rman-dl.exe".to_string(),
            current_dir.join("rman-dl.exe").to_string_lossy().to_string(),
            // Chercher dans le répertoire d'installation de l'app
            exe_dir.join("rman-dl.exe").to_string_lossy().to_string(),
            // Chercher dans le dossier assets (pour les builds Tauri)
            exe_dir.join("assets").join("rman-dl.exe").to_string_lossy().to_string(),
            // Chercher dans le dossier parent assets (pour les builds de développement)
            exe_dir.parent().unwrap().join("assets").join("rman-dl.exe").to_string_lossy().to_string(),
            // Chercher dans le dossier resources de Tauri (pour les builds finaux)
            exe_dir.join("resources").join("rman-dl.exe").to_string_lossy().to_string(),
            // Chercher dans le dossier assets local (pour les builds de développement)
            current_dir.join("assets").join("rman-dl.exe").to_string_lossy().to_string(),
        ];

        let mut found_path = None;
        for path in &possible_paths {
            println!("🔍 Vérification: {}", path);
            if Path::new(path).exists() {
                println!("✅ Trouvé: {}", path);
                found_path = Some(path.clone());
                break;
            }
        }

        match found_path {
            Some(path) => path,
            None => {
                println!("❌ Erreur: rman-dl.exe non trouvé dans les chemins suivants:");
                for path in &possible_paths {
                    println!("  - {}", path);
                }
                return;
            }
        }
    };

    // Vérifier que l'exécutable existe
    println!("🔍 Chemin vers rman-dl.exe: {}", exe_path);
    if !Path::new(&exe_path).exists() {
        println!("❌ Erreur: rman-dl.exe non trouvé dans {}", exe_path);
        return;
    }
    println!("✅ rman-dl.exe trouvé !");
    
    // 4. Créer le dossier de sortie pour les fichiers téléchargés
    let current_dir = std::env::current_dir().unwrap();
    let project_root = if cfg!(debug_assertions) {
        current_dir.parent().unwrap().parent().unwrap()
    } else {
        &current_dir
    };

    let output_dir = if let Some(custom_path) = output_path {
        let path = std::path::PathBuf::from(custom_path);
        if path.is_relative() && cfg!(debug_assertions) {
            // En mode debug, résoudre le chemin relatif depuis le répertoire du projet
            project_root.join(path)
        } else {
            path
        }
    } else if cfg!(debug_assertions) {
        project_root.join("downloads").join("files")
    } else {
        current_dir.join("downloads").join("files")
    };

    // Créer le dossier de sortie s'il n'existe pas
    if !output_dir.exists() {
        std::fs::create_dir_all(&output_dir).unwrap_or_else(|e| {
            println!("❌ Erreur lors de la création du dossier de sortie: {}", e);
            return;
        });
    }

    println!("📁 Dossier de sortie: {}", output_dir.display());
    println!("📁 Dossier de sortie existe: {}", output_dir.exists());
    println!("📁 Dossier de sortie est un répertoire: {}", output_dir.is_dir());

    // Vérifier que le manifest existe avant de continuer
    println!("🔍 Vérification du manifest: {}", manifest_path.display());
    println!("📄 Manifest existe: {}", manifest_path.exists());
    if let Ok(metadata) = std::fs::metadata(&manifest_path) {
        println!("📄 Taille du manifest: {} bytes", metadata.len());
    }

    // 5. Construire la commande rman-dl avec le fichier manifest local
    let mut cmd = TokioCommand::new(&exe_path);

    // Note: On ne change pas le répertoire de travail car on passe le chemin complet en argument

    // Arguments selon la syntaxe correcte : rman-dl [options] manifest output
    // Options d'abord - commencer simple pour diagnostiquer
    cmd.arg("--no-progress"); // Désactiver la barre de progression
    cmd.arg("--no-verify");   // Ne pas vérifier les fichiers existants

    // Test avec filtre de langue simple
    cmd.arg("-l");
    cmd.arg("none"); // Commencer avec "none" seulement pour les fichiers internationaux
    println!("🌍 Filtre de langue: none (fichiers internationaux seulement)");

    cmd.arg("--cdn");
    cmd.arg("http://lol.secure.dyn.riotcdn.net/channels/public");

    // Limiter le téléchargement pour les tests (optionnel)
    cmd.arg("--cdn-workers");
    cmd.arg("4"); // Utiliser seulement 4 workers pour éviter la surcharge

    // Filtre de contenu si spécifié
    if !content.trim().is_empty() && content.trim() != "" {
        cmd.arg("-p");
        cmd.arg(&content);
        println!("📋 Filtre de contenu appliqué: {}", content);
    } else {
        println!("📋 Aucun filtre de contenu - téléchargement de tous les fichiers");
    }

    // Ensuite le manifest
    cmd.arg(manifest_path.to_string_lossy().to_string());

    // Enfin le dossier de sortie (output directory)
    cmd.arg(output_dir.to_string_lossy().to_string());

    // Rediriger stdout et stderr vers des fichiers pour le débogage
    let stdout_file = output_dir.join("rman-dl.stdout.log");
    let stderr_file = output_dir.join("rman-dl.stderr.log");
    cmd.stdout(std::process::Stdio::piped());
    cmd.stderr(std::process::Stdio::piped());

    println!("🔧 Commande exécutée: {:?}", cmd);
    println!("🔧 Arguments de la commande:");
    println!("  - Exécutable: {}", exe_path);
    println!("  - Options:");
    println!("    - Langue: none|windows|{}", language);
    println!("    - CDN: http://lol.secure.dyn.riotcdn.net/channels/public");
    println!("    - Filtre contenu: {}", if content.trim().is_empty() { "aucun" } else { &content });
    println!("  - Manifest: {}", manifest_path.display());
    println!("  - Dossier de sortie: {}", output_dir.display());

    // Tester si rman-dl.exe peut être exécuté avec --help
    println!("🧪 Test de rman-dl.exe...");
    match TokioCommand::new(&exe_path)
        .arg("--help")
        .output()
        .await {
        Ok(output) => {
            println!("✅ rman-dl.exe répond:");
            if let Ok(stdout) = String::from_utf8(output.stdout) {
                println!("📄 Sortie: {}", stdout.lines().take(5).collect::<Vec<&str>>().join("\n"));
            }
            if let Ok(stderr) = String::from_utf8(output.stderr) {
                if !stderr.is_empty() {
                    println!("⚠️ Erreurs: {}", stderr.lines().take(3).collect::<Vec<&str>>().join("\n"));
                }
            }
        }
        Err(e) => {
            println!("❌ Impossible de tester rman-dl.exe: {}", e);
        }
    }

    // 6. Exécuter la commande de manière non-bloquante
    println!("🚀 Lancement de rman-dl.exe avec le manifest...");

    // Créer un fichier de log pour capturer la sortie
    let log_file = output_dir.join("rman-dl.log");
    println!("📝 Logs rman-dl disponibles dans: {}", log_file.display());

    match cmd.spawn() {
        Ok(mut child) => {
            println!("✅ rman-dl.exe lancé avec PID: {:?}", child.id());

            // Capturer stdout et stderr
            let stdout_task = if let Some(stdout) = child.stdout.take() {
                let stdout_file_clone = stdout_file.clone();
                Some(tokio::spawn(async move {
                    use tokio::io::AsyncReadExt;
                    let mut reader = tokio::io::BufReader::new(stdout);
                    let mut buffer = Vec::new();
                    if let Err(e) = reader.read_to_end(&mut buffer).await {
                        println!("❌ Erreur lecture stdout: {}", e);
                    } else if let Ok(content) = String::from_utf8(buffer) {
                        if let Err(e) = std::fs::write(&stdout_file_clone, &content) {
                            println!("❌ Erreur sauvegarde stdout: {}", e);
                        } else {
                            println!("📄 Sortie stdout sauvegardée dans: {}", stdout_file_clone.display());
                        }
                    }
                }))
            } else {
                None
            };

            let stderr_task = if let Some(stderr) = child.stderr.take() {
                let stderr_file_clone = stderr_file.clone();
                Some(tokio::spawn(async move {
                    use tokio::io::AsyncReadExt;
                    let mut reader = tokio::io::BufReader::new(stderr);
                    let mut buffer = Vec::new();
                    if let Err(e) = reader.read_to_end(&mut buffer).await {
                        println!("❌ Erreur lecture stderr: {}", e);
                    } else if let Ok(content) = String::from_utf8(buffer) {
                        if let Err(e) = std::fs::write(&stderr_file_clone, &content) {
                            println!("❌ Erreur sauvegarde stderr: {}", e);
                        } else {
                            println!("📄 Sortie stderr sauvegardée dans: {}", stderr_file_clone.display());
                        }
                    }
                }))
            } else {
                None
            };

            // Simuler la progression pendant que le processus tourne
            let task_id_clone = task_id.clone();
            tokio::spawn(async move {
                simulate_download_progress(task_id_clone).await;
            });

            // Attendre la fin avec timeout en utilisant tokio
            let timeout_duration = tokio::time::Duration::from_secs(1800); // 30 minutes max pour les gros téléchargements

            println!("⏳ Attente de la fin de rman-dl.exe (timeout: 30 minutes)...");
            println!("📝 Logs disponibles:");
            println!("   - stdout: {}", stdout_file.display());
            println!("   - stderr: {}", stderr_file.display());
            println!("   - général: {}", log_file.display());

            match tokio::time::timeout(timeout_duration, child.wait()).await {
                Ok(result) => {
                    // Attendre que les tâches de capture se terminent
                    if let Some(task) = stdout_task {
                        let _ = task.await;
                    }
                    if let Some(task) = stderr_task {
                        let _ = task.await;
                    }

                    match result {
                        Ok(status) => {
                            println!("🏁 rman-dl.exe terminé - Code de sortie: {}", status.code().unwrap_or(-1));
                            if status.success() {
                                println!("✅ rman-dl.exe terminé avec succès");
                                update_download_status(task_id.clone(), "completed".to_string(), 100.0, "Terminé avec succès".to_string()).await;
                            } else {
                                println!("❌ rman-dl.exe terminé avec erreur: {:?}", status);
                                update_download_status(task_id.clone(), "error".to_string(), 0.0, format!("Erreur rman-dl (code {}): {:?}", status.code().unwrap_or(-1), status)).await;
                            }
                        }
                        Err(e) => {
                            println!("❌ Erreur lors de l'attente de rman-dl.exe: {}", e);
                            update_download_status(task_id.clone(), "error".to_string(), 0.0, format!("Erreur système: {}", e)).await;
                        }
                    }
                }
                Err(_) => {
                    // Attendre que les tâches de capture se terminent avant de tuer
                    if let Some(task) = stdout_task {
                        let _ = task.await;
                    }
                    if let Some(task) = stderr_task {
                        let _ = task.await;
                    }

                    println!("⏰ Timeout après 30 minutes, arrêt forcé de rman-dl.exe...");
                    let _ = child.kill().await;
                    update_download_status(task_id.clone(), "error".to_string(), 0.0, "Timeout après 30 minutes".to_string()).await;
                }
            }
        }
        Err(e) => {
            println!("❌ Erreur lors du lancement de rman-dl.exe: {}", e);
            update_download_status(task_id.clone(), "error".to_string(), 0.0, format!("Erreur de lancement: {}", e)).await;
        }
    }
}
