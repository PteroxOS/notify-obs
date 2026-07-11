import { Module } from '@nestjs/common';
import { SubathonService } from './subathon.service';
import { SubathonController } from './subathon.controller';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [RealtimeModule],
  providers: [SubathonService],
  controllers: [SubathonController],
  exports: [SubathonService],
})
export class SubathonModule {}
