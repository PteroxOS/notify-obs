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
    
    // Parse Custom Emojis for Visual Output (e.g. [emot-merah])
    const displayMessage = this.donation.message 
      ? this.donation.message.replace(/\[([a-zA-Z0-9_-]+)\]/g, '<img src="assets/emoji/$1.png" class="custom-emoji">') 
      : '';

    let messageHtml = '';
    if (this.donation.voiceNoteUrl) {
      messageHtml = `
        <div class="vn-ui">
          <div class="vn-icon">🎤</div>
          <div class="vn-waveform">
            <span></span><span></span><span></span><span></span><span></span>
          </div>
          <div class="vn-text">Voice Note</div>
        </div>
      `;
    } else if (displayMessage) {
      messageHtml = `<div class="message-text">"${displayMessage}"</div>`;
    }

    this.el.innerHTML = `
      ${providerHtml}
      ${
        song
          ? `
      <div class="song-req-card">
        <img src="${song.thumbnail}" alt="Cover">
        <div class="song-req-info">
          <div class="song-req-title">${song.title}</div>
          <div class="song-req-artist">${song.artist}</div>
        </div>
      </div>
      `
          : ''
      }
      <div class="alert-box${isWhale ? ' whale-alert' : ''}">
        ${isWhale ? `<div class="sparkle-overlay"></div>` : ''}
        ${!hasMedia && !this.donation.voiceNoteUrl ? `<div class="timer-bg" style="animation-duration: ${this.durationMs / 1000}s;"></div>` : ''}
        <div class="content">
          <div class="alert-main">
            <span class="donor-name">${this.donation.name}</span>
            <span class="action-text">memberikan dukungan</span>
          </div>
          <div class="donation-amount">${formattedAmount}</div>
          ${messageHtml}
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

    // TTS / Voice Note
    setTimeout(() => {
      if (this.donation.voiceNoteUrl) {
        // Play uploaded Voice Note
        const vnAudio = new Audio(this.donation.voiceNoteUrl);
        vnAudio.volume = 1.0;
        vnAudio.addEventListener('ended', () => {
          // Tutup alert otomatis pas VN kelar
          this.endAlertNow();
        });
        vnAudio.play().catch((e) => console.log('Voice Note playback blocked', e));
      } else if (this.donation.amount >= 100000 && this.donation.message) {
        // Strip emoji shortcodes before speaking so the robot doesn't read "[emot-merah]"
        const cleanMessageForTTS = this.donation.message.replace(/\[([a-zA-Z0-9_-]+)\]/g, '').trim();
        // Truncate message to avoid Google TTS URL length limit
        const safeMessage = cleanMessageForTTS.substring(0, 150);
        const textToSpeak = encodeURIComponent(
          `${this.donation.name} baru saja memberikan ${this.donation.amount} rupiah. ${safeMessage}`
        );

        // Menggunakan Google Translate TTS (Suara embak Google yang natural)
        const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=id&q=${textToSpeak}`;
        const ttsAudio = new Audio(ttsUrl);
        ttsAudio.volume = 1.0;
        ttsAudio.play().catch((e) => console.log('TTS playback blocked', e));
      }
    }, 800); // Delay sedikit biar suara alert awal selesai duluan

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

    // Auto-delete Voice Note from server after playing
    if (this.donation.voiceNoteUrl) {
      fetch('/test-donation/voice-note?path=' + encodeURIComponent(this.donation.voiceNoteUrl), { method: 'DELETE' }).catch(e => console.error('Failed to delete VN', e));
    }

    setTimeout(() => {
      this.el.remove();
      if (this.onEndCallback) this.onEndCallback();
    }, 500);
  }
}
