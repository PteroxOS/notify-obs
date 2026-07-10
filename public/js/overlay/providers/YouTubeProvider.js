export class YouTubeProvider {
  constructor(playerId, ytId, alertUI) {
    this.playerId = playerId;
    this.ytId = ytId;
    this.alertUI = alertUI;
    this.skipTimeout = null;
  }

  getHtml() {
    return `
      <div class="video-container" id="container-${this.playerId}" style="display: flex; justify-content: center; align-items: center; position: relative; overflow: hidden; background: #000; height: 326px;">
        <div id="loading-${this.playerId}" style="position: absolute; top:0; left:0; width: 100%; height: 100%; background: #18191c; z-index: 20; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 40px; box-sizing: border-box; font-family: 'Inter', sans-serif;">
           <div style="font-size: 16px; color: #e4e6eb; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 12px; text-transform: uppercase;">Memuat Media...</div>
           <div style="font-size: 14px; color: #b0b3b8; line-height: 1.6; max-width: 460px;">Maksimal durasi loading adalah 30 detik, Media akan ter-skip apabila tidak dapat dimulai dalam waktu yang ditentukan. <span style="color: #fceb64; font-weight: 600;">INI BERJALAN OTOMATIS.</span></div>
        </div>
        <div id="${this.playerId}" style="width: 100%; height: 100%;"></div>
      </div>
    `;
  }

  init() {
    // Set 30s skip timeout
    this.skipTimeout = setTimeout(() => {
      this.alertUI.endAlertNow();
    }, 30000);

    const checkYT = setInterval(() => {
      if (window.YT && window.YT.Player) {
        clearInterval(checkYT);
        const player = new YT.Player(this.playerId, {
          height: '100%',
          width: '100%',
        videoId: this.ytId,
        playerVars: { 
          autoplay: 1, 
          controls: 0, 
          disablekb: 1, 
          rel: 0,
          modestbranding: 1
        },
        events: {
          onReady: (event) => {
            event.target.playVideo();
          },
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.PLAYING) {
              const loadingEl = document.getElementById(`loading-${this.playerId}`);
              if (loadingEl) loadingEl.style.display = 'none';
              if (this.skipTimeout) clearTimeout(this.skipTimeout);

              this.alertUI.startVisualAlert();
              
              const videoDuration = player.getDuration();
              // If video is shorter than the configured donation duration, end alert when video ends
              if (videoDuration > 0 && videoDuration < (this.alertUI.durationMs / 1000)) {
                 clearTimeout(this.alertUI.alertTimeout);
              }
            }
            if (event.data === YT.PlayerState.ENDED) {
              this.alertUI.endAlertNow();
            }
          },
          onError: (event) => {
            if (this.skipTimeout) clearTimeout(this.skipTimeout);
            this.alertUI.startVisualAlert();
            const container = document.getElementById(`container-${this.playerId}`);
            if (container) container.style.display = 'none';
          }
        }
      });
      }
    }, 100);
  }
}
