export class InstagramProvider {
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
           <svg style="position: absolute; top: 16px; right: 16px; width: 24px; height: 24px; opacity: 0.6; fill: #fff" viewBox="0 0 448 512"><path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"/></svg>
        </div>
        <video id="${this.playerId}-bg" style="position: absolute; top:0; left:0; width: 100%; height: 100%; object-fit: cover; filter: blur(20px) brightness(0.5); transform: scale(1.1); z-index: 1;" muted autoplay playsinline></video>
        <video id="${this.playerId}" style="position: relative; max-width: 100%; max-height: 100%; z-index: 2; border-radius: 4px;" autoplay name="media"></video>
        <svg style="position: absolute; top: 16px; right: 16px; width: 24px; height: 24px; z-index: 10; opacity: 0.8; fill: #fff" viewBox="0 0 448 512"><path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"/></svg>
      </div>
    `;
  }

  async init() {
    this.skipTimeout = setTimeout(() => {
      this.alertUI.endAlertNow();
    }, 30000);

    try {
      const res = await fetch('/test-donation/extract-instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: this.url })
      });
      
      if (!res.ok) throw new Error('Proxy failed');
      
      const json = await res.json();
      const rawMp4Url = json.url;
      
      if (!rawMp4Url) throw new Error('No MP4 URL found');

      // Use backend proxy to avoid 403 / CORS
      const mp4Url = '/test-donation/proxy-stream?url=' + encodeURIComponent(rawMp4Url);

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
      
      videoEl.addEventListener('error', (e) => {
        console.error('Video error:', e);
        this.alertUI.endAlertNow();
      });

    } catch (err) {
      console.error('InstagramProvider error:', err);
      this.alertUI.endAlertNow();
    }
  }

  destroy() {
    if (this.skipTimeout) clearTimeout(this.skipTimeout);
    const videoEl = document.getElementById(this.playerId);
    if (videoEl) {
      videoEl.pause();
      videoEl.src = '';
      videoEl.load();
    }
  }
}
