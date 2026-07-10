import { Injectable, InternalServerErrorException } from '@nestjs/common';

const PATH_REGEX = /instagram\.com\/(p|reel|reels)\/([a-zA-Z0-9_-]+)/;

@Injectable()
export class InstagramService {
  private extractShortcode(url: string): string | null {
    if (!url) return null;
    const match = url.match(PATH_REGEX);
    return match ? match[2] : null;
  }

  private extractPath(url: string): string {
    if (!url) return 'p';
    const match = url.match(PATH_REGEX);
    const raw = match ? match[1] : 'p';
    return raw === 'reels' ? 'reel' : raw;
  }

  private extractEmbedData(html: string): any {
    const handleMatch = html.match(/s\.handle\(\s*(\{.*?\})\s*\)\s*;/);
    if (!handleMatch) return null;

    try {
      const outer = JSON.parse(handleMatch[1]);
      const embedData = outer?.require?.[1]?.[3]?.[0];
      if (!embedData?.contextJSON) return null;

      const parsed = JSON.parse(embedData.contextJSON);
      const item = parsed?.gql_data?.shortcode_media;
      if (!item) return null;

      const user = item.owner || {};
      const caption = item.edge_media_to_caption?.edges?.[0]?.node?.text || item.caption || '';

      const thumbnails = (item.display_resources || []).map((r: any) => ({
        url: r.src || '',
        width: r.config_width || 0,
        height: r.config_height || 0,
      }));

      return {
        metadata: {
          id: item.id || '',
          code: item.shortcode || '',
          caption,
          createTime: item.taken_at ? new Date(item.taken_at * 1000).toLocaleString() : '',
          type: item.__typename || '',
          isVideo: !!item.is_video,
        },
        author: {
          id: user.id || '',
          username: user.username || 'N/A',
          fullName: user.full_name || '',
          profilePic: user.profile_pic_url || '',
          verified: !!user.is_verified,
        },
        media: {
          thumbnail: item.display_url || '',
          thumbnails,
          videoUrl: item.video_url || '',
        },
      };
    } catch (e) {
      return null;
    }
  }

  private extractSlideData(html: string): any {
    const idx = html.indexOf('"xig_polaris_media"');
    if (idx === -1) return null;

    const start = html.lastIndexOf('{"__bbox"', idx);
    if (start === -1) return null;

    let depth = 1, end = start + 8;
    for (; end < html.length; end++) {
      if (html[end] === '{') depth++;
      if (html[end] === '}') depth--;
      if (depth === 0) { end++; break; }
    }

    let bbox;
    try { bbox = JSON.parse(html.slice(start, end)); } catch { return null; }

    const xig = bbox?.__bbox?.result?.data?.xig_polaris_media;
    if (!xig) return null;
    return xig.if_not_gated_logged_out || xig;
  }

  private getResolution(url: string): string {
    const m = url.match(/stp=.*?[ps](\d+)x(\d+)/);
    if (m) return `${m[1]}x${m[2]}`;
    return '';
  }

  private uniqueByUrl(arr: any[]) {
    const seen = new Set();
    return arr.filter(v => { const k = v.url; return seen.has(k) ? false : seen.add(k); });
  }

  private buildVideoResult(raw: any, shortcode: string): any {
    const versions = raw.video_versions || [];
    const user = raw.user || {};
    const captionObj = raw.caption || {};
    const caption = captionObj.text || raw.accessibility_caption || '';

    const thumbnails = (raw.image_versions2?.candidates || []).map((c: any) => {
      const res = this.getResolution(c.url);
      const dims = res ? res.split('x') : [0, 0];
      return { url: c.url, width: +dims[0], height: +dims[1] };
    });

    return {
      status: true,
      result: {
        metadata: {
          code: raw.code || shortcode,
          caption,
          isVideo: true,
        },
        author: {
          username: user.username || 'N/A',
          fullName: user.full_name || '',
          profilePic: user.profile_pic_url || '',
        },
        media: {
          thumbnail: raw.display_url || raw.display_uri || '',
          thumbnails,
          videos: this.uniqueByUrl(versions).map(v => ({
            url: v.url, type: 'video/mp4', resolution: this.getResolution(v.url),
          })),
        },
      },
    };
  }

  private createCookieJar() {
    let jar = '';

    function parseSetCookie(val: string) {
      return (val || '').split(',').map((c: string) => c.split(';')[0].trim()).filter(Boolean).join('; ');
    }

    return {
      getCookies() { return jar; },
      setCookies(setCookie: string) { jar = parseSetCookie(setCookie); },
      async init(ua: string) {
        const res = await fetch('https://www.instagram.com/', {
          headers: {
            'User-Agent': ua,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1',
          },
          redirect: 'manual',
          signal: AbortSignal.timeout(15000),
        });
        const setCookie = res.headers.get('set-cookie');
        if (setCookie) this.setCookies(setCookie);
        return jar;
      },
      async fetch(url: string, extra: any = {}) {
        const headers: any = {
          'User-Agent': extra.ua || 'Mozilla/5.0 (Linux; Android 15; 25028RN03A) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'same-origin',
          'Upgrade-Insecure-Requests': '1',
          ...(extra.headers || {}),
        };
        if (jar) headers.Cookie = jar;

        const res = await fetch(url, {
          headers,
          signal: extra.signal || AbortSignal.timeout(15000),
        });

        const newCookies = res.headers.get('set-cookie');
        if (newCookies) this.setCookies(newCookies);

        return res;
      },
    };
  }

  async extractMp4(url: string): Promise<string> {
    const shortcode = this.extractShortcode(url);
    if (!shortcode) throw new InternalServerErrorException('URL tidak valid atau shortcode tidak ditemukan.');

    try {
      const ua = 'Mozilla/5.0 (Linux; Android 15; 25028RN03A) AppleWebKit/537.36';
      const jar = this.createCookieJar();
      const path = this.extractPath(url);

      const mainRes = await jar.fetch(`https://www.instagram.com/${path}/${shortcode}/`, { ua });
      let html = await mainRes.text();
      let raw = this.extractSlideData(html);

      if (!raw) {
        await jar.init(ua);
        const retryRes = await jar.fetch(`https://www.instagram.com/${path}/${shortcode}/`, { ua });
        html = await retryRes.text();
        raw = this.extractSlideData(html);
      }

      if (raw) {
        const vidData = this.buildVideoResult(raw, shortcode);
        if (vidData.result.media.videos && vidData.result.media.videos.length > 0) {
          return vidData.result.media.videos[0].url; // Returns the first video URL found
        }
      }

      const embedRes = await jar.fetch(`https://www.instagram.com/${path}/${shortcode}/embed/captioned/`, { ua });
      html = await embedRes.text();
      const data = this.extractEmbedData(html);
      
      if (!data || !data.media.videoUrl) {
        throw new Error('Data video tidak ditemukan atau bukan video reels.');
      }
      
      return data.media.videoUrl;
    } catch (error) {
      console.error('Error extracting Instagram MP4:', error);
      throw new InternalServerErrorException('Gagal mengekstrak video Instagram: ' + error.message);
    }
  }
}
