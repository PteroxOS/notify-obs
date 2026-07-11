import { Controller, Get, Post } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get('state')
  getState() {
    return this.leaderboardService.getState();
  }

  @Post('reset')
  resetLeaderboard() {
    this.leaderboardService.resetLeaderboard();
    return { success: true };
  }
}
