import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as crypto from 'crypto';

@Injectable()
export class ProfanityService implements OnModuleInit {
  private readonly logger = new Logger(ProfanityService.name);
  private badWords: string[] = [];

  async onModuleInit() {
    try {
      await this.loadDatabase();
      this.logger.log(`Loaded ${this.badWords.length} profanity words dari katakasar.my.id`);
    } catch (e) {
      this.logger.error('Failed to load profanity database: ' + e.message);
    }
  }

  private async loadDatabase() {
    const headers = {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'accept-language': 'id,en;q=0.9',
      'referer': 'https://katakasar.my.id/'
    };

    const initRes = await axios.get('https://katakasar.my.id/', { headers });
    const html = initRes.data;
    const $ = cheerio.load(html);
  
    const appVersion = $('html').attr('data-app-version') || '';
    const seoContentStyle = $('.seo-content').attr('style') || '';
    const tMatch = seoContentStyle.match(/--appT:\s*'([^']+)'/);
    const appT = tMatch ? tMatch[1].trim() : '';
  
    let decodedScript = '';
    $('script').each((i, el) => {
      const text = $(el).text();
      if (text.includes('atob(')) {
        const base64Match = text.match(/atob\s*\(\s*["']([^"']+)["']\s*\)/);
        if (base64Match) {
          decodedScript = Buffer.from(base64Match[1], 'base64').toString('utf-8');
        }
      }
    });
  
    if (!decodedScript) throw new Error('Failed to locate encrypted payload.');
  
    const secMatch = decodedScript.match(/__APP_SEC__\s*=\s*["']([^"']+)["']/);
    const dataMatch = decodedScript.match(/__APP_DATA__\s*=\s*["']([^"']+)["']/);
  
    const appSec = secMatch ? secMatch[1] : null;
    const appData = dataMatch ? dataMatch[1] : null;
  
    if (!appVersion || !appT || !appSec || !appData) throw new Error('Failed to extract hydration states.');
  
    const salt = `${appVersion}-${appT}-${appSec}`;
    const keyHash = crypto.createHash('sha256').update(salt).digest('hex');
  
    let decryptedRaw = '';
    for (let i = 0; i < appData.length; i += 2) {
      const hexChunk = appData.slice(i, i + 2);
      const index = i / 2;
      const keyCharValue = keyHash.charCodeAt(index % keyHash.length);
      decryptedRaw += String.fromCharCode(parseInt(hexChunk, 16) ^ keyCharValue);
    }
  
    const rawSplitted = decryptedRaw.split(',');
    if (rawSplitted.length === 0 || !rawSplitted[0]) throw new Error('Decryption resulted in empty buffer.');
  
    const databaseWords = [rawSplitted[0]];
    for (let i = 1; i < rawSplitted.length; i++) {
      const currentItem = rawSplitted[i];
      const matchDelta = currentItem.match(/^(\d+)(.*)/);
      if (matchDelta) {
        const copyLen = parseInt(matchDelta[1], 10);
        const newChars = matchDelta[2];
        const lastWord = databaseWords[i - 1];
        databaseWords.push(lastWord.slice(0, copyLen) + newChars);
      } else {
        databaseWords.push(currentItem);
      }
    }
    
    // Simpan dalam lowercase
    this.badWords = databaseWords.map(w => w.toLowerCase());
  }

  censor(text: string): string {
    if (!text || this.badWords.length === 0) return text;
    
    // Pisahkan kalimat jadi kata per kata dengan tetap menjaga spasi aslinya
    const words = text.split(/(\s+)/);
    
    const censoredWords = words.map(word => {
      // Abaikan spasi/pemisah
      if (/\s+/.test(word)) return word;
      
      const cleanWord = word.replace(/[^\w\s]/g, '').toLowerCase(); 
      if (!cleanWord) return word;
      
      // 1. Cek Exact Match
      if (this.badWords.includes(cleanWord)) {
        return '*****';
      }

      // 2. Cek karakter berulang (e.g. kntlll -> kntl, anjjjing -> anjing)
      const deduplicated = cleanWord.replace(/(.)\1+/g, '$1');
      if (this.badWords.includes(deduplicated)) {
        return '*****';
      }
      
      // 3. Cek Contains (untuk kata gabungan misal "dasaranjing", butuh min 4 huruf agar "masuk" tak kena "asu")
      const containsMatch = this.badWords.find(bw => bw.length >= 4 && cleanWord.includes(bw));
      if (containsMatch) return '*****';
      
      // 4. Cek Typo (Fuzzy match)
      // Hanya lakukan untuk kata yang agak panjang (>= 5 huruf) agar kata pendek seperti "mas", "aku", "dia" tidak tersensor karena 1 typo.
      if (cleanWord.length >= 5) {
        for (const bw of this.badWords) {
          // Bandingkan dengan kata kotor yang panjangnya mirip
          if (bw.length >= 4 && Math.abs(bw.length - cleanWord.length) <= 1) {
             if (this.levenshtein(cleanWord, bw) <= 1) { // Toleransi cuma 1 typo
                return '*****';
             }
          }
        }
      }
      
      return word;
    });
    
    return censoredWords.join('');
  }

  // Fungsi Levenshtein Distance untuk typo-checking (dari kode referensi user)
  private levenshtein(e: string, t: string) {
    if (e.length === 0) return t.length;
    if (t.length === 0) return e.length;
    const n = Array(t.length + 1).fill(null).map(() => Array(e.length + 1).fill(null));
    for (let i = 0; i <= t.length; i++) n[i][0] = i;
    for (let i = 0; i <= e.length; i++) n[0][i] = i;
    for (let r = 1; r <= t.length; r++) {
      for (let i = 1; i <= e.length; i++) {
        const a = e[i - 1] === t[r - 1] ? 0 : 1;
        n[r][i] = Math.min(n[r - 1][i] + 1, n[r][i - 1] + 1, n[r - 1][i - 1] + a);
      }
    }
    return n[t.length][e.length];
  }
}
