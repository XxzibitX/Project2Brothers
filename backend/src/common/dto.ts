import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
  ValidateNested,
  Equals,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { DeliveryAddressDto } from '../address/address.dto';

export { DeliveryAddressDto };

export class LoginDto {
  @IsString()
  phone!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}

export class RegisterDto {
  @IsString()
  phone!: string;

  @IsString()
  @MinLength(6, { message: 'Пароль должен быть не короче 6 символов' })
  password!: string;

  @IsOptional()
  @IsString()
  name?: string;

  /** Обязательное согласие на обработку ПД */
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean({ message: 'Необходимо согласие на обработку персональных данных' })
  @Equals(true, {
    message: 'Необходимо согласие на обработку персональных данных',
  })
  personalDataConsent!: boolean;
}

export class NamedIngredientDto {
  @IsString()
  id!: string;

  @IsString()
  name!: string;
}

export class NamedExtraDto {
  @IsString()
  id!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;
}

export class CreateOrderItemDto {
  @IsString()
  productId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  qty!: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  removedIngredientIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  extraIds?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NamedIngredientDto)
  removedIngredients?: NamedIngredientDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NamedExtraDto)
  selectedExtras?: NamedExtraDto[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  unitPrice?: number;
}

export class CreateOrderDto {
  @IsString()
  customerName!: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  deliveryAddress!: DeliveryAddressDto;

  @IsIn(['card_courier', 'cash_courier'], {
    message: 'Выберите способ оплаты',
  })
  paymentMethod!: 'card_courier' | 'cash_courier';

  /** UUID с клиента — защита от дублей при ретрае/двойном клике */
  @IsUUID('4', { message: 'idempotencyKey должен быть UUID' })
  idempotencyKey!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}

export class PatchOrderStatusDto {
  @IsIn(['new', 'cooking', 'ready', 'courier', 'done', 'cancelled'])
  status!: 'new' | 'cooking' | 'ready' | 'courier' | 'done' | 'cancelled';
}

export class CreateCategoryDto {
  @IsString()
  @MinLength(1)
  name!: string;
}

export class UpsertMenuExtraDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;
}

export class OrderSlaConfigDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  greenMinutes!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  yellowMinutes!: number;
}

export class ProductIngredientDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  name!: string;
}

export class ProductExtraDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  name!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;
}

export class UpsertProductDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  description!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @IsString()
  weight!: string;

  @IsString()
  category!: string;

  @IsString()
  image!: string;

  @IsOptional()
  popular?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductIngredientDto)
  ingredients?: ProductIngredientDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductExtraDto)
  extras?: ProductExtraDto[];
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  currentPassword!: string;

  @IsString()
  @MinLength(6, { message: 'Новый пароль должен быть не короче 6 символов' })
  newPassword!: string;
}

export class CreateStaffDto {
  @IsString()
  phone!: string;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(6, { message: 'Пароль должен быть не короче 6 символов' })
  password!: string;

  @IsIn(['manager', 'owner'], {
    message: 'Роль: manager или owner',
  })
  role!: 'manager' | 'owner';
}

export class PatchStaffDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsIn(['manager', 'owner'])
  role?: 'manager' | 'owner';

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @MinLength(6)
  newPassword?: string;
}

export class CafeSettingsDto {
  @IsOptional()
  @IsString()
  supportPhone?: string;

  @IsOptional()
  @IsString()
  cafeAddress?: string;

  @IsOptional()
  @IsString()
  workingHours?: string;
}

export class TelegramSettingsDto {
  @IsOptional()
  @IsString()
  botToken?: string;

  @IsOptional()
  @IsString()
  chatIds?: string;
}

export class SaveLegalDraftDto {
  @IsString()
  content!: string;

  @IsOptional()
  @IsString()
  title?: string;
}
