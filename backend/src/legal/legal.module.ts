import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { LegalService } from './legal.service';
import { LegalController } from './legal.controller';
import { ManagerLegalController } from './manager-legal.controller';

@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule)],
  controllers: [LegalController, ManagerLegalController],
  providers: [LegalService],
  exports: [LegalService],
})
export class LegalModule {}
