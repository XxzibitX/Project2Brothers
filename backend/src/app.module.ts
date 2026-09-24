import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { ManagerModule } from './manager/manager.module';
import { CategoriesModule } from './categories/categories.module';
import { AppConfigModule } from './config/app-config.module';
import { TelegramModule } from './telegram/telegram.module';
import { AddressModule } from './address/address.module';
import { HealthModule } from './health/health.module';
import { LegalModule } from './legal/legal.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 120,
      },
    ]),
    PrismaModule,
    AuthModule,
    CategoriesModule,
    ProductsModule,
    TelegramModule,
    AddressModule,
    OrdersModule,
    ManagerModule,
    AppConfigModule,
    HealthModule,
    LegalModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
