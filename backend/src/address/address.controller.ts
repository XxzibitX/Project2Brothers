import { Body, Controller, Post } from '@nestjs/common';
import { AddressService } from './address.service';
import { AddressSuggestDto } from './address.dto';

@Controller('v1/address')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  /** Подсказки адресов доступны и гостям (корзина до логина) */
  @Post('suggest')
  suggest(@Body() dto: AddressSuggestDto) {
    return this.addressService.suggest(dto.query, dto.count ?? 7);
  }
}
