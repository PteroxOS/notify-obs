import { Controller, Post, Body, HttpCode, HttpStatus, UnauthorizedException, Get, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { CreateDonationDto } from './dto/create-donation.dto';
import { EnvConfig } from '../config/env.validation';
import { TikTokService } from './providers/tiktok.service';
import { ProfanityService } from './providers/profanity.service';
import { YouTubeService } from './providers/youtube.service';

@Controller('test-donation')
export class DonationsController {
  constructor(
    private readonly configService: ConfigService<EnvConfig>,
    @InjectQueue('donations-processing') private readonly donationsQueue: Queue,
    private readonly tiktokService: TikTokService,
    private readonly profanityService: ProfanityService,
    private readonly youtubeService: YouTubeService,
  ) {}

  @Get('search-song')
  async searchSong(@Query('q') query: string) {
    if (!query) {
      return [];
    }
    return await this.youtubeService.searchSong(query);
  }

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async handleDonation(@Body() createDonationDto: CreateDonationDto) {
    const expectedStreamKey = this.configService.get('STREAM_KEY', { infer: true });

    if (createDonationDto.streamKey !== expectedStreamKey) {
      throw new UnauthorizedException('Invalid stream key');
    }

    // Censor bad words in name and message
    if (createDonationDto.name) {
      createDonationDto.name = this.profanityService.censor(createDonationDto.name);
    }
    if (createDonationDto.message) {
      createDonationDto.message = this.profanityService.censor(createDonationDto.message);
    }

    // Enqueue the payload for processing
    await this.donationsQueue.add('process-donation', createDonationDto);

    return { message: 'Donation accepted for processing' };
  }

  @Post('extract-tiktok')
  @HttpCode(HttpStatus.OK)
  async extractTikTok(@Body('url') url: string) {
    if (!url) throw new UnauthorizedException('URL is required');
    const mp4Url = await this.tiktokService.extractMp4(url);
    return { url: mp4Url };
  }
}

