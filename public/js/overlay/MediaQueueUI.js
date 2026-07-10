export class MediaQueueUI {
  constructor() {
    this.container = document.getElementById('media-queue-container');
    this.currentTrack = null;
    this.queueList = []; // The upcoming tracks
    this.progressInterval = null;
  }

  // Called when queue changes
  updateQueue(current, upcoming) {
    this.currentTrack = current;
    this.queueList = upcoming || [];
    this.render();
  }

  // Call this to update the visual progress bar and time text
  updateProgress(currentTime, totalTime) {
    if (!this.currentTrack) return;
    
    const progressFill = this.container.querySelector('.mq-progress-fill');
    const timeText = this.container.querySelector('.mq-time');
    
    if (progressFill && totalTime > 0) {
      const percentage = (currentTime / totalTime) * 100;
      progressFill.style.width = `${percentage}%`;
    }
    
    if (timeText) {
      timeText.textContent = `${this.formatTime(currentTime)} / ${this.formatTime(totalTime)}`;
    }
  }

  formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  render() {
    if (!this.currentTrack) {
      this.container.style.display = 'none';
      return;
    }
    
    this.container.style.display = 'block';
    
    // Render current track
    const currentHtml = `
      <div class="mq-current">
        <div class="mq-current-info">
          <img class="mq-cover" src="${this.currentTrack.thumbnail || ''}" alt="Cover" onerror="this.src='https://via.placeholder.com/54x54?text=🎵'" />
          <div class="mq-details">
            <div class="mq-title">${this.currentTrack.title}</div>
            <div class="mq-artist">${this.currentTrack.artist || 'Unknown'} - Di request oleh @${this.currentTrack.requester}</div>
          </div>
          <div class="mq-time">00:00 / ${this.formatTime(this.currentTrack.duration)}</div>
        </div>
        <div class="mq-progress-bar">
          <div class="mq-progress-fill"></div>
        </div>
      </div>
    `;

    // Render list
    let listHtml = '';
    if (this.queueList.length > 0) {
      const visibleItems = this.queueList.slice(0, 5);
      const itemsHtml = visibleItems.map((item, index) => `
        <div class="mq-list-item">
          <div class="mq-number">${index + 1}</div>
          <div class="mq-item-details">
            <div class="mq-item-title">${item.title}</div>
            <div class="mq-item-artist">${item.artist || 'Unknown'} - @${item.requester}</div>
          </div>
          <div class="mq-item-duration">${this.formatTime(item.duration)}</div>
        </div>
      `).join('');
      
      const extraCount = this.queueList.length - 5;
      const extraHtml = extraCount > 0 ? `<div class="mq-more">+${extraCount} lagu lainnya</div>` : '';
      
      listHtml = `
        <div class="mq-list">
          ${itemsHtml}
          ${extraHtml}
        </div>
      `;
    }

    this.container.innerHTML = currentHtml + listHtml;
  }
}
