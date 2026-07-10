import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';

@Injectable()
export class TikTokService {
  private readonly logger = new Logger(TikTokService.name);

  async extractMp4(url: string): Promise<string> {
    try {
      this.logger.log(`Downloading TikTok Video...`);
      const jar = new CookieJar();
      const api = axios.create({
          jar: jar,
          withCredentials: true,
          headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          }
      } as any);
      wrapper(api);
      
      const htmlResponse = await api.get(url);
      const $ = cheerio.load(htmlResponse.data);
      
      let scriptContent = $('#__UNIVERSAL_DATA_FOR_REHYDRATION__').html() || $('#SIGI_STATE').html();
      if (!scriptContent) throw new Error('Script tag data tidak ditemukan (Captcha/IP Blocked).');
      
      const jsonData = JSON.parse(scriptContent);
      
      const defaultScope = jsonData?.__DEFAULT_SCOPE__;
      const itemStruct = defaultScope?.["webapp.video-detail"]?.itemInfo?.itemStruct 
                         || Object.values(jsonData.ItemModule || {})[0] as any;

      if (!itemStruct) throw new Error('Struct video tidak ditemukan dalam JSON.');

      const videoData = itemStruct.video;
      let hdNoWatermarkUrl = null;

      if (videoData.bitrateInfo && Array.isArray(videoData.bitrateInfo)) {
          const bestQuality = videoData.bitrateInfo.sort((a: any, b: any) => b.Bitrate - a.Bitrate)[0];
          
          if (bestQuality) {
              const urlList = bestQuality.PlayAddr?.UrlList || [];
              hdNoWatermarkUrl = urlList.find((u: string) => u.includes('aweme/v1/play')) || urlList[urlList.length - 1];
          }
      }
      if (!hdNoWatermarkUrl) hdNoWatermarkUrl = videoData.playAddr;

      if (!hdNoWatermarkUrl) {
          throw new Error('Tidak dapat menemukan playAddr dari TikTok data');
      }

      return hdNoWatermarkUrl;
    } catch (e) {
      this.logger.error("TikTok Error: " + e.message);
      throw new InternalServerErrorException(e.message);
    }
  }
}
