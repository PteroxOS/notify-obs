import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { YouTubeService, MediaTrack } from './providers/youtube.service';
import { GoalService } from '../goal/goal.service';
import { SubathonService } from '../subathon/subathon.service';
import { LeaderboardService } from '../leaderboard/leaderboard.service';
import { TickerService } from '../ticker/ticker.service';

@Processor('donations-processing')
export class DonationsProcessor extends WorkerHost {
  private readonly logger = new Logger(DonationsProcessor.name);

  constructor(
    private readonly realtimeGateway: RealtimeGateway,
    private readonly youtubeService: YouTubeService,
    private readonly goalService: GoalService,
    private readonly subathonService: SubathonService,
    private readonly leaderboardService: LeaderboardService,
    private readonly tickerService: TickerService
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing donation job ${job.id}: ${JSON.stringify(job.data)}`);
    
    // Check if donation has Spotify or YouTube link for Media Queue
    let track: MediaTrack | null = null;
    const url = job.data.youtubeUrl; // user inputs any URL here
    const isSongShare = job.data.isSongShare === true || job.data.isSongShare === 'true';
    
    if (url && isSongShare) {
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
    
    // Update the donation goal
    this.goalService.incrementAmount(job.data.amount);
    
    // Update the subathon timer
    this.subathonService.processDonation(job.data.amount);
    
    // Update leaderboard
    this.leaderboardService.processDonation(job.data.name, job.data.amount);
    
    // Update ticker
    this.tickerService.processDonation(job.data.name, job.data.amount);
    
    return { success: true };
  }
}
