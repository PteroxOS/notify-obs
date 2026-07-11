import { Injectable, Logger } from '@nestjs/common';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import * as fs from 'fs';
import * as path from 'path';

export interface LeaderboardEntry {
  name: string;
  amount: number;
}

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name);
  private dataFile = path.join(process.cwd(), 'data', 'leaderboard.json');
  private state: LeaderboardEntry[] = [];

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
        this.state = JSON.parse(fileData);
      } catch (err) {
        this.logger.error('Failed to parse leaderboard.json, starting fresh.', err);
        this.state = [];
      }
    } else {
      this.state = [];
      this.saveState();
    }
  }

  private saveState() {
    fs.writeFileSync(this.dataFile, JSON.stringify(this.state, null, 2), 'utf8');
  }

  private broadcast() {
    this.realtimeGateway.server.emit('leaderboard:update', this.state.slice(0, 5));
  }

  public getState() {
    return this.state.slice(0, 5); // Return top 5
  }

  public processDonation(name: string, amount: number) {
    if (amount <= 0) return;
    
    const existingEntryIndex = this.state.findIndex(entry => entry.name.toLowerCase() === name.toLowerCase());
    
    if (existingEntryIndex !== -1) {
      this.state[existingEntryIndex].amount += amount;
    } else {
      this.state.push({ name, amount });
    }
    
    // Sort descending by amount
    this.state.sort((a, b) => b.amount - a.amount);
    
    this.saveState();
    this.broadcast();
  }

  public resetLeaderboard() {
    this.state = [];
    this.saveState();
    this.broadcast();
  }
}
