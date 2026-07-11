import { Controller, Post, Body, HttpCode, HttpStatus, UnauthorizedException, Get, Query, Req, Res, UseInterceptors, UploadedFile, BadRequestException, Delete } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import type { Request, Response } from 'express';
import axios from 'axios';
import { CreateDonationDto } from './dto/create-donation.dto';
import { EnvConfig } from '../config/env.validation';
import { TikTokService } from './providers/tiktok.service';
import { ProfanityService } from './providers/profanity.service';
import { YouTubeService } from './providers/youtube.service';
import { InstagramService } from './providers/instagram.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';

@Controller('test-donation')
export class DonationsController {
  constructor(
    private readonly configService: ConfigService<EnvConfig>,
    @InjectQueue('donations-processing') private readonly donationsQueue: Queue,
    private readonly tiktokService: TikTokService,
    private readonly profanityService: ProfanityService,
    private readonly youtubeService: YouTubeService,
    private readonly instagramService: InstagramService,
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
  @UseInterceptors(FileInterceptor('voiceNote', {
    storage: diskStorage({
      destination: './public/uploads/voice',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        cb(null, `${randomName}${extname(file.originalname)}`);
      }
    }),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(audio|mpeg|wav|ogg|webm|mp4)$/)) {
        return cb(new BadRequestException('Only audio files are allowed!'), false);
      }
      cb(null, true);
    }
  }))
  async handleDonation(@Body() createDonationDto: CreateDonationDto, @UploadedFile() file?: Express.Multer.File) {
    const expectedStreamKey = this.configService.get('STREAM_KEY', { infer: true });

    if (createDonationDto.streamKey !== expectedStreamKey) {
      throw new UnauthorizedException('Invalid stream key');
    }

    if (file) {
      createDonationDto.voiceNoteUrl = `/uploads/voice/${file.filename}`;
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

  @Delete('voice-note')
  async deleteVoiceNote(@Query('path') filepath: string) {
    if (!filepath || !filepath.startsWith('/uploads/voice/')) {
      return { status: 'ignored' };
    }
    try {
      const fullPath = join(process.cwd(), 'public', filepath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
      return { status: 'deleted' };
    } catch (err) {
      console.error('Failed to delete voice note', err);
      return { status: 'error' };
    }
  }

  @Post('extract-tiktok')
  @HttpCode(HttpStatus.OK)
  async extractTikTok(@Body('url') url: string) {
    if (!url) throw new UnauthorizedException('URL is required');
    const mp4Url = await this.tiktokService.extractMp4(url);
    return { url: mp4Url };
  }

  @Post('extract-instagram')
  @HttpCode(HttpStatus.OK)
  async extractInstagram(@Body('url') url: string) {
    if (!url) throw new UnauthorizedException('URL is required');
    const mp4Url = await this.instagramService.extractMp4(url);
    return { url: mp4Url };
  }
  @Get('proxy-stream')
  async proxyStream(@Query('url') url: string, @Req() req: Request, @Res() res: Response) {
    if (!url) {
      return res.status(HttpStatus.BAD_REQUEST).send('URL is required');
    }

    try {
      const headers: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0',
        'Referer': url.includes('tiktok') ? 'https://www.tiktok.com/' : 'https://www.instagram.com/',
      };

      if (req.headers.range) {
        headers['Range'] = req.headers.range;
      }

      const response = await axios.get(url, {
        headers,
        responseType: 'stream',
        validateStatus: () => true, // proxy any status
      });

      // Forward relevant headers
      const headersToForward = ['content-type', 'content-length', 'accept-ranges', 'content-range'];
      for (const header of headersToForward) {
        if (response.headers[header]) {
          res.setHeader(header, response.headers[header]);
        }
      }

      res.status(response.status);
      response.data.pipe(res);
    } catch (err) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(err.message);
    }
  }
}
