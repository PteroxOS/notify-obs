import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

@Injectable()
export class TikTokService {
  private readonly logger = new Logger(TikTokService.name);

  async extractMp4(url: string): Promise<string> {
    try {
      const cookieJoin = (arr: string[] = []) => Array.isArray(arr) ? arr.map((v) => v.split(";")[0]).join("; ") : "";
      const csrfPick = (html: string) => html.match(/name="csrf_token"\s+value="([^"]+)"/i)?.[1] || null;

      const resSession = await axios.get('https://savett.cc/en1/download', {
          headers: { "User-Agent": "Mozilla/5.0 (Linux; Android 11; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36", Accept: "text/html,*/*" },
      });

      const csrf = csrfPick(resSession.data);
      const cookie = cookieJoin(resSession.headers["set-cookie"]);

      if (!csrf || !cookie) throw new Error("Gagal ambil CSRF/Cookie");

      const body = new URLSearchParams({ csrf_token: csrf, url });
      const resPost = await axios.post('https://savett.cc/en1/download', body.toString(), {
          headers: {
              "User-Agent": "Mozilla/5.0 (Linux; Android 11; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36",
              "Content-Type": "application/x-www-form-urlencoded",
              Origin: "https://savett.cc",
              Referer: "https://savett.cc/en1/download",
              Cookie: cookie,
              Accept: "text/html,*/*",
          },
      });

      const $ = cheerio.load(resPost.data);
      const nowm: string[] = [];

      $("#formatselect option").each((_: any, el: any) => {
          const label = $(el).text().toLowerCase();
          const raw = $(el).attr("value");
          if (!raw) return;
          try {
              const json = JSON.parse(raw.replace(/&quot;/g, '"'));
              if (!Array.isArray(json?.URL)) return;
              if (label.includes("mp4") && !label.includes("watermark")) {
                  nowm.push(...json.URL);
              }
          } catch {}
      });

      if (nowm.length > 0) {
          return nowm[0];
      } else {
          throw new Error("No MP4 found");
      }
    } catch (e) {
      this.logger.error("Savett Error: " + e.message);
      throw new UnauthorizedException(e.message);
    }
  }
}
