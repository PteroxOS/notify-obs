import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { RealtimeGateway } from '../realtime/realtime.gateway';

export interface GoalData {
  title: string;
  targetAmount: number;
  currentAmount: number;
}

@Injectable()
export class GoalService {
  private readonly logger = new Logger(GoalService.name);
  private readonly dataDir = path.join(process.cwd(), 'data');
  private readonly filePath = path.join(this.dataDir, 'goal.json');
  private goal: GoalData;

  constructor(private readonly realtimeGateway: RealtimeGateway) {
    this.ensureDataDirExists();
    this.loadGoal();
  }

  private ensureDataDirExists() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  private loadGoal() {
    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.goal = JSON.parse(raw);
      } catch (e) {
        this.logger.error('Failed to parse goal.json', e);
        this.initDefaultGoal();
      }
    } else {
      this.initDefaultGoal();
    }
  }

  private initDefaultGoal() {
    this.goal = {
      title: 'Upgrade Setup Stream',
      targetAmount: 5000000,
      currentAmount: 0,
    };
    this.saveGoal();
  }

  private saveGoal() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.goal, null, 2), 'utf-8');
    } catch (e) {
      this.logger.error('Failed to save goal.json', e);
    }
  }

  getGoal(): GoalData {
    return this.goal;
  }

  updateGoal(title: string, targetAmount: number, currentAmount?: number) {
    if (title) this.goal.title = title;
    if (targetAmount !== undefined) this.goal.targetAmount = targetAmount;
    if (currentAmount !== undefined) this.goal.currentAmount = currentAmount;
    
    this.saveGoal();
    this.emitGoalUpdate();
    return this.goal;
  }

  incrementAmount(amount: number) {
    if (!amount || amount <= 0) return;
    this.goal.currentAmount += amount;
    this.saveGoal();
    this.emitGoalUpdate();
  }

  private emitGoalUpdate() {
    this.realtimeGateway.server.emit('goal_update', this.goal);
  }
}
