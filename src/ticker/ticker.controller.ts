import { Controller, Get, Post, Body } from '@nestjs/common';
import { TickerService } from './ticker.service';

@Controller('ticker')
export class TickerController {
  constructor(private readonly tickerService: TickerService) {}

  @Get('state')
  getState() {
    return this.tickerService.getState();
  }

  @Post('settings')
  updateSettings(@Body('customMessage') customMessage: string) {
    this.tickerService.updateCustomMessage(customMessage);
    return { success: true };
  }
}
