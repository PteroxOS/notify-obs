import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validate } from './config/env.validation';
import { DonationsModule } from './donations/donations.module';
import { RealtimeModule } from './realtime/realtime.module';
import { GoalModule } from './goal/goal.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate,
      isGlobal: true,
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          url: configService.get('REDIS_URL'),
        },
      }),
      inject: [ConfigService],
    }),
    DonationsModule,
    RealtimeModule,
    GoalModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
