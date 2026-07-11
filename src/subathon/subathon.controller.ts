import { Controller, Get, Post, Body } from '@nestjs/common';
import { SubathonService } from './subathon.service';

@Controller('subathon')
export class SubathonController {
  constructor(private readonly subathonService: SubathonService) {}

  @Get('state')
  getState() {
    return this.subathonService.getState();
  }

  @Post('set-time')
  setTime(@Body('minutes') minutes: number) {
    this.subathonService.setTime(minutes);
    return { success: true };
  }

  @Post('add-time')
  addTime(@Body('minutes') minutes: number) {
    this.subathonService.addTimeManual(minutes);
    return { success: true };
  }

  @Post('toggle')
  toggleTimer(@Body('start') start: boolean) {
    this.subathonService.toggleTimer(start);
    return { success: true };
  }

  @Post('settings')
  updateSettings(
    @Body('multiplierAmount') amount: number,
    @Body('multiplierMinutes') minutes: number,
    @Body('isActive') isActive: boolean
  ) {
    this.subathonService.updateSettings(amount, minutes, isActive);
    return { success: true };
  }
}
