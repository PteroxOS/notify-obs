import { MediaQueueUI } from './MediaQueueUI.js';

export class MediaQueueManager {
  constructor() {
    this.ui = new MediaQueueUI();
    this.queue = [];
    this.isPlaying = false;
    this.player = null;
    this.progressTimer = null;
    
    this.initPlayer();
  }

  initPlayer() {
    const checkYT = setInterval(() => {
      if (window.YT && window.YT.Player) {
        clearInterval(checkYT);
        this.player = new YT.Player('hidden-player', {
          height: '10',
          width: '10',
          playerVars: { 
            autoplay: 1, 
            controls: 0,
            disablekb: 1,
            rel: 0,
            modestbranding: 1
          },
          events: {
            onReady: () => {
              if (this.queue.length > 0 && !this.isPlaying) {
                this.playNext();
              }
            },
            onStateChange: this.onPlayerStateChange.bind(this),
            onError: () => this.skipCurrent()
          }
        });
      }
    }, 100);
  }

  addTrack(track) {
    if (!track || !track.ytId) return;
    
    this.queue.push(track);
    
    // If not playing, and player is ready, start it
    if (!this.isPlaying && this.player && this.player.loadVideoById) {
      this.playNext();
    } else {
      // Just update UI to show new list if already playing
      if (this.isPlaying) {
         this.ui.updateQueue(this.queue[0], this.queue.slice(1));
      }
    }
  }

  playNext() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      this.ui.updateQueue(null, []);
      if (this.progressTimer) {
        clearInterval(this.progressTimer);
        this.progressTimer = null;
      }
      if (this.player && this.player.stopVideo) {
         this.player.stopVideo();
      }
      return;
    }

    this.isPlaying = true;
    const track = this.queue[0];
    this.ui.updateQueue(track, this.queue.slice(1));
    
    if (this.player && this.player.loadVideoById) {
       this.player.loadVideoById(track.ytId);
    }

    if (this.progressTimer) clearInterval(this.progressTimer);
    this.progressTimer = setInterval(() => {
      if (this.player && this.player.getCurrentTime && this.player.getDuration) {
        const current = this.player.getCurrentTime() || 0;
        const total = track.duration || this.player.getDuration() || 0;
        this.ui.updateProgress(current, total);
      }
    }, 1000);
  }

  onPlayerStateChange(event) {
    // When video ends
    if (event.data === YT.PlayerState.ENDED) {
      this.skipCurrent();
    }
  }

  skipCurrent() {
    if (this.queue.length > 0) {
      this.queue.shift();
      this.playNext();
    }
  }
}
