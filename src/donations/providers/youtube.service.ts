import { Injectable, Logger } from '@nestjs/common';
const ytSearch = require('yt-search');
const spotify = require('spotify-url-info');

// Initialize spotify-url-info with fetch
const spotifyApi = spotify(fetch);

export interface MediaTrack {
  ytId: string;
  title: string;
  artist: string;
  duration: number; // in seconds
  thumbnail: string;
}

@Injectable()
export class YouTubeService {
  private readonly logger = new Logger(YouTubeService.name);

  // Extracts YouTube ID from a standard YT url
  extractId(url: string): string | null {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  // Checks if it's a Spotify track link
  isSpotifyTrack(url: string): boolean {
    return !!(url && url.includes('spotify.com/track'));
  }

  // Gets YouTube metadata from a Spotify track URL
  async getTrackFromSpotify(url: string): Promise<MediaTrack | null> {
    try {
      const data = await spotifyApi.getPreview(url);
      if (!data) return null;
      
      const title = data.title;
      const artist = data.artist;
      const thumbnail = data.image; // Spotify cover image
      
      const searchQuery = `${title} ${artist} audio`;
      const searchResult = await ytSearch(searchQuery);
      
      if (searchResult && searchResult.videos.length > 0) {
        const video = searchResult.videos[0];
        return {
          ytId: video.videoId,
          title: title, // Use spotify title
          artist: artist, // Use spotify artist
          duration: video.seconds, // Use YouTube duration since we play YT
          thumbnail: thumbnail // Keep the pretty Spotify cover art!
        };
      }
      return null;
    } catch (e) {
      this.logger.error('Failed to convert Spotify to YT: ' + e.message);
      return null;
    }
  }

  // Gets YouTube metadata from a direct YouTube ID
  async getTrackFromYoutube(ytId: string): Promise<MediaTrack | null> {
    try {
      const video = await ytSearch({ videoId: ytId });
      if (!video) return null;
      
      return {
        ytId: video.videoId,
        title: video.title,
        artist: video.author?.name || 'YouTube',
        duration: video.seconds,
        thumbnail: video.image
      };
    } catch (e) {
      this.logger.error('Failed to get YT metadata: ' + e.message);
      return null;
    }
  }

  // Search for songs (used for the search UI in trigger.html)
  async searchSong(query: string): Promise<MediaTrack[]> {
    try {
      const searchResult = await ytSearch(query + ' audio');
      if (!searchResult || !searchResult.videos) return [];

      // Return top 10 results mapped to MediaTrack
      return searchResult.videos.slice(0, 10).map((video: any) => ({
        ytId: video.videoId,
        title: video.title,
        artist: video.author?.name || 'YouTube',
        duration: video.seconds,
        thumbnail: video.thumbnail // yt-search uses .thumbnail or .image
      }));
    } catch (e) {
      this.logger.error('Failed to search YT: ' + e.message);
      return [];
    }
  }
}

