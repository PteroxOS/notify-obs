import { MediaQueueManager } from './MediaQueueManager.js';
import { MediaQueueUI } from './MediaQueueUI.js';

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const streamKey = params.get('key');

  if (!streamKey) {
    document.body.innerHTML = '<h2 style="color: white; font-family: Inter;">Missing Stream Key</h2>';
    return;
  }

  // Initialize Media Queue
  const mediaQueueManager = new MediaQueueManager();

  // Listen for signals from overlay.html
  window.addEventListener('storage', (e) => {
    if (e.key === 'notify_play_song' && e.newValue) {
      try {
        const payload = JSON.parse(e.newValue);
        if (payload.track) {
          mediaQueueManager.addTrack(payload.track, payload.name);
        }
      } catch (err) {
        console.error('Error parsing notify_play_song:', err);
      }
    }
    
    if (e.key === 'notify_set_volume' && e.newValue) {
      try {
        const payload = JSON.parse(e.newValue);
        if (typeof payload.volume === 'number') {
          mediaQueueManager.setVolume(payload.volume);
        }
      } catch (err) {
        console.error('Error parsing notify_set_volume:', err);
      }
    }
  });

  console.log('Media overlay ready and waiting for signals from QueueManager');
});
