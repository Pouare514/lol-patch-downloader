import { useState, useEffect } from 'react';
import { safeInvoke } from '@/utils/tauri';
import { DownloadTask } from '@/types';

export function useDownloads() {
  const [downloads, setDownloads] = useState<DownloadTask[]>([]);
  const [loading, setLoading] = useState(false);



  // Démarrer un téléchargement
  const startDownload = async (manifest: string, language: string, content: string) => {
    try {
      setLoading(true);
      console.log('🔍 Démarrage du téléchargement...');
      console.log('📄 Manifest:', manifest);
      console.log('🌍 Language:', language);
      console.log('📦 Content:', content);
      
      const taskId = await safeInvoke('start_download', { manifest, language, content });
      console.log('🎯 TaskId reçu:', taskId);
      
      // Si on n'est pas dans Tauri, afficher un message d'erreur
      if (!taskId || typeof taskId !== 'string') {
        console.error('❌ TaskId invalide:', taskId);
        throw new Error('Téléchargement non disponible en dehors de l\'environnement Tauri');
      }
      
      const newTask: DownloadTask = {
        id: taskId,
        manifest,
        version: '', // Sera mis à jour par le backend
        status: 'pending',
        progress: 0,
        speed: '0 MB/s',
        eta: '--',
        startTime: new Date(),
      };
      
      setDownloads(prev => [...prev, newTask]);
      return taskId;
    } catch (error) {
      console.error('Erreur lors du démarrage du téléchargement:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Mettre en pause un téléchargement
  const pauseDownload = async (taskId: string) => {
    try {
      await safeInvoke('pause_download', { taskId });
      setDownloads(prev => 
        prev.map(task => 
          task.id === taskId 
            ? { ...task, status: 'paused' as const }
            : task
        )
      );
    } catch (error) {
      console.error('Erreur lors de la mise en pause:', error);
    }
  };

  // Reprendre un téléchargement
  const resumeDownload = async (taskId: string) => {
    try {
      await safeInvoke('resume_download', { taskId });
      setDownloads(prev => 
        prev.map(task => 
          task.id === taskId 
            ? { ...task, status: 'downloading' as const }
            : task
        )
      );
    } catch (error) {
      console.error('Erreur lors de la reprise:', error);
    }
  };

  // Annuler un téléchargement
  const cancelDownload = async (taskId: string) => {
    try {
      await safeInvoke('cancel_download', { taskId });
      setDownloads(prev => 
        prev.map(task => 
          task.id === taskId 
            ? { ...task, status: 'error' as const, error: 'Téléchargement annulé' }
            : task
        )
      );
    } catch (error) {
      console.error('Erreur lors de l\'annulation:', error);
    }
  };

  // Mettre à jour le progrès d'un téléchargement
  const updateProgress = async (taskId: string) => {
    try {
      const task = await safeInvoke('get_download_progress', { taskId });
      if (task && typeof task === 'object' && 'id' in task) {
        setDownloads(prev => 
          prev.map(t => t.id === taskId ? task as DownloadTask : t)
        );
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du progrès:', error);
    }
  };

  // Nettoyer les téléchargements terminés
  const cleanupCompleted = () => {
    setDownloads(prev => 
      prev.filter(task => 
        task.status !== 'completed' && task.status !== 'error'
      )
    );
  };

  // Polling pour mettre à jour les progrès
  useEffect(() => {
    const interval = setInterval(() => {
      downloads.forEach(task => {
        if (task.status === 'downloading' || task.status === 'pending') {
          updateProgress(task.id);
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [downloads]);

  return {
    downloads,
    loading,
    startDownload,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    cleanupCompleted,
  };
}
