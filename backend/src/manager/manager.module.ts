import { Module } from '@nestjs/common';
import { ManagerController } from './manager.controller';
import { OrdersModule } from '../orders/orders.module';
import { ProductsModule } from '../products/products.module';
import { CategoriesModule } from '../categories/categories.module';
import { ExtrasModule } from '../extras/extras.module';
import { AppConfigModule } from '../config/app-config.module';
import { AuthModule } from '../auth/auth.module';
import { UploadsModule } from '../uploads/uploads.module';
import { TelegramModule } from '../telegram/telegram.module';
import { PrismaModule } from '../prisma/prisma.module';
import { StaffService } from './staff.service';

@Module({
  imports: [
    PrismaModule,
    OrdersModule,
    ProductsModule,
    CategoriesModule,
    ExtrasModule,
    AppConfigModule,
    AuthModule,
    UploadsModule,
    TelegramModule,
  ],
  controllers: [ManagerController],
  providers: [StaffService],
})
export class ManagerModule {}
