import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export const ORDER_SLA_CONFIG_KEY = 'orderSla';
export const TELEGRAM_CONFIG_KEY = 'telegram';
export const CAFE_CONFIG_KEY = 'cafe';

const PRIVATE_CONFIG_KEYS = new Set([TELEGRAM_CONFIG_KEY, 'telegramBotToken']);

export type OrderSlaConfig = {
  /** До этого времени (мин) — зелёный */
  greenMinutes: number;
  /** После green и до этого — жёлтый; дальше — красный */
  yellowMinutes: number;
};

export type CafeSettings = {
  supportPhone: string;
  cafeAddress: string;
  workingHours: string;
};

export type TelegramSettings = {
  botToken: string;
  chatIds: string;
};

export const DEFAULT_ORDER_SLA: OrderSlaConfig = {
  greenMinutes: 10,
  yellowMinutes: 40,
};

export const DEFAULT_CAFE: CafeSettings = {
  supportPhone: '',
  cafeAddress: '',
  workingHours: '',
};

function normalizeSla(raw: unknown): OrderSlaConfig {
  const obj =
    raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const green = Number(obj.greenMinutes ?? DEFAULT_ORDER_SLA.greenMinutes);
  const yellow = Number(obj.yellowMinutes ?? DEFAULT_ORDER_SLA.yellowMinutes);

  if (!Number.isFinite(green) || green < 1) {
    throw new BadRequestException('greenMinutes должен быть числом ≥ 1');
  }
  if (!Number.isFinite(yellow) || yellow <= green) {
    throw new BadRequestException(
      'yellowMinutes должен быть больше greenMinutes',
    );
  }

  return {
    greenMinutes: Math.round(green),
    yellowMinutes: Math.round(yellow),
  };
}

function asObject(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
}

function maskToken(token: string): string {
  const t = token.trim();
  if (t.length <= 10) return t ? '••••••••' : '';
  return `${t.slice(0, 6)}…${t.slice(-4)}`;
}

@Injectable()
export class AppConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicConfig() {
    const rows = await this.prisma.appConfig.findMany();
    const result: Record<string, unknown> = {
      appName: '2Brothers',
      currency: 'RUB',
      orderSla: DEFAULT_ORDER_SLA,
    };
    for (const row of rows) {
      if (PRIVATE_CONFIG_KEYS.has(row.key)) continue;
      result[row.key] = row.value;
    }

    const cafe = await this.getCafeSettings();
    result.supportPhone = cafe.supportPhone || result.supportPhone || '';
    result.cafeAddress = cafe.cafeAddress;
    result.workingHours = cafe.workingHours;

    if (!result.orderSla || typeof result.orderSla !== 'object') {
      result.orderSla = DEFAULT_ORDER_SLA;
    } else {
      try {
        result.orderSla = normalizeSla(result.orderSla);
      } catch {
        result.orderSla = DEFAULT_ORDER_SLA;
      }
    }
    return result;
  }

  async getOrderSla(): Promise<OrderSlaConfig> {
    const row = await this.prisma.appConfig.findUnique({
      where: { key: ORDER_SLA_CONFIG_KEY },
    });
    if (!row) return DEFAULT_ORDER_SLA;
    try {
      return normalizeSla(row.value);
    } catch {
      return DEFAULT_ORDER_SLA;
    }
  }

  async setOrderSla(raw: unknown): Promise<OrderSlaConfig> {
    const sla = normalizeSla(raw);
    await this.prisma.appConfig.upsert({
      where: { key: ORDER_SLA_CONFIG_KEY },
      create: { key: ORDER_SLA_CONFIG_KEY, value: sla },
      update: { value: sla },
    });
    return sla;
  }

  async getCafeSettings(): Promise<CafeSettings> {
    const row = await this.prisma.appConfig.findUnique({
      where: { key: CAFE_CONFIG_KEY },
    });
    const obj = asObject(row?.value);
    const legacyPhone = await this.prisma.appConfig.findUnique({
      where: { key: 'supportPhone' },
    });
    let supportFromLegacy = '';
    if (typeof legacyPhone?.value === 'string') {
      supportFromLegacy = legacyPhone.value;
    }

    return {
      supportPhone: String(obj.supportPhone ?? supportFromLegacy ?? ''),
      cafeAddress: String(obj.cafeAddress ?? ''),
      workingHours: String(obj.workingHours ?? ''),
    };
  }

  async setCafeSettings(partial: Partial<CafeSettings>): Promise<CafeSettings> {
    const current = await this.getCafeSettings();
    const next: CafeSettings = {
      supportPhone: partial.supportPhone?.trim() ?? current.supportPhone,
      cafeAddress: partial.cafeAddress?.trim() ?? current.cafeAddress,
      workingHours: partial.workingHours?.trim() ?? current.workingHours,
    };
    const value = next as unknown as Prisma.InputJsonValue;
    await this.prisma.appConfig.upsert({
      where: { key: CAFE_CONFIG_KEY },
      create: { key: CAFE_CONFIG_KEY, value },
      update: { value },
    });
    // keep legacy key for older clients
    if (next.supportPhone) {
      await this.prisma.appConfig.upsert({
        where: { key: 'supportPhone' },
        create: { key: 'supportPhone', value: next.supportPhone },
        update: { value: next.supportPhone },
      });
    }
    return next;
  }

  async getTelegramSettings(): Promise<TelegramSettings> {
    const row = await this.prisma.appConfig.findUnique({
      where: { key: TELEGRAM_CONFIG_KEY },
    });
    const obj = asObject(row?.value);
    return {
      botToken: String(obj.botToken ?? ''),
      chatIds: String(obj.chatIds ?? ''),
    };
  }

  async setTelegramSettings(
    partial: Partial<TelegramSettings>,
  ): Promise<{ botTokenMasked: string; chatIds: string; configured: boolean }> {
    const current = await this.getTelegramSettings();
    const next: TelegramSettings = {
      botToken:
        partial.botToken != null && partial.botToken.trim() !== ''
          ? partial.botToken.trim()
          : current.botToken,
      chatIds:
        partial.chatIds != null
          ? partial.chatIds.trim()
          : current.chatIds,
    };
    const value = next as unknown as Prisma.InputJsonValue;
    await this.prisma.appConfig.upsert({
      where: { key: TELEGRAM_CONFIG_KEY },
      create: { key: TELEGRAM_CONFIG_KEY, value },
      update: { value },
    });
    return {
      botTokenMasked: maskToken(next.botToken),
      chatIds: next.chatIds,
      configured: Boolean(next.botToken && next.chatIds),
    };
  }

  async getManagerSettingsView() {
    const cafe = await this.getCafeSettings();
    const telegram = await this.getTelegramSettings();
    const sla = await this.getOrderSla();
    return {
      cafe,
      telegram: {
        botTokenMasked: maskToken(telegram.botToken),
        chatIds: telegram.chatIds,
        configured: Boolean(telegram.botToken && telegram.chatIds),
        hasToken: Boolean(telegram.botToken),
      },
      orderSla: sla,
    };
  }
}
