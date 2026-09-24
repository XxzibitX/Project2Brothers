import { Module } from '@nestjs/common';
import { ConfigController } from './app-config.controller';
import { AppConfigService } from './app-config.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ConfigController],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
