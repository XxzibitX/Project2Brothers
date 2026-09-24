import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { OrderStatus } from '@prisma/client';
import { Telegraf } from 'telegraf';
import { PrismaService } from '../prisma/prisma.service';
import { AppConfigService } from '../config/app-config.service';
import {
  buildStatusKeyboard,
  formatOrderMessage,
  parseStatusCallback,
  STATUS_LABELS,
  type OrderMessagePayload,
} from './order-message';

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);
  private bot: Telegraf | null = null;
  private chatIds: string[] = [];
  /** Можно слать сообщения (токен + chat ids есть) */
  private canSend = false;
  /** Long-polling для кнопок статусов */
  private polling = false;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly appConfig: AppConfigService,
  ) {}

  async onModuleInit() {
    await this.applyCredentials(await this.resolveCredentials());
  }

  async onModuleDestroy() {
    await this.stopBot();
  }

  isEnabled(): boolean {
    return this.canSend && this.bot != null;
  }

  /**
   * Статус для панели владельца: БД, реальный ping Telegram, очередь outbox.
   */
  async getSystemStatus(): Promise<{
    api: true;
    db: boolean;
    telegram: {
      ok: boolean;
      configured: boolean;
      message: string;
      botUsername: string | null;
      polling: boolean;
    };
    pendingTelegramOrders: number;
    checkedAt: string;
  }> {
    let dbOk = false;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbOk = true;
    } catch {
      dbOk = false;
    }

    const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const pendingTelegramOrders = await this.prisma.order.count({
      where: {
        telegramNotifiedAt: null,
        status: { not: 'cancelled' },
        createdAt: { gte: since },
      },
    });

    const creds = await this.resolveCredentials();
    if (!creds) {
      return {
        api: true,
        db: dbOk,
        telegram: {
          ok: false,
          configured: false,
          message: 'Токен или chat id не заданы',
          botUsername: null,
          polling: false,
        },
        pendingTelegramOrders,
        checkedAt: new Date().toISOString(),
      };
    }

    if (!this.bot) {
      try {
        await this.applyCredentials(creds);
      } catch {
        // fall through to ping failure below
      }
    }

    if (!this.bot) {
      return {
        api: true,
        db: dbOk,
        telegram: {
          ok: false,
          configured: true,
          message: 'Бот не инициализирован',
          botUsername: null,
          polling: false,
        },
        pendingTelegramOrders,
        checkedAt: new Date().toISOString(),
      };
    }

    try {
      const me = await Promise.race([
        this.bot.telegram.getMe(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('Таймаут связи с api.telegram.org')),
            8_000,
          ),
        ),
      ]);
      const username =
        'username' in me && me.username ? `@${me.username}` : String(me.id);
      return {
        api: true,
        db: dbOk,
        telegram: {
          ok: true,
          configured: true,
          message: `Связь с Telegram ОК: ${username}`,
          botUsername: 'username' in me && me.username ? me.username : null,
          polling: this.polling,
        },
        pendingTelegramOrders,
        checkedAt: new Date().toISOString(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        api: true,
        db: dbOk,
        telegram: {
          ok: false,
          configured: true,
          message: `Нет связи с Telegram: ${message}`,
          botUsername: null,
          polling: this.polling,
        },
        pendingTelegramOrders,
        checkedAt: new Date().toISOString(),
      };
    }
  }

  /** Перечитать токен/чаты из БД (или .env) и перезапустить бота */
  async reloadFromSettings(): Promise<{ ok: boolean; message: string }> {
    const creds = await this.resolveCredentials();
    if (!creds) {
      await this.stopBot();
      return {
        ok: false,
        message: 'Токен или chat id не заданы',
      };
    }
    try {
      await this.applyCredentials(creds);
      // быстрая проверка getMe
      if (!this.bot) {
        return { ok: false, message: 'Бот не инициализирован' };
      }
      const me = await this.bot.telegram.getMe();
      return {
        ok: true,
        message: `Подключено: @${me.username ?? me.id}`,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Telegram reload failed: ${message}`);
      return { ok: false, message };
    }
  }

  /** Тест: getMe + опционально сообщение в первый чат */
  async testConnection(): Promise<{ ok: boolean; message: string }> {
    const result = await this.reloadFromSettings();
    if (!result.ok || !this.bot || !this.chatIds[0]) {
      return result;
    }
    try {
      await this.bot.telegram.sendMessage(
        this.chatIds[0],
        '✅ Тест уведомлений 2Brothers: бот настроен правильно.',
      );
      return {
        ok: true,
        message: `${result.message}. Тестовое сообщение отправлено.`,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { ok: false, message: `Бот жив, но чат недоступен: ${message}` };
    }
  }

  private async resolveCredentials(): Promise<{
    token: string;
    chatIds: string[];
  } | null> {
    const fromDb = await this.appConfig.getTelegramSettings();
    const token =
      fromDb.botToken.trim() ||
      this.config.get<string>('TELEGRAM_BOT_TOKEN')?.trim() ||
      '';
    const chatIdsRaw =
      fromDb.chatIds.trim() ||
      this.config.get<string>('TELEGRAM_CHAT_IDS')?.trim() ||
      '';
    const chatIds = chatIdsRaw
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
    if (!token || !chatIds.length) return null;
    return { token, chatIds };
  }

  private async stopBot() {
    if (this.bot) {
      try {
        this.bot.stop('reconfigure');
      } catch {
        // ignore
      }
    }
    this.bot = null;
    this.canSend = false;
    this.polling = false;
    this.chatIds = [];
  }

  private async applyCredentials(creds: {
    token: string;
    chatIds: string[];
  } | null) {
    await this.stopBot();
    if (!creds) {
      this.logger.warn(
        'Telegram bot disabled: set token/chat ids in Настройки or .env',
      );
      return;
    }

    this.chatIds = creds.chatIds;
    this.bot = new Telegraf(creds.token);
    this.registerHandlers();
    this.canSend = true;
    this.logger.log(
      `Telegram sender ready, chats: ${this.chatIds.join(', ')}`,
    );

    void this.bot
      .launch({ dropPendingUpdates: true })
      .then(() => {
        this.polling = true;
        this.logger.log('Telegram polling started (status buttons active)');
      })
      .catch((error: unknown) => {
        this.polling = false;
        this.logger.warn(
          `Telegram polling failed (notifications still work): ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      });
  }

  /** Уведомить о новом заказе и сохранить messageId для обновлений.
   *  При успехе ставит telegramNotifiedAt. При ошибке — throw (для outbox). */
  async notifyNewOrder(order: OrderMessagePayload): Promise<void> {
    if (!this.isEnabled() || !this.bot) {
      this.logger.warn(
        `Skip Telegram notify for ${order.id}: bot not configured`,
      );
      return;
    }

    const text = formatOrderMessage(order);
    const keyboard = buildStatusKeyboard(order.id, order.status);

    const primaryChatId = this.chatIds[0];
    const sent = await this.sendWithRetry(primaryChatId, text, keyboard);

    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        telegramChatId: String(sent.chat.id),
        telegramMessageId: sent.message_id,
        telegramNotifiedAt: new Date(),
      },
    });

    for (const chatId of this.chatIds.slice(1)) {
      await this.sendWithRetry(chatId, text, keyboard);
    }

    this.logger.log(`Telegram notified for order ${order.id}`);
  }

  private flushingOutbox = false;

  /** Досылка заказов, у которых Telegram не подтвердился */
  @Interval(30_000)
  async flushNotifyOutbox() {
    if (!this.isEnabled() || this.flushingOutbox) return;

    this.flushingOutbox = true;
    try {
      const now = Date.now();
      const since = new Date(now - 48 * 60 * 60 * 1000);
      const readyBefore = new Date(now - 20_000);

      const pending = await this.prisma.order.findMany({
        where: {
          telegramNotifiedAt: null,
          status: { not: 'cancelled' },
          createdAt: { gte: since, lte: readyBefore },
        },
        include: { items: true },
        orderBy: { createdAt: 'asc' },
        take: 10,
      });

      if (!pending.length) return;

      this.logger.warn(
        `Telegram outbox: retrying ${pending.length} order(s)`,
      );

      for (const order of pending) {
        try {
          await this.notifyNewOrder(this.toPayload(order));
        } catch (error) {
          this.logger.warn(
            `Outbox notify failed for ${order.id}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      }
    } finally {
      this.flushingOutbox = false;
    }
  }

  private async sendWithRetry(
    chatId: string,
    text: string,
    keyboard: ReturnType<typeof buildStatusKeyboard>,
    attempts = 3,
  ) {
    if (!this.bot) {
      throw new Error('Telegram bot is not initialized');
    }

    let lastError: unknown;
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        return await this.bot.telegram.sendMessage(chatId, text, {
          parse_mode: 'HTML',
          ...keyboard,
        });
      } catch (error) {
        lastError = error;
        const code =
          error && typeof error === 'object' && 'code' in error
            ? String((error as { code?: string }).code)
            : '';
        const retryable =
          code === 'ETIMEDOUT' ||
          code === 'ECONNRESET' ||
          code === 'ENOTFOUND' ||
          code === 'EAI_AGAIN' ||
          code === 'ECONNREFUSED' ||
          messageIncludes(error, '429') ||
          messageIncludes(error, 'ETIMEDOUT');

        if (!retryable || attempt === attempts) {
          throw error;
        }

        const delayMs = attempt * 800;
        this.logger.warn(
          `Telegram send timed out (attempt ${attempt}/${attempts}), retry in ${delayMs}ms`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    throw lastError;
  }

  /** Обновить сообщение заказа после смены статуса (из API или бота) */
  async syncOrderMessage(order: OrderMessagePayload): Promise<void> {
    if (!this.isEnabled() || !this.bot) return;

    const stored = await this.prisma.order.findUnique({
      where: { id: order.id },
      select: { telegramChatId: true, telegramMessageId: true },
    });

    if (!stored?.telegramChatId || stored.telegramMessageId == null) {
      return;
    }

    const text = formatOrderMessage(order);
    const keyboard = buildStatusKeyboard(order.id, order.status);

    try {
      await this.bot.telegram.editMessageText(
        stored.telegramChatId,
        stored.telegramMessageId,
        undefined,
        text,
        {
          parse_mode: 'HTML',
          ...keyboard,
        },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes('message is not modified')) {
        this.logger.warn(
          `Failed to sync Telegram message for ${order.id}: ${message}`,
        );
      }
    }
  }

  private registerHandlers() {
    if (!this.bot) return;

    this.bot.start(async (ctx) => {
      await ctx.reply(
        [
          'Бот заказов 2Brothers.',
          `Ваш chat id: <code>${ctx.chat.id}</code>`,
          'Добавьте его в настройках панели менеджера (Telegram chat ids).',
        ].join('\n'),
        { parse_mode: 'HTML' },
      );
    });

    this.bot.command('chatid', async (ctx) => {
      await ctx.reply(`Chat ID: <code>${ctx.chat.id}</code>`, {
        parse_mode: 'HTML',
      });
    });

    this.bot.on('callback_query', async (ctx) => {
      const data =
        'data' in ctx.callbackQuery ? ctx.callbackQuery.data : undefined;
      if (!data) {
        await ctx.answerCbQuery();
        return;
      }

      const parsed = parseStatusCallback(data);
      if (!parsed) {
        await ctx.answerCbQuery('Неизвестная команда');
        return;
      }

      const chatId =
        ctx.callbackQuery.message && 'chat' in ctx.callbackQuery.message
          ? String(ctx.callbackQuery.message.chat.id)
          : ctx.chat
            ? String(ctx.chat.id)
            : null;

      if (!chatId || !this.chatIds.includes(chatId)) {
        await ctx.answerCbQuery('Нет доступа');
        return;
      }

      try {
        const existing = await this.prisma.order.findUnique({
          where: { id: parsed.orderId },
        });
        if (!existing) {
          await ctx.answerCbQuery('Заказ не найден');
          return;
        }

        if (existing.status === parsed.status) {
          await ctx.answerCbQuery(
            `Уже: ${STATUS_LABELS[parsed.status as OrderStatus]}`,
          );
          return;
        }

        const updated = await this.prisma.order.update({
          where: { id: parsed.orderId },
          data: { status: parsed.status },
          include: { items: true },
        });

        const payload = this.toPayload(updated);
        const text = formatOrderMessage(payload);
        const keyboard = buildStatusKeyboard(payload.id, payload.status);

        await ctx.editMessageText(text, {
          parse_mode: 'HTML',
          ...keyboard,
        });
        await ctx.answerCbQuery(`Статус: ${STATUS_LABELS[parsed.status]}`);
      } catch (error) {
        this.logger.error(
          `Failed to update status via Telegram for ${parsed.orderId}`,
          error as Error,
        );
        await ctx.answerCbQuery('Ошибка обновления статуса');
      }
    });
  }

  private toPayload(order: {
    id: string;
    customerName: string;
    customerPhone: string | null;
    paymentMethod?: 'card_courier' | 'cash_courier';
    total: { toNumber?: () => number } | number;
    status: OrderStatus;
    createdAt: Date;
    items: Array<{
      name: string;
      price: { toNumber?: () => number } | number;
      qty: number;
      removedIngredientIds: unknown;
      extraIds: unknown;
    }>;
  }): OrderMessagePayload {
    const toNum = (v: { toNumber?: () => number } | number) =>
      typeof v === 'number' ? v : Number(v);

    return {
      id: order.id,
      customerName: order.customerName,
      ...(order.customerPhone ? { customerPhone: order.customerPhone } : {}),
      ...(order.paymentMethod ? { paymentMethod: order.paymentMethod } : {}),
      total: toNum(order.total),
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      items: order.items.map((item) => ({
        name: item.name,
        price: toNum(item.price),
        qty: item.qty,
        removedIngredients: this.parseMods(item.removedIngredientIds),
        selectedExtras: this.parseExtras(item.extraIds),
      })),
    };
  }

  private parseMods(
    raw: unknown,
  ): { id: string; name: string }[] | undefined {
    if (!Array.isArray(raw) || !raw.length) return undefined;
    return raw
      .map((entry) => {
        if (typeof entry === 'string') return { id: entry, name: entry };
        if (entry && typeof entry === 'object' && 'id' in entry) {
          const obj = entry as { id: string; name?: string };
          return { id: String(obj.id), name: String(obj.name ?? obj.id) };
        }
        return null;
      })
      .filter((x): x is { id: string; name: string } => x != null);
  }

  private parseExtras(
    raw: unknown,
  ): { id: string; name: string; price: number }[] | undefined {
    if (!Array.isArray(raw) || !raw.length) return undefined;
    return raw
      .map((entry) => {
        if (typeof entry === 'string') {
          return { id: entry, name: entry, price: 0 };
        }
        if (entry && typeof entry === 'object' && 'id' in entry) {
          const obj = entry as { id: string; name?: string; price?: number };
          return {
            id: String(obj.id),
            name: String(obj.name ?? obj.id),
            price: Number(obj.price ?? 0),
          };
        }
        return null;
      })
      .filter(
        (x): x is { id: string; name: string; price: number } => x != null,
      );
  }
}

function messageIncludes(error: unknown, needle: string): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return message.includes(needle);
}
