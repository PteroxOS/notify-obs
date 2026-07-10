import { AlertUI } from './AlertUI.js';
import { YouTubeProvider } from './providers/YouTubeProvider.js';
import { TikTokProvider } from './providers/TikTokProvider.js';

export class QueueManager {
  constructor(streamKey) {
    this.streamKey = streamKey;
    this.queue = [];
    this.isPlaying = false;
    
    // Connect to Socket
    this.socket = io({
      query: { streamKey: this.streamKey },
    });

    this.socket.on('donation', (payload) => {
      // Immediately push to media queue if there's a track
      if (payload.mediaQueueTrack) {
        localStorage.setItem('notify_play_song', JSON.stringify({
          track: payload.mediaQueueTrack,
          name: payload.name,
          timestamp: Date.now()
        }));
      }
      this.queue.push(payload);
      this.processQueue();
    });
  }

  processQueue() {
    if (this.isPlaying || this.queue.length === 0) return;
    this.isPlaying = true;
    
    const donation = this.queue.shift();
    // Calculate duration based on amount: 1 second per Rp 2.000, min 8s, max 60s
    // Example: Rp 50.000 = 25 seconds
    const duration = Math.min(60, Math.max(8, Math.floor(donation.amount / 2000)));
    const playerId = 'media-' + Math.random().toString(36).substr(2, 9);
    
    const onEnd = () => {
      this.isPlaying = false;
      localStorage.setItem('notify_set_volume', JSON.stringify({ volume: 100, timestamp: Date.now() }));
      this.processQueue();
    };

    const alertUI = new AlertUI(donation, duration, onEnd);
    // Determine if it has a Song Share track
    if (donation.mediaQueueTrack) {
      // Song was already sent to media queue on 'donation' event receipt
      // Just show text alert visually (the media.html handles playing)
      alertUI.render('', false);
      alertUI.startVisualAlert();
      return;
    }
    
    // Duck background music volume for visual alerts (Text/Video)
    localStorage.setItem('notify_set_volume', JSON.stringify({ volume: 15, timestamp: Date.now() }));

    // Determine provider for other media (e.g. TikTok, Instagram)
    const ytId = this.extractYouTubeId(donation.youtubeUrl);
    const isTikTok = /tiktok\.com/i.test(donation.youtubeUrl || '');
    
    if (ytId) {
      // Fallback: If for some reason it wasn't picked up by backend as mediaQueueTrack
      const provider = new YouTubeProvider(playerId, ytId, alertUI);
      alertUI.render(provider.getHtml(), true);
      provider.init();
    } else if (isTikTok) {
      const provider = new TikTokProvider(playerId, donation.youtubeUrl, alertUI);
      alertUI.render(provider.getHtml(), true);
      provider.init();
    } else if (donation.instagramUrl) {
      import('./providers/InstagramProvider.js').then(({ InstagramProvider }) => {
        const provider = new InstagramProvider(playerId, donation.instagramUrl, alertUI);
        alertUI.render(provider.getHtml(), true);
        provider.init();
      });
    } else {
      // Text only alert
      alertUI.render('', false);
      alertUI.startVisualAlert();
    }
  }

  extractYouTubeId(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }
}

