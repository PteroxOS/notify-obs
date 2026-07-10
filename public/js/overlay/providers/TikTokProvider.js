export class TikTokProvider {
  constructor(playerId, url, alertUI) {
    this.playerId = playerId;
    this.url = url;
    this.alertUI = alertUI;
    this.skipTimeout = null;
  }

  getHtml() {
    return `
      <div class="video-container" id="container-${this.playerId}" style="display: flex; justify-content: center; align-items: center; position: relative; overflow: hidden; background: #000; height: 326px;">
        <div id="loading-${this.playerId}" style="position: absolute; top:0; left:0; width: 100%; height: 100%; background: #18191c; z-index: 20; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 40px; box-sizing: border-box; font-family: 'Inter', sans-serif;">
           <div style="font-size: 16px; color: #e4e6eb; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 12px; text-transform: uppercase;">Memuat Media...</div>
           <div style="font-size: 14px; color: #b0b3b8; line-height: 1.6; max-width: 460px;">Maksimal durasi loading adalah 30 detik, Media akan ter-skip apabila tidak dapat dimulai dalam waktu yang ditentukan. <span style="color: #fceb64; font-weight: 600;">INI BERJALAN OTOMATIS.</span></div>
           <img src="assets/logo/tiktok-seeklogo.png" style="position: absolute; top: 16px; right: 16px; width: 24px; height: 24px; opacity: 0.6;">
        </div>
        <video id="${this.playerId}-bg" style="position: absolute; top:0; left:0; width: 100%; height: 100%; object-fit: cover; filter: blur(20px) brightness(0.5); transform: scale(1.1); z-index: 1;" muted autoplay playsinline></video>
        <video id="${this.playerId}" style="position: relative; max-width: 100%; max-height: 100%; z-index: 2; border-radius: 4px;" autoplay name="media"></video>
        <img src="assets/logo/tiktok-seeklogo.png" style="position: absolute; top: 16px; right: 16px; width: 24px; height: 24px; z-index: 10; opacity: 0.8;">
      </div>
    `;
  }

  async init() {
    this.skipTimeout = setTimeout(() => {
      this.alertUI.endAlertNow();
    }, 30000);

    try {
      const res = await fetch('/test-donation/extract-tiktok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: this.url })
      });
      
      if (!res.ok) throw new Error('Proxy failed');
      
      const json = await res.json();
      const mp4Url = json.url;
      
      if (!mp4Url) throw new Error('No MP4 URL found');

      const videoEl = document.getElementById(this.playerId);
      const videoBgEl = document.getElementById(this.playerId + '-bg');
      
      videoEl.src = mp4Url;
      videoBgEl.src = mp4Url;
      
      videoEl.addEventListener('playing', () => {
        const loadingEl = document.getElementById(`loading-${this.playerId}`);
        if (loadingEl) loadingEl.style.display = 'none';
        if (this.skipTimeout) clearTimeout(this.skipTimeout);
        
        this.alertUI.startVisualAlert();
      });
      
      videoEl.addEventListener('ended', () => {
        this.alertUI.endAlertNow();
      });
      
      videoEl.volume = 1.0;
      videoEl.play().catch(e => console.error("TikTok play failed", e));
      videoBgEl.play().catch(e => console.error("TikTok bg play failed", e));
    } catch (err) {
      console.error('TikTok extraction failed:', err);
      const container = document.getElementById(`container-${this.playerId}`);
      if (container) container.style.display = 'none';
      if (this.skipTimeout) clearTimeout(this.skipTimeout);
      this.alertUI.startVisualAlert();
    }
  }
}
