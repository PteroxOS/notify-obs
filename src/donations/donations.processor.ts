import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { YouTubeService, MediaTrack } from './providers/youtube.service';

@Processor('donations-processing')
export class DonationsProcessor extends WorkerHost {
  private readonly logger = new Logger(DonationsProcessor.name);

  constructor(
    private readonly realtimeGateway: RealtimeGateway,
    private readonly youtubeService: YouTubeService
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing donation job ${job.id}: ${JSON.stringify(job.data)}`);
    
    // Check if donation has Spotify or YouTube link for Media Queue
    let track: MediaTrack | null = null;
    const url = job.data.youtubeUrl; // user inputs any URL here
    
    if (url) {
      if (this.youtubeService.isSpotifyTrack(url)) {
        track = await this.youtubeService.getTrackFromSpotify(url);
      } else {
        const ytId = this.youtubeService.extractId(url);
        if (ytId) {
          track = await this.youtubeService.getTrackFromYoutube(ytId);
        }
      }
    }
    
    if (track) {
      // Attach requester info
      track = {
        ...track,
        // @ts-ignore
        requester: job.data.name
      };
      job.data.mediaQueueTrack = track;
    }

    // In a real app, you would save to DB here. 
    this.realtimeGateway.emitDonation(job.data);
    
    return { success: true };
  }
}
