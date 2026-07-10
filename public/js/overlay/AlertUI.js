export class AlertUI {
  constructor(donation, durationSeconds, onEndCallback) {
    this.donation = donation;
    this.durationMs = durationSeconds * 1000;
    this.onEndCallback = onEndCallback;
    this.el = document.createElement('div');
    this.el.className = 'alert-wrapper';
    this.alertTimeout = null;
    this.audio = document.getElementById('alert-sound');
  }

  render(providerHtml = '', hasMedia = false) {
    const formattedAmount =
      'Rp ' + this.donation.amount.toLocaleString('id-ID');
    const isWhale = this.donation.amount >= 1000000;
    const song = this.donation.mediaQueueTrack;

    this.el.innerHTML = `
      ${providerHtml}
      ${song ? `
      <div class="song-req-card">
        <img src="${song.thumbnail}" alt="Cover">
        <div class="song-req-info">
          <div class="song-req-title">${song.title}</div>
          <div class="song-req-artist">${song.artist}</div>
        </div>
      </div>
      ` : ''}
      <div class="alert-box${isWhale ? ' whale-alert' : ''}">
        ${isWhale ? `<div class="sparkle-overlay"></div>` : ''}
        ${!hasMedia ? `<div class="timer-bg" style="animation-duration: ${this.durationMs / 1000}s;"></div>` : ''}
        <div class="content">
          <div class="alert-main">
            <span class="donor-name">${this.donation.name}</span>
            <span class="action-text">memberikan dukungan</span>
          </div>
          <div class="donation-amount">${formattedAmount}</div>
          ${this.donation.message ? `<div class="message-text">"${this.donation.message}"</div>` : ''}
        </div>
      </div>
    `;

    document.getElementById('alert-container').appendChild(this.el);

    // Play sound effect immediately when donation appears
    if (this.audio) {
      this.audio.volume = 0.5;
      this.audio.currentTime = 0;
      this.audio.play().catch((e) => console.log('Audio autoplay blocked', e));
    }

    // Show the container immediately
    setTimeout(() => {
      this.el.classList.add('show');
      // Start the timer animation immediately if it exists (no video alerts)
      const timerBg = this.el.querySelector('.timer-bg');
      if (timerBg) {
        void this.el.offsetWidth; // Trigger reflow
        timerBg.classList.add('animate');
      }

      // Stop sparkle animation after it plays once
      const sparkle = this.el.querySelector('.sparkle-overlay');
      if (sparkle) {
        setTimeout(() => {
          sparkle.style.opacity = '0';
          setTimeout(() => sparkle.remove(), 500); // fade out gracefully
        }, 1300); // Disesuaikan jadi lebih cepat
      }
    }, 10);
  }

  startVisualAlert() {
    if (!this.alertTimeout) {
      this.alertTimeout = setTimeout(() => {
        this.endAlertNow();
      }, this.durationMs);
    }
  }

  endAlertNow() {
    if (this.alertTimeout) clearTimeout(this.alertTimeout);
    this.el.classList.remove('show');
    setTimeout(() => {
      this.el.remove();
      if (this.onEndCallback) this.onEndCallback();
    }, 500);
  }
}
