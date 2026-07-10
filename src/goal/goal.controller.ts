import { Controller, Get, Post, Body, UnauthorizedException } from '@nestjs/common';
import { GoalService } from './goal.service';
import { ConfigService } from '@nestjs/config';

@Controller('goal')
export class GoalController {
  constructor(
    private readonly goalService: GoalService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  getGoal() {
    return this.goalService.getGoal();
  }

  @Post('update')
  updateGoal(
    @Body('streamKey') streamKey: string,
    @Body('title') title: string,
    @Body('targetAmount') targetAmount: number,
    @Body('currentAmount') currentAmount?: number,
  ) {
    const expectedStreamKey = this.configService.get('STREAM_KEY', { infer: true });
    if (streamKey !== expectedStreamKey) {
      throw new UnauthorizedException('Invalid stream key');
    }

    return this.goalService.updateGoal(title, targetAmount, currentAmount);
  }
}
