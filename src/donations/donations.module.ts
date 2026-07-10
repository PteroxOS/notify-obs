import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DonationsController } from './donations.controller';
import { DonationsProcessor } from './donations.processor';
import { TikTokService } from './providers/tiktok.service';
import { YouTubeService } from './providers/youtube.service';
import { ProfanityService } from './providers/profanity.service';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'donations-processing',
    }),
    RealtimeModule,
  ],
  controllers: [DonationsController],
  providers: [DonationsProcessor, TikTokService, YouTubeService, ProfanityService],
})
export class DonationsModule {}
