import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from '../common/dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CurrentUser,
  type AuthUserPayload,
} from '../common/current-user.decorator';

/** Заказы клиента: свои списки и создание */
@Controller('v1/orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findMine(
    @CurrentUser() user: AuthUserPayload,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.ordersService.findMine(
      user,
      status,
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
    );
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.ordersService.findOneForUser(id, user);
  }

  @Post()
  @Throttle({ default: { limit: 15, ttl: 60_000 } })
  create(
    @Body() dto: CreateOrderDto,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.ordersService.create(dto, user);
  }
}
