import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { RealtimeGateway } from '../realtime/realtime.gateway';

export interface SubathonState {
  targetEndTime: number | null;
  remainingTimeMs: number;
  isRunning: boolean;
  multiplierAmount: number;
  multiplierMinutes: number;
  isActive: boolean;
}

@Injectable()
export class SubathonService {
  private readonly logger = new Logger(SubathonService.name);
  private statePath = path.join(process.cwd(), 'data', 'subathon.json');
  private state: SubathonState;
  
  constructor(private realtimeGateway: RealtimeGateway) {
    // Ensure data directory exists
    const dataDir = path.dirname(this.statePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.loadState();
  }
  
  private loadState() {
    if (fs.existsSync(this.statePath)) {
      this.state = JSON.parse(fs.readFileSync(this.statePath, 'utf8'));
    } else {
      this.state = {
        targetEndTime: null,
        remainingTimeMs: 0,
        isRunning: false,
        multiplierAmount: 10000,
        multiplierMinutes: 1,
        isActive: false
      };
      this.saveState();
    }
  }
  
  private saveState() {
    if (this.state.isRunning && this.state.targetEndTime) {
      this.state.remainingTimeMs = Math.max(0, this.state.targetEndTime - Date.now());
    }
    fs.writeFileSync(this.statePath, JSON.stringify(this.state, null, 2));
  }
  
  public getState() {
    if (this.state.isRunning && this.state.targetEndTime) {
      this.state.remainingTimeMs = Math.max(0, this.state.targetEndTime - Date.now());
      if (this.state.remainingTimeMs === 0) {
        this.state.isRunning = false;
        this.saveState();
      }
    }
    return this.state;
  }
  
  public broadcast() {
    this.realtimeGateway.server.emit('subathon:update', this.getState());
  }

  public setTime(minutes: number) {
    this.state.remainingTimeMs = minutes * 60 * 1000;
    if (this.state.isRunning) {
      this.state.targetEndTime = Date.now() + this.state.remainingTimeMs;
    }
    this.saveState();
    this.broadcast();
  }

  public addTimeManual(minutes: number) {
    this.state.remainingTimeMs += minutes * 60 * 1000;
    if (this.state.isRunning) {
      this.state.targetEndTime = Date.now() + this.state.remainingTimeMs;
    }
    this.saveState();
    this.broadcast();
  }

  public toggleTimer(start: boolean) {
    if (start && !this.state.isRunning && this.state.remainingTimeMs > 0) {
      this.state.isRunning = true;
      this.state.targetEndTime = Date.now() + this.state.remainingTimeMs;
    } else if (!start && this.state.isRunning) {
      this.state.isRunning = false;
      this.state.remainingTimeMs = Math.max(0, (this.state.targetEndTime || Date.now()) - Date.now());
      this.state.targetEndTime = null;
    }
    this.saveState();
    this.broadcast();
  }
  
  public updateSettings(amount: number, minutes: number, isActive: boolean) {
    this.state.multiplierAmount = amount;
    this.state.multiplierMinutes = minutes;
    this.state.isActive = isActive;
    this.saveState();
    this.broadcast();
  }

  public processDonation(amount: number) {
    if (!this.state.isActive) return;
    if (this.state.multiplierAmount <= 0) return;
    
    const addedMinutes = Math.floor(amount / this.state.multiplierAmount) * this.state.multiplierMinutes;
    if (addedMinutes > 0) {
      this.addTimeManual(addedMinutes);
    }
  }
}
