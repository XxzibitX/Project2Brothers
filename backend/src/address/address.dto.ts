import {
  IsBoolean,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

function trimString({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function normalizeHouse({ value }: { value: unknown }): unknown {
  if (typeof value !== 'string') return value;
  return value
    .trim()
    .replace(/^(д\.?|дом)\s*/i, '')
    .replace(/\s+/g, ' ');
}

function normalizeEntrance({ value }: { value: unknown }): unknown {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim().replace(/^(под\.?|подъезд)\s*/i, '');
  return trimmed || undefined;
}

function normalizeApartment({ value }: { value: unknown }): unknown {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim().replace(/^(кв\.?|квартира)\s*/i, '');
  return trimmed || undefined;
}

/** Адрес доставки при создании заказа */
export class DeliveryAddressDto {
  @Transform(trimString)
  @IsString()
  @MinLength(2, { message: 'Укажите улицу' })
  street!: string;

  @Transform(normalizeHouse)
  @IsString()
  @MinLength(1, { message: 'Укажите дом' })
  house!: string;

  @IsOptional()
  @Transform(normalizeEntrance)
  @IsString()
  entrance?: string;

  @ValidateIf((o: DeliveryAddressDto) => !o.isPrivateHouse)
  @Transform(normalizeApartment)
  @IsString({ message: 'Укажите квартиру' })
  @MinLength(1, { message: 'Укажите квартиру' })
  apartment?: string;

  @Type(() => Boolean)
  @IsBoolean()
  isPrivateHouse!: boolean;
}

export class AddressSuggestDto {
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  query!: string;

  @IsOptional()
  @Type(() => Number)
  count?: number;
}
