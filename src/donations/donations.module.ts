import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DonationsController } from './donations.controller';
import { DonationsProcessor } from './donations.processor';
import { TikTokService } from './providers/tiktok.service';
import { YouTubeService } from './providers/youtube.service';
import { ProfanityService } from './providers/profanity.service';
import { InstagramService } from './providers/instagram.service';
import { RealtimeModule } from '../realtime/realtime.module';
import { GoalModule } from '../goal/goal.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'donations-processing',
    }),
    RealtimeModule,
    GoalModule,
  ],
  controllers: [DonationsController],
  providers: [DonationsProcessor, TikTokService, YouTubeService, ProfanityService, InstagramService],
})
export class DonationsModule {}
