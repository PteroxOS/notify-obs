import { MediaQueueManager } from './MediaQueueManager.js';
import { MediaQueueUI } from './MediaQueueUI.js';

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const streamKey = params.get('key');

  if (!streamKey) {
    document.body.innerHTML = '<h2 style="color: white; font-family: Inter;">Missing Stream Key</h2>';
    return;
  }

  // Set up socket connection
  const socket = io({ query: { streamKey: streamKey } });

  // Initialize Media Queue
  const mediaQueueManager = new MediaQueueManager();

  socket.on('connect', () => {
    console.log('Connected to media overlay');
  });

  socket.on('donation', (donation) => {
    if (donation.mediaQueueTrack) {
      mediaQueueManager.addTrack(donation.mediaQueueTrack, donation.name);
    }
  });

  socket.on('error', (err) => {
    console.error('Socket error:', err);
  });
});
