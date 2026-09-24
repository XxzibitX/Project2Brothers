import type { OrderStatus } from '@prisma/client';
import { Markup } from 'telegraf';
import { PAYMENT_METHOD_LABELS } from '../common/payment-method';

export const STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'Принят',
  cooking: 'Готовится',
  ready: 'Готов',
  courier: 'У курьера',
  done: 'Выдан',
  cancelled: 'Отменён',
};

export const STATUS_FLOW: OrderStatus[] = [
  'new',
  'cooking',
  'ready',
  'courier',
  'done',
];

export type OrderMessageItem = {
  name: string;
  price: number;
  qty: number;
  removedIngredients?: { id: string; name: string }[];
  selectedExtras?: { id: string; name: string; price: number }[];
};

export type OrderMessagePayload = {
  id: string;
  customerName: string;
  customerPhone?: string;
  deliveryAddress?: {
    formatted: string;
    street?: string;
    house?: string;
    entrance?: string;
    apartment?: string;
    isPrivateHouse?: boolean;
  };
  paymentMethod?: 'card_courier' | 'cash_courier';
  total: number;
  status: OrderStatus;
  createdAt: string;
  items: OrderMessageItem[];
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatMoney(value: number): string {
  return `${value.toLocaleString('ru-RU')} ₽`;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatOrderMessage(order: OrderMessagePayload): string {
  const lines: string[] = [
    `<b>🧾 Заказ ${escapeHtml(order.id)}</b>`,
    `Статус: <b>${STATUS_LABELS[order.status]}</b>`,
    `Время: ${formatDate(order.createdAt)}`,
    '',
    `<b>Клиент:</b> ${escapeHtml(order.customerName)}`,
  ];

  if (order.customerPhone) {
    lines.push(`Телефон: <code>${escapeHtml(order.customerPhone)}</code>`);
  }

  if (order.deliveryAddress?.formatted) {
    lines.push(
      `Адрес: ${escapeHtml(order.deliveryAddress.formatted)}`,
    );
  }

  if (order.paymentMethod) {
    lines.push(
      `Оплата: <b>${escapeHtml(PAYMENT_METHOD_LABELS[order.paymentMethod])}</b>`,
    );
  }

  lines.push('', '<b>Состав:</b>');

  for (const item of order.items) {
    lines.push(
      `• ${escapeHtml(item.name)} × ${item.qty} — ${formatMoney(item.price * item.qty)}`,
    );

    if (item.removedIngredients?.length) {
      const names = item.removedIngredients
        .map((r) => escapeHtml(r.name))
        .join(', ');
      lines.push(`  − без: ${names}`);
    }

    if (item.selectedExtras?.length) {
      const names = item.selectedExtras
        .map((e) => `${escapeHtml(e.name)} (+${formatMoney(e.price)})`)
        .join(', ');
      lines.push(`  + доп: ${names}`);
    }
  }

  lines.push('', `<b>Итого: ${formatMoney(order.total)}</b>`);

  return lines.join('\n');
}

export function buildStatusKeyboard(orderId: string, current: OrderStatus) {
  if (current === 'done' || current === 'cancelled') {
    return Markup.inlineKeyboard([]);
  }

  const buttons = STATUS_FLOW.filter((status) => status !== current).map(
    (status) =>
      Markup.button.callback(
        STATUS_LABELS[status],
        `order:${orderId}:status:${status}`,
      ),
  );

  const rows: ReturnType<typeof Markup.button.callback>[][] = [];
  for (let i = 0; i < buttons.length; i += 2) {
    rows.push(buttons.slice(i, i + 2));
  }

  rows.push([
    Markup.button.callback(
      '❌ Отменить',
      `order:${orderId}:status:cancelled`,
    ),
  ]);

  return Markup.inlineKeyboard(rows);
}

export function parseStatusCallback(
  data: string,
): { orderId: string; status: OrderStatus } | null {
  const match = /^order:(.+):status:(.+)$/.exec(data);
  if (!match) return null;

  const status = match[2] as OrderStatus;
  if (!(status in STATUS_LABELS)) return null;

  return { orderId: match[1], status };
}
