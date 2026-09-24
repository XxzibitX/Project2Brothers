import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AppConfigModule } from '../config/app-config.module';

@Module({
  imports: [PrismaModule, AppConfigModule],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
