import { Injectable, Logger } from '@nestjs/common';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import * as fs from 'fs';
import * as path from 'path';

export interface TickerDonation {
  name: string;
  amount: number;
}

export interface TickerState {
  customMessage: string;
  recentDonations: TickerDonation[];
}

@Injectable()
export class TickerService {
  private readonly logger = new Logger(TickerService.name);
  private dataFile = path.join(process.cwd(), 'data', 'ticker.json');
  private state: TickerState = {
    customMessage: 'dukung di https://saweria.co/Jepphyruu',
    recentDonations: []
  };
  private maxItems = 10;

  constructor(private readonly realtimeGateway: RealtimeGateway) {
    this.loadState();
  }

  private loadState() {
    if (!fs.existsSync(path.dirname(this.dataFile))) {
      fs.mkdirSync(path.dirname(this.dataFile), { recursive: true });
    }
    
    if (fs.existsSync(this.dataFile)) {
      try {
        const fileData = fs.readFileSync(this.dataFile, 'utf8');
        const parsed = JSON.parse(fileData);
        if (parsed) {
          this.state.customMessage = parsed.customMessage || this.state.customMessage;
          this.state.recentDonations = parsed.recentDonations || [];
        }
      } catch (err) {
        this.logger.error('Failed to parse ticker.json, starting fresh.', err);
      }
    } else {
      this.saveState();
    }
  }

  private saveState() {
    fs.writeFileSync(this.dataFile, JSON.stringify(this.state, null, 2), 'utf8');
  }

  private broadcast() {
    this.realtimeGateway.server.emit('ticker:update', this.state);
  }

  public getState() {
    return this.state;
  }

  public updateCustomMessage(msg: string) {
    this.state.customMessage = msg;
    this.saveState();
    this.broadcast();
  }

  public processDonation(name: string, amount: number) {
    if (amount <= 0) return;
    
    // Add to the front of the list
    this.state.recentDonations.unshift({ name, amount });
    
    // Keep only the latest maxItems
    if (this.state.recentDonations.length > this.maxItems) {
      this.state.recentDonations = this.state.recentDonations.slice(0, this.maxItems);
    }
    
    this.saveState();
    this.broadcast();
  }
}
