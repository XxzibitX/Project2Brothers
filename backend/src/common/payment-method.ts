import type { PaymentMethod } from '@prisma/client';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  card_courier: 'Картой курьеру',
  cash_courier: 'Наличными курьеру',
};
