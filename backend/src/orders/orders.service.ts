import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, PatchOrderStatusDto } from '../common/dto';
import {
  mapOrder,
  toNumber,
  type OrderWithItems,
  type ProductWithRelations,
} from '../common/mappers';
import type { AuthUserPayload } from '../common/current-user.decorator';
import { TelegramService } from '../telegram/telegram.service';
import { formatDeliveryAddress } from '../address/address.format';

const ORDER_STATUSES: OrderStatus[] = [
  'new',
  'cooking',
  'ready',
  'courier',
  'done',
  'cancelled',
];

const ACTIVE_STATUSES: OrderStatus[] = [
  'new',
  'cooking',
  'ready',
  'courier',
];
const COMPLETED_STATUSES: OrderStatus[] = ['done', 'cancelled'];
const ARCHIVE_AFTER_DAYS = 30;

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private archiving = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly telegram: TelegramService,
  ) {}

  /** Заказы текущего пользователя (включая архив) */
  async findMine(
    user: AuthUserPayload,
    status?: string,
    page?: number,
    limit?: number,
  ) {
    return this.list({
      filter: {
        userId: user.id,
        status: this.parseStatus(status),
      },
      page,
      limit,
    });
  }

  /** Рабочий список: active | completed, без архива */
  async findAllForManager(opts: {
    status?: string;
    bucket?: string;
    page?: number;
    limit?: number;
  }) {
    const bucket =
      opts.bucket === 'completed'
        ? 'completed'
        : opts.bucket === 'active'
          ? 'active'
          : undefined;
    const status = this.parseStatus(opts.status);

    const filter = { archivedAt: null } as Prisma.OrderWhereInput;

    if (status) {
      if (bucket === 'active' && !ACTIVE_STATUSES.includes(status)) {
        filter.id = '__none__';
      } else if (
        bucket === 'completed' &&
        !COMPLETED_STATUSES.includes(status)
      ) {
        filter.id = '__none__';
      } else {
        filter.status = status;
      }
    } else if (bucket === 'active') {
      filter.status = { in: ACTIVE_STATUSES };
    } else if (bucket === 'completed') {
      filter.status = { in: COMPLETED_STATUSES };
    }

    return this.list({
      filter,
      page: opts.page,
      limit: opts.limit,
    });
  }

  async findArchiveMonth(opts: {
    year: number;
    month: number;
    page?: number;
    limit?: number;
  }) {
    const { year, month } = opts;
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      throw new BadRequestException('Некорректный год');
    }
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new BadRequestException('Некорректный месяц');
    }

    const from = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const to = new Date(Date.UTC(year, month, 1, 0, 0, 0));

    const filter = {
      archivedAt: { not: null },
      createdAt: { gte: from, lt: to },
    } as Prisma.OrderWhereInput;

    return this.list({
      filter,
      page: opts.page,
      limit: opts.limit ?? 20,
    });
  }

  async listArchiveMonths() {
    const rows = await this.prisma.$queryRaw<
      Array<{ ym: string; count: bigint | number }>
    >`
      SELECT DATE_FORMAT(\`createdAt\`, '%Y-%m') AS ym, COUNT(*) AS count
      FROM \`Order\`
      WHERE \`archivedAt\` IS NOT NULL
      GROUP BY ym
      ORDER BY ym DESC
      LIMIT 36
    `;
    return {
      items: rows.map((r) => ({
        yearMonth: String(r.ym),
        count: Number(r.count),
      })),
    };
  }

  async archiveOldOrders() {
    const cutoff = new Date(
      Date.now() - ARCHIVE_AFTER_DAYS * 24 * 60 * 60 * 1000,
    );
    const result = await this.prisma.order.updateMany({
      where: {
        archivedAt: null,
        status: { in: COMPLETED_STATUSES },
        createdAt: { lt: cutoff },
      },
      data: { archivedAt: new Date() },
    });
    if (result.count > 0) {
      this.logger.log(
        `Archived ${result.count} order(s) older than ${ARCHIVE_AFTER_DAYS}d`,
      );
    }
    return { archived: result.count, cutoff: cutoff.toISOString() };
  }

  @Interval(24 * 60 * 60 * 1000)
  async scheduledArchive() {
    if (this.archiving) return;
    this.archiving = true;
    try {
      await this.archiveOldOrders();
    } catch (error) {
      this.logger.warn(
        `Archive job failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    } finally {
      this.archiving = false;
    }
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) {
      throw new NotFoundException('Заказ не найден');
    }
    return this.mapOrderEnriched(order);
  }

  /** GET /v1/orders/:id — только свой заказ */
  async findOneForUser(id: string, user: AuthUserPayload) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) {
      throw new NotFoundException('Заказ не найден');
    }
    if (order.userId !== user.id) {
      throw new ForbiddenException('Нет доступа к этому заказу');
    }
    return this.mapOrderEnriched(order);
  }

  async create(dto: CreateOrderDto, user: AuthUserPayload) {
    if (!dto.items?.length) {
      throw new BadRequestException('Заказ должен содержать позиции');
    }

    const existingByKey = await this.prisma.order.findFirst({
      where: { idempotencyKey: dto.idempotencyKey },
      include: { items: true },
    });
    if (existingByKey) {
      if (existingByKey.userId && existingByKey.userId !== user.id) {
        throw new ConflictException('Ключ заказа уже использован');
      }
      return { order: await this.mapOrderEnriched(existingByKey) };
    }

    const productIds = [...new Set(dto.items.map((i) => i.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { ingredients: true, extras: true },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    const lines = dto.items.map((line) => {
      const product = byId.get(line.productId);
      if (!product) {
        throw new BadRequestException(`Товар ${line.productId} не найден`);
      }

      const selectedExtras =
        line.selectedExtras?.length
          ? line.selectedExtras.map((e) => {
              const fromProduct = product.extras.find((x) => x.key === e.id);
              return {
                id: e.id,
                name: e.name || fromProduct?.name || e.id,
                price:
                  e.price ??
                  (fromProduct ? toNumber(fromProduct.price) : 0),
              };
            })
          : product.extras
              .filter((e) => (line.extraIds ?? []).includes(e.key))
              .map((e) => ({
                id: e.key,
                name: e.name,
                price: toNumber(e.price),
              }));

      const removedIngredients =
        line.removedIngredients?.length
          ? line.removedIngredients.map((i) => {
              const fromProduct = product.ingredients.find(
                (x) => x.key === i.id,
              );
              return {
                id: i.id,
                name: i.name || fromProduct?.name || i.id,
              };
            })
          : product.ingredients
              .filter((i) =>
                (line.removedIngredientIds ?? []).includes(i.key),
              )
              .map((i) => ({ id: i.key, name: i.name }));

      const extrasPrice = selectedExtras.reduce((sum, e) => sum + e.price, 0);
      const price =
        line.unitPrice != null
          ? Number(line.unitPrice)
          : toNumber(product.price) + extrasPrice;

      return {
        productId: product.id,
        name: product.name,
        price,
        qty: line.qty,
        removedIngredientIds: removedIngredients,
        extraIds: selectedExtras,
      };
    });

    const total = lines.reduce((sum, i) => sum + i.price * i.qty, 0);

    const addr = dto.deliveryAddress;
    if (!addr?.street?.trim() || !addr?.house?.trim()) {
      throw new BadRequestException('Укажите адрес доставки');
    }
    if (!addr.isPrivateHouse && !addr.apartment?.trim()) {
      throw new BadRequestException('Укажите квартиру или отметьте частный дом');
    }

    const deliveryFormatted = formatDeliveryAddress({
      street: addr.street,
      house: addr.house,
      entrance: addr.entrance,
      apartment: addr.isPrivateHouse ? undefined : addr.apartment,
      isPrivateHouse: addr.isPrivateHouse,
    });

    let order: OrderWithItems;
    try {
      order = await this.prisma.$transaction(async (tx) => {
        const id = await this.allocateOrderId(tx);
        return tx.order.create({
          data: {
            id,
            userId: user.id,
            customerName: dto.customerName,
            customerPhone: dto.customerPhone,
            deliveryAddress: deliveryFormatted,
            deliveryStreet: addr.street.trim(),
            deliveryHouse: addr.house.trim(),
            deliveryEntrance: addr.entrance?.trim() || null,
            deliveryApartment: addr.isPrivateHouse
              ? null
              : addr.apartment?.trim() || null,
            deliveryIsPrivateHouse: addr.isPrivateHouse,
            paymentMethod: dto.paymentMethod,
            idempotencyKey: dto.idempotencyKey,
            total,
            status: 'new',
            items: {
              create: lines.map((line) => ({
                productId: line.productId,
                name: line.name,
                price: line.price,
                qty: line.qty,
                removedIngredientIds: line.removedIngredientIds,
                extraIds: line.extraIds,
              })),
            },
          },
          include: { items: true },
        });
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const raced = await this.prisma.order.findFirst({
          where: { idempotencyKey: dto.idempotencyKey },
          include: { items: true },
        });
        if (raced) {
          return { order: await this.mapOrderEnriched(raced) };
        }
      }
      throw error;
    }

    const mapped = await this.mapOrderEnriched(order);
    void this.telegram.notifyNewOrder(mapped).catch((error: unknown) => {
      this.logger.warn(
        `Telegram notify failed for ${mapped.id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    });

    return { order: mapped };
  }

  async patchStatus(id: string, dto: PatchOrderStatusDto) {
    if (!ORDER_STATUSES.includes(dto.status as OrderStatus)) {
      throw new BadRequestException('Некорректный статус');
    }

    const existing = await this.prisma.order.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Заказ не найден');
    }

    const order = await this.prisma.order.update({
      where: { id },
      data: { status: dto.status as OrderStatus },
      include: { items: true },
    });
    const mapped = await this.mapOrderEnriched(order);

    void this.telegram.syncOrderMessage(mapped).catch((error: unknown) => {
      this.logger.warn(
        `Telegram sync failed for ${mapped.id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    });

    return mapped;
  }

  private parseStatus(status?: string): OrderStatus | undefined {
    if (status && ORDER_STATUSES.includes(status as OrderStatus)) {
      return status as OrderStatus;
    }
    return undefined;
  }

  private async list(opts: {
    filter: Prisma.OrderWhereInput;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, opts.page ?? 1);
    const limit = Math.min(50, Math.max(1, opts.limit ?? 10));
    const skip = (page - 1) * limit;
    const { filter } = opts;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: filter,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where: filter }),
    ]);

    const productsById = await this.loadProductsForOrders(orders);

    return {
      items: orders.map((o) => mapOrder(o, productsById)),
      total,
      page,
      limit,
    };
  }

  private async mapOrderEnriched(order: OrderWithItems) {
    const productsById = await this.loadProductsForOrders([order]);
    return mapOrder(order, productsById);
  }

  private async loadProductsForOrders(
    orders: { items: { productId: string | null }[] }[],
  ): Promise<Map<string, ProductWithRelations>> {
    const ids = [
      ...new Set(
        orders
          .flatMap((o) => o.items.map((i) => i.productId))
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    if (!ids.length) return new Map();
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids } },
      include: { ingredients: true, extras: true },
    });
    return new Map(products.map((p) => [p.id, p]));
  }

  /** Атомарный ORD-N внутри транзакции */
  private async allocateOrderId(
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    await tx.$executeRaw`
      INSERT INTO \`OrderCounter\` (\`id\`, \`value\`)
      VALUES (1, 1000)
      ON DUPLICATE KEY UPDATE \`id\` = \`id\`
    `;
    await tx.$executeRaw`
      UPDATE \`OrderCounter\` SET \`value\` = \`value\` + 1 WHERE \`id\` = 1
    `;
    const rows = await tx.$queryRaw<Array<{ value: number | bigint }>>`
      SELECT \`value\` FROM \`OrderCounter\` WHERE \`id\` = 1
    `;
    const value = Number(rows[0]?.value);
    if (!Number.isFinite(value) || value < 1) {
      throw new BadRequestException('Не удалось выделить номер заказа');
    }
    return `ORD-${value}`;
  }
}
