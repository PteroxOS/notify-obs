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
      this.queue.push(payload);
      this.processQueue();
    });
  }

  processQueue() {
    if (this.isPlaying || this.queue.length === 0) return;
    this.isPlaying = true;
    
    const donation = this.queue.shift();
    const duration = 8; // 8 seconds visual alert duration
    const playerId = 'media-' + Math.random().toString(36).substr(2, 9);
    
    const onEnd = () => {
      this.isPlaying = false;
      this.processQueue();
    };

    const alertUI = new AlertUI(donation, duration, onEnd);
    
    // Determine if it has a Song Share track
    if (donation.mediaQueueTrack) {
      // Just show text alert visually (the media.html handles playing)
      alertUI.render('', false);
      alertUI.startVisualAlert();
      return;
    }
    
    // Determine provider for other media (e.g. TikTok)
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

