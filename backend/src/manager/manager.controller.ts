import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OrdersService } from '../orders/orders.service';
import { ProductsService } from '../products/products.service';
import { CategoriesService } from '../categories/categories.service';
import { ExtrasService } from '../extras/extras.service';
import {
  CafeSettingsDto,
  CreateCategoryDto,
  CreateStaffDto,
  OrderSlaConfigDto,
  PatchOrderStatusDto,
  PatchStaffDto,
  TelegramSettingsDto,
  UpsertMenuExtraDto,
  UpsertProductDto,
} from '../common/dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { AppConfigService } from '../config/app-config.service';
import {
  productImageMulterOptions,
  UploadsService,
} from '../uploads/uploads.service';
import { StaffService } from './staff.service';
import { TelegramService } from '../telegram/telegram.service';
import {
  CurrentUser,
  type AuthUserPayload,
} from '../common/current-user.decorator';

/** Защищённые эндпоинты менеджера / владельца */
@Controller('v1/manager')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('manager')
export class ManagerController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly productsService: ProductsService,
    private readonly categoriesService: CategoriesService,
    private readonly extrasService: ExtrasService,
    private readonly configService: AppConfigService,
    private readonly uploadsService: UploadsService,
    private readonly staffService: StaffService,
    private readonly telegram: TelegramService,
  ) {}

  @Get('orders')
  findOrders(
    @Query('status') status?: string,
    @Query('bucket') bucket?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.ordersService.findAllForManager({
      status,
      bucket,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('orders/archive/months')
  listArchiveMonths() {
    return this.ordersService.listArchiveMonths();
  }

  @Get('orders/archive')
  findArchiveOrders(
    @Query('year') year?: string,
    @Query('month') month?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.ordersService.findArchiveMonth({
      year: Number(year),
      month: Number(month),
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Post('orders/archive/run')
  runArchive() {
    return this.ordersService.archiveOldOrders();
  }

  @Get('orders/:id')
  findOrder(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch('orders/:id/status')
  patchStatus(@Param('id') id: string, @Body() dto: PatchOrderStatusDto) {
    return this.ordersService.patchStatus(id, dto);
  }

  @Get('products')
  findProducts() {
    return this.productsService.findAll();
  }

  @Post('products/image')
  @UseInterceptors(FileInterceptor('file', productImageMulterOptions))
  uploadProductImage(@UploadedFile() file: Express.Multer.File) {
    return this.uploadsService.processAndSaveProductImage(file);
  }

  @Post('products')
  createProduct(@Body() dto: UpsertProductDto) {
    return this.productsService.create(dto);
  }

  @Put('products/:id')
  updateProduct(@Param('id') id: string, @Body() dto: UpsertProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete('products/:id')
  deleteProduct(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Get('categories')
  findCategories() {
    return this.categoriesService.findAll();
  }

  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto.name);
  }

  @Delete('categories/:key')
  deleteCategory(@Param('key') key: string) {
    return this.categoriesService.remove(key);
  }

  @Get('extras')
  findExtras() {
    return this.extrasService.findAll();
  }

  @Post('extras')
  createExtra(@Body() dto: UpsertMenuExtraDto) {
    return this.extrasService.create(dto.name, dto.price);
  }

  @Put('extras/:key')
  updateExtra(@Param('key') key: string, @Body() dto: UpsertMenuExtraDto) {
    return this.extrasService.update(key, dto.name, dto.price);
  }

  @Delete('extras/:key')
  deleteExtra(@Param('key') key: string) {
    return this.extrasService.remove(key);
  }

  @Get('config/order-sla')
  getOrderSla() {
    return this.configService.getOrderSla();
  }

  @Put('config/order-sla')
  setOrderSla(@Body() dto: OrderSlaConfigDto) {
    return this.configService.setOrderSla(dto);
  }

  @Get('settings')
  @Roles('owner')
  getSettings() {
    return this.configService.getManagerSettingsView();
  }

  @Get('system-status')
  @Roles('owner')
  getSystemStatus() {
    return this.telegram.getSystemStatus();
  }

  @Put('settings/cafe')
  @Roles('owner')
  setCafeSettings(@Body() dto: CafeSettingsDto) {
    return this.configService.setCafeSettings(dto);
  }

  @Put('settings/telegram')
  @Roles('owner')
  async setTelegramSettings(@Body() dto: TelegramSettingsDto) {
    const saved = await this.configService.setTelegramSettings(dto);
    await this.telegram.reloadFromSettings();
    return saved;
  }

  @Post('settings/telegram/test')
  @Roles('owner')
  testTelegram() {
    return this.telegram.testConnection();
  }

  @Get('staff')
  @Roles('owner')
  listStaff() {
    return this.staffService.list();
  }

  @Post('staff')
  @Roles('owner')
  createStaff(
    @Body() dto: CreateStaffDto,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.staffService.create(dto, user);
  }

  @Patch('staff/:id')
  @Roles('owner')
  patchStaff(
    @Param('id') id: string,
    @Body() dto: PatchStaffDto,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.staffService.patch(id, dto, user);
  }
}
