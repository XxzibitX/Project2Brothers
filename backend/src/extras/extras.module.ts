import { Module } from '@nestjs/common';
import { ExtrasService } from './extras.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ExtrasService],
  exports: [ExtrasService],
})
export class ExtrasModule {}
